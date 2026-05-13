import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.middleware.js';
import DhamPass from '../models/DhamPass.model.js';
import User from '../models/User.model.js';

const router = express.Router();

// Dham open season dates (approximate - can be adjusted yearly)
const DHAM_SEASONS = {
  Yamunotri:  { open: { month: 4, day: 22 }, close: { month: 10, day: 31 } },
  Gangotri:   { open: { month: 4, day: 22 }, close: { month: 10, day: 31 } },
  Kedarnath:  { open: { month: 4, day: 29 }, close: { month: 10, day: 31 } },
  Badrinath:  { open: { month: 4, day: 27 }, close: { month: 10, day: 31 } },
};

const DAILY_QUOTA = {
  Yamunotri: 2000,
  Gangotri:  3000,
  Kedarnath: 1500,
  Badrinath: 5000,
};

function isDhamOpen(dham, visitDate) {
  const season = DHAM_SEASONS[dham];
  if (!season) return false;
  const d = new Date(visitDate);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const openMonth = season.open.month;
  const closeMonth = season.close.month;
  if (month > openMonth && month < closeMonth) return true;
  if (month === openMonth && day >= season.open.day) return true;
  if (month === closeMonth && day <= season.close.day) return true;
  return false;
}

// POST /api/passes - Create a new dham pass
router.post('/', authenticate, async (req, res) => {
  try {
    const { dham, visitDate } = req.body;
    const userId = req.user._id;

    if (!dham || !visitDate) {
      return res.status(400).json({ message: 'Dham and visitDate are required' });
    }

    if (!isDhamOpen(dham, visitDate)) {
      return res.status(400).json({ message: `${dham} is closed on the selected date. Season: May–November.` });
    }

    // Check daily quota
    const visitDay = new Date(visitDate);
    visitDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(visitDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = await DhamPass.countDocuments({
      dham,
      visitDate: { $gte: visitDay, $lt: nextDay },
      status: { $in: ['active', 'used'] },
    });

    if (count >= DAILY_QUOTA[dham]) {
      return res.status(400).json({ message: `Daily quota of ${DAILY_QUOTA[dham]} for ${dham} is full on this date.` });
    }

    // Check if user already has a pass for this dham
    const existing = await DhamPass.findOne({
      userId,
      dham,
      status: { $in: ['active', 'used'] },
    });

    if (existing) {
      return res.status(400).json({ message: `You already have a pass for ${dham}.` });
    }

    // Get user for pilgrimId
    const user = await User.findById(userId).select('pilgrimId name');
    const pilgrimId = user?.pilgrimId || `TEMP-${userId.toString().slice(-6).toUpperCase()}`;

    const passId = uuidv4();
    const pass = new DhamPass({
      passId,
      pilgrimId,
      userId,
      dham,
      visitDate: new Date(visitDate),
      slot: 'Morning',
      status: 'active',
      issuedAt: new Date(),
    });

    await pass.save();

    res.status(201).json({
      message: 'Dham pass issued successfully',
      pass: {
        passId: pass.passId,
        pilgrimId: pass.pilgrimId,
        dham: pass.dham,
        visitDate: pass.visitDate,
        slot: pass.slot,
        status: pass.status,
        issuedAt: pass.issuedAt,
      },
    });
  } catch (error) {
    console.error('Pass creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/passes/my-passes - Get current user's passes
router.get('/my-passes', authenticate, async (req, res) => {
  try {
    const passes = await DhamPass.find({ userId: req.user._id }).sort({ issuedAt: -1 });
    res.json({ passes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/passes/quota/:dham — must be before /:passId
router.get('/quota/:dham', async (req, res) => {
  try {
    const { dham } = req.params;
    const { date } = req.query;
    const visitDay = new Date(date || Date.now());
    visitDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(visitDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = await DhamPass.countDocuments({
      dham,
      visitDate: { $gte: visitDay, $lt: nextDay },
      status: { $in: ['active', 'used'] },
    });

    const quota = DAILY_QUOTA[dham] || 0;
    res.json({ dham, date: visitDay, issued: count, quota, remaining: Math.max(0, quota - count) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/passes/:passId - Get pass details (admin scan)
router.get('/:passId', authenticate, async (req, res) => {
  try {
    const pass = await DhamPass.findOne({ passId: req.params.passId })
      .populate('userId', 'name phone pilgrimId healthConditions');

    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    res.json({
      pass: {
        passId: pass.passId,
        pilgrimId: pass.pilgrimId,
        dham: pass.dham,
        visitDate: pass.visitDate,
        slot: pass.slot,
        status: pass.status,
        issuedAt: pass.issuedAt,
        usedAt: pass.usedAt,
        pilgrim: pass.userId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/passes/:passId/use - Mark pass as used (admin)
router.put('/:passId/use', authenticate, async (req, res) => {
  try {
    const pass = await DhamPass.findOne({ passId: req.params.passId });

    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    if (pass.status === 'used') {
      return res.status(400).json({ message: 'Pass already used', usedAt: pass.usedAt });
    }

    if (pass.status === 'cancelled' || pass.status === 'expired') {
      return res.status(400).json({ message: `Pass is ${pass.status}` });
    }

    pass.status = 'used';
    pass.usedAt = new Date();
    await pass.save();

    res.json({ message: 'Pass marked as used', pass });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
