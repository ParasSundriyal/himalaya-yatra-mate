import admin from 'firebase-admin';
import { getFirestoreDb } from './firebaseAdmin.js';

const { FieldValue } = admin.firestore;
import { isPlausibleIndiaRegion, toGeohash } from '../utils/locationPrivacy.js';
import {
  vehicleCategoryFromType,
  groupSizeBand,
} from '../utils/vehicleCategory.js';

const COLLECTION =
  process.env.FIRESTORE_PILGRIM_COLLECTION || 'pilgrim_crowd_signals';

/**
 * Write a privacy-preserving registration snapshot for crowd / regional analytics.
 * Does not store: name, email, phone, Aadhaar, exact GPS, or vehicle registration plate.
 *
 * @param {object} params
 * @param {object} params.user - Mongoose user document after save
 * @param {{ latitude: number, longitude: number, accuracyMeters?: number } | null} params.locationCapture - raw coords only used in-memory to derive geohash
 */
export async function syncPilgrimToFirestore(user, locationCapture = null) {
  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, reason: 'firestore_disabled' };
  }

  const pilgrimId = user.pilgrimId;
  if (!pilgrimId) {
    return { ok: false, reason: 'no_pilgrim_id' };
  }

  let geohash5 = null;
  let geohash6 = null;
  let locationAccuracyM = null;

  if (
    locationCapture &&
    typeof locationCapture.latitude === 'number' &&
    typeof locationCapture.longitude === 'number' &&
    isPlausibleIndiaRegion(locationCapture.latitude, locationCapture.longitude)
  ) {
    geohash5 = toGeohash(locationCapture.latitude, locationCapture.longitude, 5);
    geohash6 = toGeohash(locationCapture.latitude, locationCapture.longitude, 6);
    if (
      typeof locationCapture.accuracyMeters === 'number' &&
      Number.isFinite(locationCapture.accuracyMeters)
    ) {
      locationAccuracyM = Math.round(
        Math.min(50000, Math.max(0, locationCapture.accuracyMeters)),
      );
    }
  }

  const v = user.vehicle || {};
  const vehicleCategory = vehicleCategoryFromType(v.vehicleType);
  const passengerCount =
    vehicleCategory === 'none'
      ? 0
      : Math.min(20, Math.max(0, Number(v.passengers) || 0));

  const group = user.groupInfo;
  const hasGroup = !!(group && group.name);
  const groupSizeBandVal = hasGroup
    ? groupSizeBand(group.size)
    : null;

  const ref = db.collection(COLLECTION).doc(pilgrimId);
  const snap = await ref.get();

  const doc = {
    pilgrimId,
    homeState: user.homeState || null,
    gender: user.gender || null,
    fitnessLevel: user.fitnessLevel || null,
    healthConditionCount: Array.isArray(user.healthConditions)
      ? user.healthConditions.length
      : 0,
    vehicleCategory,
    passengerCount,
    hasGroup,
    groupSizeBand: groupSizeBandVal,
    geohash5,
    geohash6,
    locationAccuracyM,
    source: 'mobile_registration',
    schemaVersion: 1,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!snap.exists) {
    doc.registeredAt = FieldValue.serverTimestamp();
  }

  await ref.set(doc, { merge: true });

  return { ok: true, geohash5, geohash6 };
}
