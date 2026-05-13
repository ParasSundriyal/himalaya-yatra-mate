import express from 'express';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { getFirestoreDb } from '../services/firebaseAdmin.js';

const router = express.Router();

const ML_BASE =
  process.env.ML_SERVICE_URL || process.env.CROWD_ML_URL || 'http://localhost:5001';

const DHAMS = ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'];

router.get(
  '/live',
  authenticate,
  async (req, res) => {
    try {
      res.set('Cache-Control', 'max-age=60');
      const db = getFirestoreDb();
      if (!db) {
        return res.status(503).json({ message: 'Firestore unavailable' });
      }
      const snaps = await Promise.all(
        DHAMS.map((d) => db.collection('crowd_data').doc(d).get()),
      );
      const out = {};
      snaps.forEach((snap, i) => {
        const id = DHAMS[i];
        out[id] = snap.exists ? snap.data() : null;
      });
      res.json(out);
    } catch (e) {
      console.error('[crowd/live]', e.message);
      res.status(500).json({ message: 'Failed to load crowd data' });
    }
  },
);

router.get('/live/:dhamName', authenticate, async (req, res) => {
    try {
      res.set('Cache-Control', 'max-age=60');
      const id = String(req.params.dhamName).toLowerCase();
      const db = getFirestoreDb();
      if (!db) {
        return res.status(503).json({ message: 'Firestore unavailable' });
      }
      const snap = await db.collection('crowd_data').doc(id).get();
      if (!snap.exists) {
        return res.status(404).json({ message: 'Not found' });
      }
      res.json(snap.data());
    } catch (e) {
      console.error('[crowd/live/:dham]', e.message);
      res.status(500).json({ message: 'Failed to load crowd data' });
    }
});

router.post(
  '/predict',
  authenticate,
  [
    body('dham').isString(),
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/),
    body('weather_code').optional().isInt(),
    body('pass_quota_pct').optional().isFloat({ min: 0, max: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { data } = await axios.post(`${ML_BASE}/predict`, req.body, {
        timeout: 5000,
      });
      res.json(data);
    } catch (e) {
      console.error('[crowd/predict]', e.message);
      res
        .status(502)
        .json({ level: 'Medium', confidence: 0.5, message: 'ML service unavailable' });
    }
  },
);

function addDaysStr(isoDate, n) {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

router.post(
  '/predict-range',
  authenticate,
  [
    body('dham').isString(),
    body('startDate').matches(/^\d{4}-\d{2}-\d{2}$/),
    body('days').isInt({ min: 1, max: 14 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { dham, startDate, days } = req.body;
      const n = Math.min(14, parseInt(days, 10));
      const requests = [];
      for (let i = 0; i < n; i += 1) {
        requests.push({
          dham,
          date: addDaysStr(startDate, i),
          weather_code: req.body.weather_code ?? 0,
          pass_quota_pct: req.body.pass_quota_pct ?? 0.5,
        });
      }
      const { data } = await axios.post(
        `${ML_BASE}/predict-batch`,
        { requests },
        { timeout: 15000 },
      );
      res.json(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[crowd/predict-range]', e.message);
      res.status(502).json([]);
    }
  },
);

export default router;
