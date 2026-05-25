import express from 'express';
import axios from 'axios';
import DhamPass from '../models/DhamPass.model.js';
import { predictCrowd } from '../utils/crowdPredict.js';
import { getOpenWeatherApiKey } from '../services/weatherService.js';
import { getFirestoreDb } from '../services/firebaseAdmin.js';
import {
  scoreToCrowdPct,
  crowdColorForLevel,
  levelToScore,
  scoreToLevel,
  passUtilizationToLevel,
  getSeasonCrowdScore,
  waitMinutesForCrowd,
} from '../services/crowdSignals.js';
import { getPassCrowdStats } from '../services/passCrowdStats.js';

const router = express.Router();

const DHAMS = ['Yamunotri', 'Gangotri', 'Kedarnath', 'Badrinath'];

const CROWD_DOC_ID = {
  Yamunotri: 'yamunotri',
  Gangotri: 'gangotri',
  Kedarnath: 'kedarnath',
  Badrinath: 'badrinath',
};

/** Rough coords for weather lookup */
const DHAM_COORDS = {
  Yamunotri: { lat: 31.059, lon: 78.445 },
  Gangotri: { lat: 30.995, lon: 78.94 },
  Kedarnath: { lat: 30.735, lon: 79.066 },
  Badrinath: { lat: 30.74, lon: 79.49 },
};

async function fetchTemperature(lat, lon) {
  const key = getOpenWeatherApiKey();
  if (!key) {
    return { c: null, source: 'mock' };
  }
  try {
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat, lon, appid: key, units: 'metric' },
      timeout: 5000,
    });
    return { c: data.main?.temp ?? null, source: 'openweathermap' };
  } catch {
    return { c: null, source: 'unavailable' };
  }
}

function crowdBarFromBlend(level, firestoreDoc, passUtilization = 0) {
  let pct =
    typeof firestoreDoc?.crowdPct === 'number'
      ? firestoreDoc.crowdPct
      : typeof firestoreDoc?.blendedScore === 'number'
        ? scoreToCrowdPct(firestoreDoc.blendedScore)
        : scoreToCrowdPct(levelToScore(level));
  if (passUtilization >= 0.7 && pct < 75) {
    pct = Math.max(pct, 78);
  }
  return {
    level,
    pct: Math.min(96, Math.max(12, Math.round(pct))),
    color: crowdColorForLevel(level),
  };
}

function normCrowdLevel(raw) {
  if (!raw || typeof raw !== 'string') return 'Medium';
  const x =
    raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (x === 'Low' || x === 'Medium' || x === 'High') return x;
  return 'Medium';
}

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Live dashboard data and statistics
 */

/**
 * GET /api/dashboard/live
 * Uses Firestore crowd_data when present; Mongo pass counts + weather unchanged.
 */
router.get('/live', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = today.toISOString().slice(0, 10);
    const db = getFirestoreDb();
    let fireSnaps = [];
    if (db) {
      fireSnaps = await Promise.all(
        DHAMS.map((dham) =>
          db.collection('crowd_data').doc(CROWD_DOC_ID[dham]).get(),
        ),
      );
    }

    const cards = [];

    for (let i = 0; i < DHAMS.length; i += 1) {
      const dham = DHAMS[i];
      const issuedToday = await DhamPass.countDocuments({
        dham,
        visitDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['active', 'used'] },
      });

      const dhamKey = CROWD_DOC_ID[dham];
      const passStats = await getPassCrowdStats(dhamKey, dateStr);
      const passUtil = passStats.utilization;

      let level = 'Medium';
      let confidence = 0.5;
      let waitMins = 30;
      let fireDoc = null;
      const snap = fireSnaps[i];
      if (snap?.exists) {
        fireDoc = snap.data();
        level = normCrowdLevel(fireDoc.finalLevel);
        confidence =
          typeof fireDoc.confidence === 'number' ? fireDoc.confidence : 0.65;
        waitMins =
          typeof fireDoc.waitTimeMin === 'number'
            ? fireDoc.waitTimeMin
            : waitMinutesForCrowd(level, passUtil, fireDoc.sources?.gps?.count ?? 0);
      } else {
        const seasonScore = getSeasonCrowdScore(dhamKey, dateStr);
        const passLevel = passUtilizationToLevel(passUtil, dhamKey, dateStr);
        let blended = levelToScore(passLevel) * 0.45 + seasonScore * 0.55;
        try {
          const pred = await predictCrowd({
            dham: dhamKey,
            date: dateStr,
            weather_code: 0,
            pass_quota_pct: passUtil,
          });
          if (pred?.level) {
            blended = blended * 0.6 + levelToScore(pred.level) * 0.4;
            confidence = pred.confidence ?? 0.55;
          }
        } catch {
          confidence = 0.6;
        }
        level = scoreToLevel(blended);
        waitMins = waitMinutesForCrowd(level, passUtil, 0);
        fireDoc = { blendedScore: blended, crowdPct: scoreToCrowdPct(blended) };
      }

      const bar = crowdBarFromBlend(level, fireDoc, passUtil);
      const coords = DHAM_COORDS[dham];
      const temp = await fetchTemperature(coords.lat, coords.lon);
      const roadStatus = level === 'High' ? 'caution' : 'open';

      cards.push({
        dham,
        crowd: bar,
        passesToday: issuedToday,
        passQuota: passStats.quota,
        passUtilizationPct: Math.round(passUtil * 100),
        temperatureC: temp.c,
        weatherSource: temp.source,
        waitTimeMins: waitMins,
        roadStatus,
        predictionConfidence: confidence,
        dataSource: fireDoc?.source || (snap?.exists ? 'firestore' : 'computed'),
      });
    }

    res.json({
      lastUpdated: new Date().toISOString(),
      cards,
    });
  } catch (error) {
    console.error('Dashboard live error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
