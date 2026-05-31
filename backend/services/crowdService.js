import axios from 'axios';
import { getFirestoreDb } from './firebaseAdmin.js';
import { getPassCrowdStats } from './passCrowdStats.js';
import {
  getSeasonCrowdScore,
  scoreToLevel,
  passUtilizationToLevel,
  levelToScore,
} from './crowdSignals.js';
import { weatherMainToCode } from './weatherService.js';

const DHAMS = ['Yamunotri', 'Gangotri', 'Kedarnath', 'Badrinath'];

const DOC_ID = {
  Yamunotri: 'yamunotri',
  Gangotri: 'gangotri',
  Kedarnath: 'kedarnath',
  Badrinath: 'badrinath',
};

const KEY_TO_DISPLAY = {
  yamunotri: 'Yamunotri',
  gangotri: 'Gangotri',
  kedarnath: 'Kedarnath',
  badrinath: 'Badrinath',
};

const ML_URL =
  process.env.ML_SERVICE_URL ||
  process.env.CROWD_ML_URL ||
  'http://127.0.0.1:5001';

const STALE_MS = 6 * 60 * 60 * 1000;

function toDate(ts) {
  if (!ts) return null;
  if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate();
  if (ts._seconds != null) return new Date(ts._seconds * 1000);
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(ts);
}

function normLevel(levelRaw) {
  const level =
    typeof levelRaw === 'string'
      ? levelRaw.charAt(0).toUpperCase() + levelRaw.slice(1).toLowerCase()
      : 'Medium';
  return level === 'Low' || level === 'High' || level === 'Medium' ? level : 'Medium';
}

function worstLevel(a, b) {
  const order = { Low: 0, Medium: 1, High: 2 };
  return (order[a] ?? 1) >= (order[b] ?? 1) ? a : b;
}

async function readFirestoreCrowd(dham) {
  const db = getFirestoreDb();
  if (!db) return null;
  try {
    const snap = await db.collection('crowd_data').doc(DOC_ID[dham]).get();
    if (!snap.exists) return null;
    const doc = snap.data();
    const ts = toDate(doc.updatedAt);
    const ageMs = ts ? Date.now() - ts.getTime() : Infinity;
    return {
      level: normLevel(doc.finalLevel ?? doc.level),
      waitTimeMin: doc.waitTimeMin ?? doc.wait_min ?? 45,
      timestamp: ts,
      ageMs,
      stale: ageMs >= STALE_MS,
      source: 'firestore',
    };
  } catch (e) {
    console.warn(`[crowd] Firestore read failed for ${dham}:`, e.message);
    return null;
  }
}

async function predictCrowdMl(dhamKey, dateStr, weatherCode, passQuotaPct) {
  const { data } = await axios.post(
    `${ML_URL}/predict`,
    {
      dham: dhamKey,
      date: dateStr,
      weather_code: weatherCode,
      pass_quota_pct: passQuotaPct,
    },
    { timeout: 8000 },
  );
  return {
    level: normLevel(data.level),
    waitTimeMin: data.waitTimeMin ?? 45,
    timestamp: new Date(),
    source: 'ml',
  };
}

function seasonPassEstimate(dhamKey, dateStr, passStats, _alerts, dhamDisplay) {
  const season = getSeasonCrowdScore(dhamKey, dateStr);
  const passLv = passUtilizationToLevel(passStats.utilization, dhamKey, dateStr);
  const blended = season * 0.55 + levelToScore(passLv) * 0.45;
  console.warn(`[crowd] ${dhamDisplay} ${dateStr}: season + pass estimate (ML offline)`);
  return {
    level: scoreToLevel(blended),
    waitTimeMin: 45,
    timestamp: new Date(),
    source: 'season',
  };
}

/**
 * Per-dham crowd for trip dates (ML + Firestore + season), awaited before decision tree.
 */
export async function fetchCrowdMapForTrip({
  startDate,
  dayDates = [],
  dhamKeys = [],
  weatherMap = {},
}) {
  const crowdMap = {};
  const alerts = [];
  const keys = dhamKeys.length
    ? dhamKeys.map((k) => KEY_TO_DISPLAY[String(k).toLowerCase()] || k)
    : DHAMS;
  const dates = [...new Set([startDate, ...dayDates])].slice(0, 16);

  for (const dham of DHAMS) {
    if (!keys.includes(dham)) continue;

    const dhamKey = DOC_ID[dham];
    const fsSnap = await readFirestoreCrowd(dham);
    if (fsSnap && !fsSnap.stale) {
      console.log(`[crowd] Live Firestore snapshot for ${dham}`);
    } else if (fsSnap?.stale) {
      console.log(`[crowd] Stale Firestore for ${dham} — using ML per day`);
    }

    let passStats = { utilization: 0.5, issued: 0, quota: 0 };
    try {
      passStats = await getPassCrowdStats(dhamKey, startDate);
    } catch (e) {
      console.warn(`[crowd] pass stats ${dham}:`, e.message);
    }

    const byDate = {};
    let tripLevel = 'Low';

    for (const dateStr of dates) {
      const wCell = weatherMap[dham]?.[dateStr];
      const weatherCode =
        wCell?.weatherCode ?? weatherMainToCode(wCell?.condition);

      let dayCrowd = null;
      try {
        dayCrowd = await predictCrowdMl(
          dhamKey,
          dateStr,
          weatherCode,
          passStats.utilization,
        );
      } catch (e) {
        console.warn(`[crowd] ML ${dham} ${dateStr}:`, e.message);
        dayCrowd = seasonPassEstimate(
          dhamKey,
          dateStr,
          passStats,
          alerts,
          dham,
        );
      }

      if (fsSnap && !fsSnap.stale && dateStr === startDate) {
        dayCrowd = {
          ...dayCrowd,
          level: fsSnap.level,
          waitTimeMin: fsSnap.waitTimeMin,
          source: 'firestore',
        };
      }

      byDate[dateStr] = dayCrowd;
      tripLevel = worstLevel(tripLevel, dayCrowd.level);
    }

    const startEntry = byDate[startDate] || Object.values(byDate)[0];
    crowdMap[dham] = {
      level: tripLevel,
      waitTimeMin: startEntry?.waitTimeMin ?? 45,
      timestamp: startEntry?.timestamp ?? new Date(),
      byDate,
      source: startEntry?.source || 'ml',
    };
  }

  return { crowdMap, alerts: [...new Set(alerts)] };
}

/** @deprecated use fetchCrowdMapForTrip — kept for dashboard/chatbot */
export async function fetchCrowdMap(startDateStr) {
  return fetchCrowdMapForTrip({
    startDate: startDateStr,
    dayDates: [startDateStr],
    dhamKeys: ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'],
    weatherMap: {},
  });
}
