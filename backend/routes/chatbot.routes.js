import express from 'express';
import { buildReply } from '../chatbot/utils/reply.js';

const router = express.Router();

// @route   POST /api/chatbot
// @desc    Offline-first multilingual smart chatbot response
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { message, userId } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'message is required' });
    }

    const response = await buildReply(message, userId);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

export default router;
