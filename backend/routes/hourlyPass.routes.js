import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Checkpoint from '../models/Checkpoint.model.js';
import CheckpointPass from '../models/CheckpointPass.model.js';
import HourlyPassSlot from '../models/HourlyPassSlot.model.js';
import User from '../models/User.model.js';
import Group from '../models/Group.model.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware.js';
import QRCode from 'qrcode';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Hourly Passes
 *     description: Hourly checkpoint passes management
 */

// Helper function to get IST date string (YYYY-MM-DD)
const getISTDateString = (date = new Date()) => {
  const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return istDate.toISOString().split('T')[0];
};

// Helper function to get IST hour
const getISTHour = (date = new Date()) => {
  const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return istDate.getHours();
};

// Helper function to create IST date with hour
const createISTDate = (dateString, hour) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, hour, 0, 0, 0);
  // Convert to IST
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

/**
 * @swagger
 * /api/hourly-passes/checkpoints/:checkpointId/slots:
 *   get:
 *     summary: Get available hourly slots for a checkpoint on a specific date
 *     tags: [Hourly Passes]
 *     parameters:
 *       - in: path
 *         name: checkpointId
 *         required: true
 *         schema:
 *           type: string
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
 * /api/hourly-passes/checkpoints/{checkpointId}/slots:
 *   get:
 *     tags:
 *       - Hourly Passes
 *     summary: Get available hourly slots for a checkpoint on a specific date
 *     parameters:
 *      - in: path
        name: checkpointId
        required: true
        schema:
          type: string
        description: checkpointId parameter
 *     responses:
 *       200:
 *         description: Successful response
 */
