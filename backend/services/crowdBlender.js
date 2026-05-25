import axios from 'axios';
import cron from 'node-cron';
import admin from 'firebase-admin';
import { getGeofenceCount } from './geofenceService.js';
import { getCachedScrapeCounts } from './scraperService.js';
import { getFirestoreDb } from './firebaseAdmin.js';
import { getPassCrowdStats } from './passCrowdStats.js';
import {
  levelToScore,
  scoreToLevel,
  scoreToCrowdPct,
  getSeasonCrowdScore,
  seasonScoreToLevel,
  passUtilizationToLevel,
  waitMinutesForCrowd,
  isDhamInSeason,
} from './crowdSignals.js';

const { FieldValue } = admin.firestore;

const ML_BASE =
  process.env.ML_SERVICE_URL || process.env.CROWD_ML_URL || 'http://localhost:5001';

const DHAMS = ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'];

export { levelToScore, scoreToLevel };

function gpsCountToLevel(count) {
  if (count < 25) return 'Low';
  if (count <= 90) return 'Medium';
  return 'High';
}

function scrapeCountToLevel(n) {
  if (n < 2500) return 'Low';
  if (n <= 7000) return 'Medium';
  return 'High';
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
      { timeout: 5000 },
    );
    if (data?.error === 'outside_season') {
      return {
        level: data.level || seasonScoreToLevel(getSeasonCrowdScore(dham, date)),
        confidence: data.confidence ?? 0.55,
      };
    }
    return {
      level: data.level || 'Medium',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
    };
  } catch {
    const seasonScore = getSeasonCrowdScore(dham, date);
    return {
      level: seasonScoreToLevel(seasonScore),
      confidence: 0.45,
      source: 'season_fallback',
    };
  }
}

/**
 * Dynamic weights — pass + season always considered during yatra season.
 */
function computeWeights(flags) {
  const { gps, scrape, ml, season } = flags;
  const parts = [];

  if (gps) parts.push(['gps', 0.32]);
  if (scrape) parts.push(['scrape', 0.22]);
  if (ml) parts.push(['ml', 0.18]);
  parts.push(['pass', 0.18]);
  if (season) parts.push(['season', 0.28]);

  const rawSum = parts.reduce((s, [, w]) => s + w, 0);
  const weights = { gps: 0, scrape: 0, ml: 0, pass: 0, season: 0 };
  for (const [k, w] of parts) {
    weights[k] = w / rawSum;
  }
  return weights;
}

export async function blendCrowdData(dham, date) {
  const dhamKey = String(dham || '').toLowerCase();
  const inSeason = isDhamInSeason(dhamKey, date);

  const passStats = await getPassCrowdStats(dhamKey, date);
  const passQuotaPct = passStats.utilization;
  const passLevel = passUtilizationToLevel(passQuotaPct, dhamKey, date);
  const seasonScore = getSeasonCrowdScore(dhamKey, date);
  const seasonLevel = seasonScoreToLevel(seasonScore);

  const settled = await Promise.allSettled([
    getGeofenceCount(dhamKey),
    getCachedScrapeCounts(),
    getMLPrediction(dhamKey, date, 0, passQuotaPct),
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

  const validPass = true;
  const validSeason = inSeason;

  const weights = computeWeights({
    gps: validGps,
    scrape: validScrape,
    ml: validMl,
    season: validSeason,
  });

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
    pass: {
      issued: passStats.issued,
      quota: passStats.quota,
      utilization: Math.round(passQuotaPct * 1000) / 1000,
      level: passLevel,
    },
    season: validSeason
      ? { score: Math.round(seasonScore * 100) / 100, level: seasonLevel }
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
  blendedScore += weights.pass * levelToScore(sources.pass.level);
  if (validSeason) {
    blendedScore += weights.season * seasonScore;
  }

  // Off-season with no live signals
  if (!validSeason && !validGps && !validScrape) {
    blendedScore = levelToScore(passLevel);
  }

  const finalLevel = scoreToLevel(blendedScore);
  const crowdPct = scoreToCrowdPct(blendedScore);
  const waitTimeMin = waitMinutesForCrowd(
    finalLevel,
    passQuotaPct,
    gpsCount,
  );
  const confidence = validMl && mlResult?.confidence
    ? Math.min(0.92, mlResult.confidence + (validGps ? 0.05 : 0) + (passQuotaPct > 0.1 ? 0.05 : 0))
    : validGps || validScrape
      ? 0.72
      : inSeason
        ? 0.65
        : 0.45;

  return {
    dham: dhamKey,
    date,
    finalLevel,
    crowdPct,
    blendedScore: Math.round(blendedScore * 100) / 100,
    waitTimeMin,
    confidence: Math.round(confidence * 100) / 100,
    sources,
    weights,
    inSeason,
    source: validGps || validScrape ? 'blended_live' : inSeason ? 'season_pass_model' : 'off_season',
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
