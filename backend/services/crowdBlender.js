import axios from 'axios';
import cron from 'node-cron';
import admin from 'firebase-admin';
import { getGeofenceCount } from './geofenceService.js';
import { getCachedScrapeCounts } from './scraperService.js';
import { getFirestoreDb } from './firebaseAdmin.js';

const { FieldValue } = admin.firestore;

const ML_BASE =
  process.env.ML_SERVICE_URL || process.env.CROWD_ML_URL || 'http://localhost:5001';

const DHAMS = ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'];

export function levelToScore(level) {
  if (level === 'Low') return 0;
  if (level === 'High') return 2;
  return 1;
}

export function scoreToLevel(score) {
  if (score < 0.6) return 'Low';
  if (score < 1.4) return 'Medium';
  return 'High';
}

function gpsCountToLevel(count) {
  if (count < 40) return 'Low';
  if (count <= 120) return 'Medium';
  return 'High';
}

function scrapeCountToLevel(n) {
  if (n < 3000) return 'Low';
  if (n <= 8000) return 'Medium';
  return 'High';
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function waitMinutesForLevel(level) {
  if (level === 'Low') return randomInt(15, 45);
  if (level === 'Medium') return randomInt(60, 150);
  return randomInt(180, 300);
}

export async function getMLPrediction(dham, date, weatherCode, passQuotaPct) {
  try {
    const { data } = await axios.post(
      `${ML_BASE}/predict`,
      {
        dham,
        date,
        weather_code: weatherCode,
        pass_quota_pct: passQuotaPct,
      },
      { timeout: 3000 },
    );
    if (data?.error === 'outside_season') {
      return { level: data.level || 'Medium', confidence: data.confidence ?? 0.5 };
    }
    return {
      level: data.level || 'Medium',
      confidence:
        typeof data.confidence === 'number' ? data.confidence : 0.5,
    };
  } catch {
    return { level: 'Medium', confidence: 0.5 };
  }
}

function computeWeights(validGps, validScrape, validMl) {
  if (validGps && validScrape && validMl) {
    return { gps: 0.4, scrape: 0.3, ml: 0.3 };
  }
  if (validGps && validScrape && !validMl) {
    return { gps: 0.55, scrape: 0.45, ml: 0 };
  }
  if (validGps && !validScrape && validMl) {
    return { gps: 0.5, scrape: 0, ml: 0.5 };
  }
  if (!validGps && validScrape && validMl) {
    return { gps: 0, scrape: 0.45, ml: 0.55 };
  }
  if (validGps && !validScrape && !validMl) {
    return { gps: 1, scrape: 0, ml: 0 };
  }
  if (!validGps && validScrape && !validMl) {
    return { gps: 0, scrape: 1, ml: 0 };
  }
  if (!validGps && !validScrape && validMl) {
    return { gps: 0, scrape: 0, ml: 1 };
  }
  return null;
}

export async function blendCrowdData(dham, date) {
  const dhamKey = String(dham || '').toLowerCase();

  const settled = await Promise.allSettled([
    getGeofenceCount(dhamKey),
    getCachedScrapeCounts(),
    getMLPrediction(dhamKey, date, 0, 0.5),
  ]);

  let gpsResult = null;
  if (settled[0].status === 'fulfilled') {
    gpsResult = settled[0].value;
  }

  let scrapePayload = null;
  if (settled[1].status === 'fulfilled') {
    scrapePayload = settled[1].value;
  }

  let mlResult = null;
  if (settled[2].status === 'fulfilled') {
    mlResult = settled[2].value;
  }

  const gpsCount = gpsResult?.count ?? 0;
  const validGps = settled[0].status === 'fulfilled' && gpsCount > 0;
  const scrapeNum =
    scrapePayload && typeof scrapePayload[dhamKey] === 'number'
      ? scrapePayload[dhamKey]
      : null;
  const validScrape = scrapeNum != null && !Number.isNaN(scrapeNum);
  const validMl =
    settled[2].status === 'fulfilled' &&
    mlResult &&
    ['Low', 'Medium', 'High'].includes(mlResult.level);

  const weights = computeWeights(validGps, validScrape, validMl);
  if (!weights) {
    return {
      dham: dhamKey,
      date,
      finalLevel: 'Medium',
      waitTimeMin: waitMinutesForLevel('Medium'),
      confidence: 0.3,
      sources: { gps: null, scrape: null, ml: null },
      weights: { gps: 0, scrape: 0, ml: 0 },
      source: 'default_fallback',
      updatedAt: new Date().toISOString(),
    };
  }

  const sources = {
    gps: validGps
      ? { count: gpsCount, level: gpsCountToLevel(gpsCount) }
      : null,
    scrape: validScrape
      ? { count: scrapeNum, level: scrapeCountToLevel(scrapeNum) }
      : null,
    ml: validMl
      ? { level: mlResult.level, confidence: mlResult.confidence }
      : null,
  };

  let blendedScore = 0;
  if (validGps) {
    blendedScore += weights.gps * levelToScore(sources.gps.level);
  }
  if (validScrape) {
    blendedScore += weights.scrape * levelToScore(sources.scrape.level);
  }
  if (validMl) {
    blendedScore += weights.ml * levelToScore(sources.ml.level);
  }

  const finalLevel = scoreToLevel(blendedScore);
  const waitTimeMin = waitMinutesForLevel(finalLevel);
  const confidence =
    validMl && mlResult ? mlResult.confidence : 0.5;

  return {
    dham: dhamKey,
    date,
    finalLevel,
    waitTimeMin,
    confidence,
    sources,
    weights,
    updatedAt: new Date().toISOString(),
  };
}

export async function blendAllDhams(date) {
  const entries = await Promise.all(
    DHAMS.map(async (d) => {
      const b = await blendCrowdData(d, date);
      return [d, b];
    }),
  );
  return Object.fromEntries(entries);
}

export async function updateCrowdFirestore() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const blended = await blendAllDhams(dateStr);
  const db = getFirestoreDb();
  if (!db) {
    console.warn('[crowdBlender] Firestore unavailable; skip write');
    return;
  }

  const dhamsSummary = {};
  for (const d of DHAMS) {
    dhamsSummary[d] = blended[d].finalLevel;
    await db.collection('crowd_data').doc(d).set(blended[d], { merge: true });
  }

  await db.collection('crowd_data').doc('_summary').set(
    {
      lastUpdated: FieldValue.serverTimestamp(),
      dhams: dhamsSummary,
    },
    { merge: true },
  );
}

let crowdCronStarted = false;

export function scheduleCrowdBlendCron() {
  if (crowdCronStarted) return;
  crowdCronStarted = true;
  const mins = parseInt(process.env.CROWD_UPDATE_INTERVAL_MINUTES || '5', 10) || 5;
  const expr = mins === 5 ? '*/5 * * * *' : `*/${mins} * * * *`;
  cron.schedule(expr, async () => {
    const ts = new Date().toISOString();
    try {
      await updateCrowdFirestore();
      console.log(`[crowdBlender] updateCrowdFirestore ok ${ts}`);
    } catch (e) {
      console.error(`[crowdBlender] updateCrowdFirestore error ${ts}`, e.message);
    }
  });
  console.log(`[crowdBlender] cron scheduled (${expr})`);
}