// @route   GET /api/hourly-passes/checkpoints/:checkpointId/slots
// @desc    Get available hourly slots for a checkpoint on a specific date
// @access  Public
router.get('/checkpoints/:checkpointId/slots', async (req, res) => {
  try {
    const { checkpointId } = req.params;
    const { date } = req.query; // Format: YYYY-MM-DD

    const checkpoint = await Checkpoint.findById(checkpointId);
    if (!checkpoint || !checkpoint.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Checkpoint not found or inactive'
      });
    }

    // Use provided date or today in IST
    const selectedDate = date || getISTDateString();
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Parse operating hours
    const [startHour, startMinute] = checkpoint.operatingHours.start.split(':').map(Number);
    let [endHour, endMinute] = checkpoint.operatingHours.end.split(':').map(Number);
    
    // Handle 24:00 as end of day - generate all 24 hours (0-23)
    if (endHour === 24) {
      endHour = 24; // This will make the loop generate hours 0-23
    }

    // Generate hourly slots for the full day
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      // Get slot configuration (admin-controlled capacity)
      // Use actual hour (0-23) for database queries
      let slotConfig = await HourlyPassSlot.findOne({
        checkpoint: checkpointId,
        date: selectedDate,
        hour: hour
      });

      // If no admin config, use checkpoint defaults
      const capacity = slotConfig?.capacity ?? checkpoint.maxPassesPerSlot;
      const price = slotConfig?.price ?? checkpoint.pricePerHour;
      const isActive = slotConfig?.isActive ?? true;

      // Calculate next hour for display (handle hour 23 -> 24:00)
      const nextHour = hour + 1;
      const endTimeDisplay = nextHour === 24 ? '24:00' : `${nextHour.toString().padStart(2, '0')}:00`;

      if (!isActive) {
        slots.push({
          hour,
          start: `${hour.toString().padStart(2, '0')}:00`,
          end: endTimeDisplay,
          capacity: 0,
          available: 0,
          booked: 0,
          price,
          isActive: false
        });
        continue;
      }

      // Count booked passes for this hour
      const slotStart = createISTDate(selectedDate, hour);
      const slotEnd = createISTDate(selectedDate, nextHour);

      const bookedCount = await CheckpointPass.countDocuments({
        checkpoint: checkpointId,
        status: { $in: ['confirmed', 'used'] },
        'timeSlot.start': { $gte: slotStart, $lt: slotEnd }
      });

      const available = Math.max(0, capacity - bookedCount);
      const now = new Date();
      const isPast = slotStart < now;

      slots.push({
        hour,
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: endTimeDisplay,
        capacity,
        available,
        booked: bookedCount,
        price,
        isActive: true,
        isPast
      });
    }

    res.json({
      success: true,
      checkpoint: {
        id: checkpoint._id,
        name: checkpoint.name,
        location: checkpoint.location
      },
      date: selectedDate,
      slots
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/hourly-passes/book:
 *   post:
 *     summary: Book an hourly pass (Public - everyone can book, or for group member if instructor)
 *     tags: [Hourly Passes]
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
 * /api/hourly-passes/book:
 *   post:
 *     tags:
 *       - Hourly Passes
 *     summary: Book an hourly pass (Public - everyone can book, or for group member if instructor)
 *     responses:
 *       200:
 *         description: Successful response
 *       400:
 *         description: Bad request
 */
// @route   POST /api/hourly-passes/book
// @desc    Book an hourly pass (Public - everyone can book, or for group member if instructor)
// @access  Public (optional auth for registered users)
router.post('/book', optionalAuth, [
  body('checkpointId').isMongoId().withMessage('Valid checkpoint ID is required'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Valid date format (YYYY-MM-DD) is required'),
  body('hour').isInt({ min: 0, max: 23 }).withMessage('Valid hour (0-23) is required'),
  body('vehicleOwnerName').notEmpty().trim().withMessage('Vehicle owner name is required'),
  body('vehicleOwnerPhone').notEmpty().trim().withMessage('Vehicle owner phone is required'),
  body('vehicleNumber').notEmpty().trim().withMessage('Vehicle number is required'),
  body('numberOfPeople').optional().isInt({ min: 1 }).withMessage('Number of people must be at least 1'),
  body('memberId').optional().isMongoId().withMessage('Invalid member ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { checkpointId, date, hour, vehicleOwnerName, vehicleOwnerPhone, vehicleNumber, numberOfPeople = 1, memberId } = req.body;

    // Determine booking user: if instructor booking for member, use memberId; otherwise use req.user._id
    let bookingUserId = req.user?._id || null;

    // If memberId is provided and user is a group instructor, verify and use memberId
    if (memberId && req.user && req.user.role === 'group') {
      const group = await Group.findOne({ instructor: req.user._id });
      
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found'
        });
      }

      // Verify member belongs to instructor's group
      const memberObjectId = new mongoose.Types.ObjectId(memberId);
      if (!group.members.some(m => m.toString() === memberObjectId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You can only book for members of your group'
        });
      }

      bookingUserId = memberId;
    } else if (memberId && (!req.user || req.user.role !== 'group')) {
      return res.status(403).json({
        success: false,
        message: 'Only group instructors can book for members'
      });
    }

    // Check if user has already used a pass for this checkpoint
    if (bookingUserId) {
      const usedPass = await CheckpointPass.findOne({
        checkpoint: checkpointId,
        user: bookingUserId,
        status: 'used'
      });

      if (usedPass) {
        return res.status(400).json({
          success: false,
          message: 'This member has already used a pass for this checkpoint. Cannot book again.'
        });
      }
    }

    // Check checkpoint exists and is active
    const checkpoint = await Checkpoint.findById(checkpointId);
    if (!checkpoint || !checkpoint.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Checkpoint not found or inactive'
      });
    }

    // Get slot configuration
    let slotConfig = await HourlyPassSlot.findOne({
      checkpoint: checkpointId,
      date,
      hour: parseInt(hour)
    });

    const capacity = slotConfig?.capacity ?? checkpoint.maxPassesPerSlot;
    const price = slotConfig?.price ?? checkpoint.pricePerHour;
    const isActive = slotConfig?.isActive ?? true;

    if (!isActive) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is not available for booking'
      });
    }

    // Check availability
    const slotStart = createISTDate(date, parseInt(hour));
    const slotEnd = createISTDate(date, parseInt(hour) + 1);

    // Don't allow booking past slots
    if (slotStart < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a slot in the past'
      });
    }

    const bookedCount = await CheckpointPass.countDocuments({
      checkpoint: checkpointId,
      status: { $in: ['confirmed', 'used'] },
      'timeSlot.start': { $gte: slotStart, $lt: slotEnd }
    });

    if (bookedCount >= capacity) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is fully booked'
      });
    }

    // Calculate amount
    const amount = price * numberOfPeople;

    // Generate unique pass ID
    const passId = CheckpointPass.generatePassId();

    // Generate QR code data
    const qrData = JSON.stringify({
      passId,
      checkpointId: checkpoint._id.toString(),
      checkpointName: checkpoint.name,
      vehicleOwnerName,
      vehicleOwnerPhone,
      vehicleNumber: vehicleNumber.toUpperCase(),
      timeSlot: {
        start: slotStart.toISOString(),
        end: slotEnd.toISOString()
      },
      numberOfPeople,
      amount,
      date,
      hour: parseInt(hour)
    });

    const qrCode = await QRCode.toDataURL(qrData);

    // Determine booking type
    let bookingType = 'public';
    if (req.user) {
      bookingType = req.user.role === 'group' ? 'group' : 'user';
    }

    // Find group if user is a member (has instructorId OR is in a group's members array)
    let groupId = null;
    if (bookingUserId) {
      const bookingUser = await User.findById(bookingUserId);
      if (bookingUser) {
        // Method 1: Check if user has instructorId
        if (bookingUser.instructorId) {
          const userGroup = await Group.findOne({ instructor: bookingUser.instructorId });
          if (userGroup) {
            groupId = userGroup._id;
          }
        }
        
        // Method 2: If no instructorId, check if user is in any group's members array
        if (!groupId) {
          const userGroup = await Group.findOne({ members: bookingUserId });
          if (userGroup) {
            groupId = userGroup._id;
            // Also set instructorId for future bookings
            if (!bookingUser.instructorId) {
              bookingUser.instructorId = userGroup.instructor;
              await bookingUser.save();
            }
          }
        }
      }
    }

    // Create pass
    const pass = new CheckpointPass({
      user: bookingUserId,
      groupId: groupId,
      checkpoint: checkpointId,
      timeSlot: {
        start: slotStart,
        end: slotEnd
      },
      vehicleOwnerName,
      vehicleOwnerPhone,
      vehicleNumber: vehicleNumber.toUpperCase(),
      numberOfPeople,
      qrCode,
      passId,
      amount,
      paymentStatus: amount === 0 ? 'paid' : 'pending',
      issuedBy: req.user?._id || null,
      bookingType,
      status: 'confirmed'
    });

    await pass.save();
    await pass.populate('checkpoint', 'name location');

    res.status(201).json({
      success: true,
      message: 'Pass booked successfully',
      pass: {
        id: pass._id,
        passId: pass.passId,
        checkpoint: {
          id: checkpoint._id,
          name: checkpoint.name,
          location: checkpoint.location
        },
        vehicleOwnerName: pass.vehicleOwnerName,
        vehicleOwnerPhone: pass.vehicleOwnerPhone,
        vehicleNumber: pass.vehicleNumber,
        numberOfPeople: pass.numberOfPeople,
        timeSlot: {
          start: pass.timeSlot.start,
          end: pass.timeSlot.end,
          date,
          hour: parseInt(hour)
        },
        amount: pass.amount,
        paymentStatus: pass.paymentStatus,
        qrCode: pass.qrCode,
        status: pass.status,
        bookingType: pass.bookingType,
        createdAt: pass.createdAt
      }
    });
  } catch (error) {
    console.error('Book pass error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/hourly-passes/scan/:passId:
 *   post:
 *     summary: Scan QR code and mark pass as used (Admin only)
 *     tags: [Hourly Passes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: passId
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
 * /api/hourly-passes/scan/{passId}:
 *   post:
 *     tags:
 *       - Hourly Passes
 *     summary: Scan QR code and mark pass as used (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
        name: passId
        required: true
        schema:
          type: string
        description: passId parameter
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
// @route   POST /api/hourly-passes/scan/:passId
// @desc    Scan QR code and mark pass as used (Admin only)
// @access  Private (Admin only)
router.post('/scan/:passId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { passId } = req.params;

    const pass = await CheckpointPass.findOne({ passId })
      .populate('checkpoint', 'name location')
      .populate('user', 'name email phone');

    if (!pass) {
      return res.status(404).json({
        success: false,
        message: 'Pass not found'
      });
    }

    if (pass.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'Pass has already been used',
        pass: {
          id: pass._id,
          passId: pass.passId,
          checkpoint: pass.checkpoint,
          vehicleOwnerName: pass.vehicleOwnerName,
          vehicleOwnerPhone: pass.vehicleOwnerPhone,
          vehicleNumber: pass.vehicleNumber,
          timeSlot: pass.timeSlot,
          status: pass.status,
          verifiedAt: pass.verifiedAt,
          verifiedBy: pass.verifiedBy
        }
      });
    }

    if (pass.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Pass has been cancelled'
      });
    }

    // Mark as used
    pass.status = 'used';
    pass.verifiedAt = new Date();
    pass.verifiedBy = req.user._id;
    await pass.save();

    res.json({
      success: true,
      message: 'Pass verified and marked as used',
      pass: {
        id: pass._id,
        passId: pass.passId,
        checkpoint: pass.checkpoint,
        vehicleOwnerName: pass.vehicleOwnerName,
        vehicleOwnerPhone: pass.vehicleOwnerPhone,
        vehicleNumber: pass.vehicleNumber,
        numberOfPeople: pass.numberOfPeople,
        timeSlot: pass.timeSlot,
        amount: pass.amount,
        paymentStatus: pass.paymentStatus,
        status: pass.status,
        verifiedAt: pass.verifiedAt,
        verifiedBy: {
          id: req.user._id,
          name: req.user.name
        },
        bookingType: pass.bookingType,
        user: pass.user,
        createdAt: pass.createdAt
      }
    });
  } catch (error) {
    console.error('Scan pass error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/hourly-passes/my-passes:
 *   get:
 *     summary: Get user's passes (if logged in)
 *     tags: [Hourly Passes]
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
 * /api/hourly-passes/my-passes:
 *   get:
 *     tags:
 *       - Hourly Passes
 *     summary: Get user's passes (if logged in)
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
// @route   GET /api/hourly-passes/my-passes
// @desc    Get user's passes (if logged in)
// @access  Private (optional - returns empty if not logged in)
router.get('/my-passes', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({
        success: true,
        count: 0,
        passes: []
      });
    }

    const { status, checkpointId } = req.query;

    const query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    if (checkpointId) {
      query.checkpoint = checkpointId;
    }

    const passes = await CheckpointPass.find(query)
      .populate('checkpoint', 'name location')
      .sort({ 'timeSlot.start': -1 });

    // Update expired passes
    const now = new Date();
    for (const pass of passes) {
      if (pass.status === 'confirmed' && pass.isExpired()) {
        pass.status = 'expired';
        await pass.save();
      }
    }

    res.json({
      success: true,
      count: passes.length,
      passes: passes.map(pass => ({
        id: pass._id,
        passId: pass.passId,
        checkpoint: pass.checkpoint,
        vehicleOwnerName: pass.vehicleOwnerName,
        vehicleOwnerPhone: pass.vehicleOwnerPhone,
        vehicleNumber: pass.vehicleNumber,
        numberOfPeople: pass.numberOfPeople,
        timeSlot: pass.timeSlot,
        amount: pass.amount,
        paymentStatus: pass.paymentStatus,
        qrCode: pass.qrCode,
        status: pass.status,
        isValid: pass.isValid(),
        isExpired: pass.isExpired(),
        verifiedAt: pass.verifiedAt,
        bookingType: pass.bookingType,
        createdAt: pass.createdAt
      }))
    });
  } catch (error) {
    console.error('Get passes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/hourly-passes/admin/all-passes:
 *   get:
 *     summary: Get all passes (Admin) - Limited info with pagination
 *     tags: [Hourly Passes]
 *     security:
 *       - bearerAuth: []
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
 * /api/hourly-passes/admin/all-passes:
 *   get:
 *     tags:
 *       - Hourly Passes
 *     summary: Get all passes (Admin) - Limited info with pagination
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
// @route   GET /api/hourly-passes/admin/all-passes
// @desc    Get all passes (Admin) - Limited info with pagination
// @access  Private (Admin only)
router.get('/admin/all-passes', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status, checkpointId, startDate, endDate, vehicleNumber, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (checkpointId) {
      query.checkpoint = checkpointId;
    }

    if (vehicleNumber) {
      query.vehicleNumber = vehicleNumber.toUpperCase();
    }

    if (startDate || endDate) {
      query['timeSlot.start'] = {};
      if (startDate) {
        query['timeSlot.start'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['timeSlot.start'].$lte = new Date(endDate);
      }
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await CheckpointPass.countDocuments(query);

    // Fetch passes with limited fields and pagination
    const passes = await CheckpointPass.find(query)
      .select('passId checkpoint vehicleOwnerName vehicleOwnerPhone vehicleNumber timeSlot status amount paymentStatus createdAt verifiedAt')
      .populate('checkpoint', 'name location')
      .sort({ 'timeSlot.start': -1 })
      .limit(limitNum)
      .skip(skip)
      .lean(); // Use lean() for better performance

    res.json({
      success: true,
      count: passes.length,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      passes: passes.map(pass => ({
        id: pass._id,
        passId: pass.passId,
        checkpoint: pass.checkpoint,
        vehicleOwnerName: pass.vehicleOwnerName,
        vehicleOwnerPhone: pass.vehicleOwnerPhone,
        vehicleNumber: pass.vehicleNumber,
        timeSlot: {
          start: pass.timeSlot.start,
          end: pass.timeSlot.end
        },
        status: pass.status,
        amount: pass.amount,
        paymentStatus: pass.paymentStatus,
        createdAt: pass.createdAt,
        verifiedAt: pass.verifiedAt
      }))
    });
  } catch (error) {
    console.error('Get all passes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/hourly-passes/admin/slots:
 *   post:
 *     summary: Set capacity for a specific checkpoint/date/hour slot (Admin)
 *     tags: [Hourly Passes]
 *     security:
 *       - bearerAuth: []
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
 * /api/hourly-passes/admin/slots:
 *   post:
 *     tags:
 *       - Hourly Passes
 *     summary: Set capacity for a specific checkpoint/date/hour slot (Admin)
 *     security:
 *       - bearerAuth: []
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
// @route   POST /api/hourly-passes/admin/slots
// @desc    Set capacity for a specific checkpoint/date/hour slot (Admin)
// @access  Private (Admin only)
router.post('/admin/slots', authenticate, authorize(['admin']), [
  body('checkpointId').isMongoId().withMessage('Valid checkpoint ID is required'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Valid date format (YYYY-MM-DD) is required'),
  body('hour').isInt({ min: 0, max: 23 }).withMessage('Valid hour (0-23) is required'),
  body('capacity').isInt({ min: 0 }).withMessage('Capacity must be 0 or greater'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or greater'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { checkpointId, date, hour, capacity, price, isActive } = req.body;

    // Verify checkpoint exists
    const checkpoint = await Checkpoint.findById(checkpointId);
    if (!checkpoint) {
      return res.status(404).json({
        success: false,
        message: 'Checkpoint not found'
      });
    }

    // Update or create slot configuration
    const slotConfig = await HourlyPassSlot.findOneAndUpdate(
      {
        checkpoint: checkpointId,
        date,
        hour: parseInt(hour)
      },
      {
        checkpoint: checkpointId,
        date,
        hour: parseInt(hour),
        capacity: parseInt(capacity),
        price: price !== undefined ? parseFloat(price) : null,
        isActive: isActive !== undefined ? isActive : true
      },
      {
        upsert: true,
        new: true
      }
    );

    await slotConfig.populate('checkpoint', 'name location');

    res.json({
      success: true,
      message: 'Slot configuration updated successfully',
      slot: slotConfig
    });
  } catch (error) {
    console.error('Set slot config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/hourly-passes/admin/slots:
 *   get:
 *     summary: Get slot configurations for a checkpoint/date (Admin)
 *     tags: [Hourly Passes]
 *     security:
 *       - bearerAuth: []
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
 * /api/hourly-passes/admin/slots:
 *   get:
 *     tags:
 *       - Hourly Passes
 *     summary: Get slot configurations for a checkpoint/date (Admin)
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
// @route   GET /api/hourly-passes/admin/slots
// @desc    Get slot configurations for a checkpoint/date (Admin)
// @access  Private (Admin only)
router.get('/admin/slots', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { checkpointId, date } = req.query;

    if (!checkpointId || !date) {
      return res.status(400).json({
        success: false,
        message: 'checkpointId and date are required'
      });
    }

    const slots = await HourlyPassSlot.find({
      checkpoint: checkpointId,
      date
    }).populate('checkpoint', 'name location');

    res.json({
      success: true,
      count: slots.length,
      slots
    });
  } catch (error) {
    console.error('Get slot configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;

