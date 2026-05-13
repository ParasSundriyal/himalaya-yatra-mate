import admin from 'firebase-admin';
import { getFirestoreDb } from './firebaseAdmin.js';

const { Timestamp } = admin.firestore;

const DHAMS = {
  yamunotri: { lat: 30.9993, lon: 78.4546, radius: 500 },
  gangotri: { lat: 30.9946, lon: 78.9394, radius: 500 },
  kedarnath: { lat: 30.7346, lon: 79.0669, radius: 600 },
  badrinath: { lat: 30.7433, lon: 79.4938, radius: 500 },
};

const EARTH_RADIUS_M = 6371000;

/** Reuse one snapshot when getGeofenceCount runs in parallel (e.g. blendAllDhams). */
let recentSnapshotPromise = null;
let recentSnapshotExpires = 0;
const SNAPSHOT_REUSE_MS = 750;

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lon2 - lon1);
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

function resolveDhamForPoint(lat, lng) {
  let bestInside = null;
  let bestInsideDist = Infinity;
  for (const [name, cfg] of Object.entries(DHAMS)) {
    const d = haversineDistance(lat, lng, cfg.lat, cfg.lon);
    if (d <= cfg.radius && d < bestInsideDist) {
      bestInsideDist = d;
      bestInside = name;
    }
  }
  if (bestInside) {
    return bestInside;
  }
  let nearest = null;
  let nearestDist = Infinity;
  for (const [name, cfg] of Object.entries(DHAMS)) {
    const d = haversineDistance(lat, lng, cfg.lat, cfg.lon);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = name;
    }
  }
  return nearest;
}

export { resolveDhamForPoint };

/**
 * All locations updated in the last 30 minutes (any dham).
 * Single-field range query — no composite index on (dham, timestamp).
 */
async function getRecentLocationSnapshot(db) {
  const nowMs = Date.now();
  if (recentSnapshotPromise && nowMs < recentSnapshotExpires) {
    return recentSnapshotPromise;
  }
  const since = Timestamp.fromMillis(nowMs - 30 * 60 * 1000);
  recentSnapshotExpires = nowMs + SNAPSHOT_REUSE_MS;
  recentSnapshotPromise = db
    .collection('active_user_locations')
    .where('timestamp', '>=', since)
    .get()
    .catch((e) => {
      recentSnapshotPromise = null;
      recentSnapshotExpires = 0;
      throw e;
    });
  return recentSnapshotPromise;
}

function countDocsInGeofence(snap, dhamKey) {
  const key = String(dhamKey || '').toLowerCase();
  const cfg = DHAMS[key];
  if (!cfg) return 0;
  let count = 0;
  snap.forEach((doc) => {
    const data = doc.data();
    const docDham = String(data.dham || '').toLowerCase();
    if (docDham !== key) {
      return;
    }
    const lat = data.lat;
    const lng = data.lng ?? data.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return;
    }
    const dist = haversineDistance(lat, lng, cfg.lat, cfg.lon);
    if (dist <= cfg.radius) {
      count += 1;
    }
  });
  return count;
}

export async function getGeofenceCount(dhamName) {
  const key = String(dhamName || '').toLowerCase();
  const cfg = DHAMS[key];
  const now = new Date();
  if (!cfg) {
    return { dham: dhamName, count: 0, timestamp: now.toISOString() };
  }

  const db = getFirestoreDb();
  if (!db) {
    return { dham: key, count: 0, timestamp: now.toISOString() };
  }

  let snap;
  try {
    snap = await getRecentLocationSnapshot(db);
  } catch (e) {
    console.error('[geofence] query failed', e.message);
    return { dham: key, count: 0, timestamp: now.toISOString() };
  }

  const count = countDocsInGeofence(snap, key);
  return { dham: key, count, timestamp: now.toISOString() };
}

export async function getAllGeofenceCounts() {
  const db = getFirestoreDb();
  const now = new Date().toISOString();
  const names = Object.keys(DHAMS);
  const out = {};
  if (!db) {
    for (const n of names) {
      out[n] = 0;
    }
    return out;
  }
  let snap;
  try {
    snap = await getRecentLocationSnapshot(db);
  } catch (e) {
    console.error('[geofence] query failed', e.message);
    for (const n of names) {
      out[n] = 0;
    }
    return out;
  }
  for (const n of names) {
    out[n] = countDocsInGeofence(snap, n);
  }
  return out;
}
