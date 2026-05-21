import express from 'express';
import { body, validationResult } from 'express-validator';
import AIDetection from '../models/AIDetection.model.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: AI Detection
 *     description: AI-based vehicle detection and logging
 */

/**
 * @swagger
 * /api/ai-detection/log:
 *   post:
 *     summary: Log a vehicle detection
 *     tags: [AI Detection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleNumber
 *               - detectionType
 *               - location
 *               - gate
 *             properties:
 *               vehicleNumber:
 *                 type: string
 *               detectionType:
 *                 type: string
 *                 enum: [entry, exit]
 *               location:
 *                 type: string
 *               gate:
 *                 type: string
 *               coordinates:
 *                 type: object
 *               imageUrl:
 *                 type: string
 *               confidence:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *     responses:
 *       201:
 *         description: Detection logged successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/ai-detection/log:
 *   post:
 *     summary: Log a vehicle detection
 *     tags: [AI Detection]
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
 * /api/ai-detection/log:
 *   post:
 *     tags:
 *       - AI Detection
 *     summary: Log a vehicle detection
 *     responses:
 *       200:
 *         description: Successful response
 *       400:
 *         description: Bad request
 */
// @route   POST /api/ai-detection/log
// @desc    Log a vehicle detection
// @access  Public (Can be called by AI system or admin)
router.post('/log', [
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('detectionType').isIn(['entry', 'exit']).withMessage('Detection type must be entry or exit'),
  body('location').notEmpty().withMessage('Location is required'),
  body('gate').notEmpty().withMessage('Gate is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { vehicleNumber, detectionType, location, gate, coordinates, imageUrl, confidence } = req.body;

    // Create detection log
    const detection = new AIDetection({
      vehicleNumber,
      detectionType,
      location,
      gate,
      coordinates,
      imageUrl,
      confidence: confidence || 0,
      processed: false
    });

    await detection.save();

    res.status(201).json({
      success: true,
      message: 'Detection logged successfully',
      detection: {
        id: detection._id,
        vehicleNumber,
        detectionType,
        location,
        gate,
        timestamp: detection.createdAt
      }
    });
  } catch (error) {
    console.error('Log detection error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/ai-detection:
 *   get:
 *     summary: Get detection logs with filters
 *     tags: [AI Detection]
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
 * /api/ai-detection:
 *   get:
 *     tags:
 *       - AI Detection
 *     summary: Get detection logs with filters
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// @route   GET /api/ai-detection
// @desc    Get detection logs with filters
// @access  Private (Admin, or optional for viewing stats)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { vehicleNumber, location, detectionType, gate, startDate, endDate, limit = 50 } = req.query;
    
    const query = {};
    
    if (vehicleNumber) {
      query.vehicleNumber = new RegExp(vehicleNumber, 'i');
    }
    
    if (location) {
      query.location = location;
    }
    
    if (detectionType) {
      query.detectionType = detectionType;
    }
    
    if (gate) {
      query.gate = gate;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const detections = await AIDetection.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('userId', 'name email')
      .populate('bookingId', 'bookingType status');
    
    res.json({
      success: true,
      count: detections.length,
      detections
    });
  } catch (error) {
    console.error('Get detections error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/ai-detection/stats:
 *   get:
 *     summary: Get detection statistics
 *     tags: [AI Detection]
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
 * /api/ai-detection/stats:
 *   get:
 *     tags:
 *       - AI Detection
 *     summary: Get detection statistics
 *     responses:
 *       200:
 *         description: Successful response
 */
// @route   GET /api/ai-detection/stats
// @desc    Get detection statistics
// @access  Public (for dashboard display)
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayQuery = { ...query, createdAt: { ...query.createdAt, $gte: today } };

    const [
      totalDetections,
      todayDetections,
      entryDetections,
      exitDetections,
      recentDetections
    ] = await Promise.all([
      AIDetection.countDocuments(query),
      AIDetection.countDocuments(todayQuery),
      AIDetection.countDocuments({ ...query, detectionType: 'entry' }),
      AIDetection.countDocuments({ ...query, detectionType: 'exit' }),
      AIDetection.find(query)
        .sort({ createdAt: -1 })
        .limit(10)
        .select('vehicleNumber detectionType location gate createdAt')
    ]);

    // Calculate active vehicles (entries - exits today)
    const activeVehicles = Math.max(0, entryDetections - exitDetections);

    res.json({
      success: true,
      stats: {
        totalDetections,
        todayDetections,
        entryDetections,
        exitDetections,
        activeVehicles,
        averageProcessingTime: 0.3 // In seconds (can be calculated from actual processing times)
      },
      recentDetections
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/ai-detection/:id/process:
 *   put:
 *     summary: Mark detection as processed and link to user/booking
 *     tags: [AI Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 * /api/ai-detection/{id}/process:
 *   put:
 *     tags:
 *       - AI Detection
 *     summary: Mark detection as processed and link to user/booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
        name: id
        required: true
        schema:
          type: string
        description: id parameter
 *     responses:
 *       200:
 *         description: Successful response
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// @route   PUT /api/ai-detection/:id/process
// @desc    Mark detection as processed and link to user/booking
// @access  Private (Admin)
router.put('/:id/process', authenticate, authorize('admin'), [
  body('processed').isBoolean().withMessage('Processed status is required'),
  body('userId').optional().isMongoId(),
  body('bookingId').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { processed, userId, bookingId } = req.body;

    const detection = await AIDetection.findById(id);
    if (!detection) {
      return res.status(404).json({ message: 'Detection not found' });
    }

    detection.processed = processed;
    detection.processedAt = new Date();
    if (userId) detection.userId = userId;
    if (bookingId) detection.bookingId = bookingId;

    await detection.save();

    res.json({
      success: true,
      message: 'Detection updated successfully',
      detection
    });
  } catch (error) {
    console.error('Update detection error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

export default router;
