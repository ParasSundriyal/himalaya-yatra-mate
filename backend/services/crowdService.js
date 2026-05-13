import axios from 'axios';
import { getFirestoreDb } from './firebaseAdmin.js';

const DHAMS = ['Yamunotri', 'Gangotri', 'Kedarnath', 'Badrinath'];

const DOC_ID = {
  Yamunotri: 'yamunotri',
  Gangotri: 'gangotri',
  Kedarnath: 'kedarnath',
  Badrinath: 'badrinath',
};

const ML_URL =
  process.env.ML_SERVICE_URL ||
  process.env.CROWD_ML_URL ||
  'http://127.0.0.1:5001';

const STALE_MS = 3 * 60 * 60 * 1000;

function toDate(ts) {
  if (!ts) return null;
  if (ts.toDate && typeof ts.toDate === 'function') {
    return ts.toDate();
  }
  if (ts._seconds != null) {
    return new Date(ts._seconds * 1000);
  }
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(ts);
}

/**
 * Read blended crowd from Firestore crowd_data/{dham} (written by crowdBlender), else ML fallback.
 * @returns {Promise<{ crowdMap: Record<string, { level: string, waitTimeMin: number, timestamp: Date }>, alerts: string[] }>}
 */
export async function fetchCrowdMap(startDateStr) {
  const crowdMap = {};
  const alerts = [];
  const db = getFirestoreDb();

  for (const dham of DHAMS) {
    let usedFirestore = false;
    try {
      if (db) {
        const snap = await db
          .collection('crowd_data')
          .doc(DOC_ID[dham])
          .get();

        if (snap.exists) {
          const doc = snap.data();
          const ts = toDate(doc.updatedAt);
          const ageMs = ts ? Date.now() - ts.getTime() : Infinity;
          const levelRaw = doc.finalLevel ?? doc.level ?? 'Medium';
          const level =
            typeof levelRaw === 'string'
              ? levelRaw.charAt(0).toUpperCase() +
                levelRaw.slice(1).toLowerCase()
              : 'Medium';
          const normalized =
            level === 'Low' || level === 'High' || level === 'Medium'
              ? level
              : 'Medium';

          if (ts && ageMs < STALE_MS) {
            crowdMap[dham] = {
              level: normalized,
              waitTimeMin: doc.waitTimeMin ?? doc.wait_min ?? 45,
              timestamp: ts,
            };
            usedFirestore = true;
          }
        }
      }
    } catch {
      // fall through to ML
    }

    if (!usedFirestore) {
      try {
        const { data } = await axios.post(
          `${ML_URL}/predict`,
          {
            dham: DOC_ID[dham],
            date: startDateStr,
            weather_code: 0,
            pass_quota_pct: 0.5,
          },
          { timeout: 5000 },
        );
        const lv = data.level || 'Medium';
        crowdMap[dham] = {
          level: lv,
          waitTimeMin: data.waitTimeMin ?? 45,
          timestamp: new Date(),
        };
      } catch {
        crowdMap[dham] = {
          level: 'Medium',
          waitTimeMin: 45,
          timestamp: new Date(),
        };
        alerts.push(
          `Crowd data unavailable for ${dham}; using estimated levels.`,
        );
      }
    }
  }

  return { crowdMap, alerts };
}
