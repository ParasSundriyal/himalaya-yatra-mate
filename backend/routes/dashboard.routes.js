import express from 'express';
import axios from 'axios';
import DhamPass from '../models/DhamPass.model.js';
import { predictCrowd } from '../utils/crowdPredict.js';
import { getOpenWeatherApiKey } from '../services/weatherService.js';
import { getFirestoreDb } from '../services/firebaseAdmin.js';

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

function crowdBarFromLevel(level) {
  if (level === 'High') return { level: 'High', pct: 90, color: '#DC2626' };
  if (level === 'Low') return { level: 'Low', pct: 30, color: '#059669' };
  return { level: 'Medium', pct: 60, color: '#D97706' };
}

function normCrowdLevel(raw) {
  if (!raw || typeof raw !== 'string') return 'Medium';
  const x =
    raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (x === 'Low' || x === 'Medium' || x === 'High') return x;
  return 'Medium';
}

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

      let level = 'Medium';
      let confidence = 0.5;
      let waitMins = 30;
      const snap = fireSnaps[i];
      if (snap?.exists) {
        const fd = snap.data();
        level = normCrowdLevel(fd.finalLevel);
        confidence =
          typeof fd.confidence === 'number' ? fd.confidence : 0.5;
        waitMins =
          typeof fd.waitTimeMin === 'number'
            ? fd.waitTimeMin
            : level === 'High'
              ? 120
              : level === 'Low'
                ? 25
                : 45;
      } else {
        const pred = await predictCrowd({
          dham: CROWD_DOC_ID[dham],
          date: dateStr,
          weather_code: 0,
          pass_quota_pct: 0.5,
        });
        level = pred.level;
        confidence = pred.confidence;
        waitMins =
          level === 'High' ? 120 : level === 'Low' ? 25 : 45;
      }

      const bar = crowdBarFromLevel(level);
      const coords = DHAM_COORDS[dham];
      const temp = await fetchTemperature(coords.lat, coords.lon);
      const roadStatus = level === 'High' ? 'caution' : 'open';

      cards.push({
        dham,
        crowd: bar,
        passesToday: issuedToday,
        temperatureC: temp.c,
        weatherSource: temp.source,
        waitTimeMins: waitMins,
        roadStatus,
        predictionConfidence: confidence,
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
