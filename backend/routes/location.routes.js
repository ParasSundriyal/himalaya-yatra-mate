import express from 'express';
import admin from 'firebase-admin';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { syncUserLocationToFirestore } from '../services/userLocationFirestoreSync.js';
import { getFirestoreDb } from '../services/firebaseAdmin.js';
import { resolveDhamForPoint } from '../services/geofenceService.js';

const { FieldValue } = admin.firestore;

const router = express.Router();

/**
 * POST /api/location/update
 * Upserts active_user_locations/{pilgrimId} for geofence crowd blending.
 */
router.post(
  '/update',
  authenticate,
  [body('lat').isFloat(), body('lng').isFloat()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const pilgrimId = req.user.pilgrimId || String(req.user._id);
      const lat = Number(req.body.lat);
      const lng = Number(req.body.lng);
      const dham = resolveDhamForPoint(lat, lng);

      const db = getFirestoreDb();
      if (!db) {
        return res.json({ success: true, skipped: true });
      }

      await db
        .collection('active_user_locations')
        .doc(pilgrimId)
        .set(
          {
            pilgrimId,
            lat,
            lng,
            dham,
            timestamp: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      return res.json({ success: true });
    } catch (err) {
      console.error('[location/update]', err.message);
      return res.status(500).json({ success: false });
    }
  },
);

/**
 * POST /api/location/ping
 * Authenticated: sends current device location; server writes geohashes to Firestore only.
 */
router.post(
  '/ping',
  authenticate,
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('accuracyMeters').optional().isFloat({ min: 0, max: 50000 }),
    body('source')
      .optional()
      .isIn(['login', 'register', 'interval', 'foreground', 'session', 'unknown']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { latitude, longitude, accuracyMeters, source } = req.body;

      const result = await syncUserLocationToFirestore(
        req.user,
        { latitude, longitude, accuracyMeters },
        source || 'unknown',
      );

      if (!result.ok) {
        return res.status(200).json({
          accepted: false,
          reason: result.reason,
          message:
            result.reason === 'out_of_bounds'
              ? 'Location outside supported region; not stored.'
              : 'Location not stored.',
        });
      }

      res.json({
        accepted: true,
        firestoreSynced: true,
        geohash5: result.geohash5,
      });
    } catch (err) {
      console.error('[location/ping]', err.message);
      res.status(500).json({ message: 'Location ping failed', error: err.message });
    }
  },
);

export default router;
