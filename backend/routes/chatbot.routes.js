import express from 'express';
import { buildReply } from '../chatbot/utils/reply.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Chatbot
 *     description: Multilingual smart chatbot responses
 */

/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     summary: Offline-first multilingual smart chatbot response
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message
 *               userId:
 *                 type: string
 *                 description: Optional user ID
 *     responses:
 *       200:
 *         description: Chatbot response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                 language:
 *                   type: string
 *       400:
 *         description: Message is required
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     summary: Offline-first multilingual smart chatbot response
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               exampleField:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful response
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     tags:
 *       - Chatbot
 *     summary: Offline-first multilingual smart chatbot response
 *     responses:
 *       200:
 *         description: Successful response
 *       400:
 *         description: Bad request
 */
// @route   POST /api/chatbot
// @desc    Offline-first multilingual smart chatbot response
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { message, userId } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'message is required' });
    }

    // Extract user JWT so n8n can call authenticated endpoints on behalf of the user
    const userToken = req.headers.authorization?.split(' ')[1] || '';

    const response = await buildReply(message, userId, userToken);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

export default router;
