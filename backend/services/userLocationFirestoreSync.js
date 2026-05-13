import admin from 'firebase-admin';
import { getFirestoreDb } from './firebaseAdmin.js';
import { isPlausibleIndiaRegion, toGeohash } from '../utils/locationPrivacy.js';

const { FieldValue } = admin.firestore;

const COLLECTION =
  process.env.FIRESTORE_LOCATION_COLLECTION || 'user_location_pings';

/**
 * Store / update coarse location for crowd analytics (geohashes only, no raw lat/lng in Firestore).
 * Document id = Mongo user id so pings work before pilgrim registration.
 *
 * @param {object} user - Mongoose user (req.user)
 * @param {{ latitude: number, longitude: number, accuracyMeters?: number }} locationCapture
 * @param {string} [source] - login | interval | foreground | session | register | unknown
 */
export async function syncUserLocationToFirestore(
  user,
  locationCapture,
  source = 'unknown',
) {
  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, reason: 'firestore_disabled' };
  }

  const uid = user._id?.toString();
  if (!uid) {
    return { ok: false, reason: 'no_user_id' };
  }

  if (
    !locationCapture ||
    typeof locationCapture.latitude !== 'number' ||
    typeof locationCapture.longitude !== 'number'
  ) {
    return { ok: false, reason: 'invalid_location' };
  }

  const { latitude, longitude } = locationCapture;
  if (!isPlausibleIndiaRegion(latitude, longitude)) {
    return { ok: false, reason: 'out_of_bounds' };
  }

  let accuracy = null;
  if (
    typeof locationCapture.accuracyMeters === 'number' &&
    Number.isFinite(locationCapture.accuracyMeters)
  ) {
    accuracy = Math.round(
      Math.min(50000, Math.max(0, locationCapture.accuracyMeters)),
    );
  }

  const geohash5 = toGeohash(latitude, longitude, 5);
  const geohash6 = toGeohash(latitude, longitude, 6);

  const safeSource = String(source || 'unknown').slice(0, 64);

  const ref = db.collection(COLLECTION).doc(uid);
  await ref.set(
    {
      mongoUserId: uid,
      pilgrimId: user.pilgrimId || null,
      geohash5,
      geohash6,
      lastAccuracyM: accuracy,
      lastSource: safeSource,
      lastPingAt: FieldValue.serverTimestamp(),
      pingCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true, geohash5, geohash6 };
}
