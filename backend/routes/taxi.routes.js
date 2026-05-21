import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Taxi from '../models/Taxi.model.js';
import Booking from '../models/Booking.model.js';
import Group from '../models/Group.model.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Taxis
 *     description: Taxi booking and management
 */

/**
 * @swagger
 * /api/taxis:
 *   get:
 *     summary: Get all available taxis with filters
 *     tags: [Taxis]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *       - in: query
 *         name: minSeats
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Taxis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 taxis:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/taxis:
 *   get:
 *     summary: Get all available taxis with filters
 *     tags: [Taxis]
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
 * /api/taxis:
 *   get:
 *     tags:
 *       - Taxis
 *     summary: Get all available taxis with filters
 *     responses:
 *       200:
 *         description: Successful response
 */
// @route   GET /api/taxis
// @desc    Get all available taxis with filters
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { location, vehicleType, minSeats, maxPrice } = req.query;
    
    const query = { isActive: true, isAvailable: true };
    
    if (location) {
      query.location = location;
    }
    
    if (vehicleType) {
      query.vehicleType = new RegExp(vehicleType, 'i');
    }
    
    if (minSeats) {
      query.seats = { $gte: Number(minSeats) };
    }
    
    let taxis = await Taxi.find(query).select('-licenseNumber -__v');
    
    // Filter by max price if specified
    if (maxPrice) {
      taxis = taxis.filter(taxi => taxi.ratePerKm <= Number(maxPrice));
    }
    
    res.json({
      success: true,
      count: taxis.length,
      taxis
    });
  } catch (error) {
    console.error('Get taxis error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/taxis/:id:
 *   get:
 *     summary: Get single taxi by ID
 *     tags: [Taxis]
 *     parameters:
 *       - in: path
 *         name: id
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
 * /api/taxis/{id}:
 *   get:
 *     tags:
 *       - Taxis
 *     summary: Get single taxi by ID
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
 */
// @route   GET /api/taxis/:id
// @desc    Get single taxi by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const taxi = await Taxi.findById(req.params.id).select('-licenseNumber -__v');
    
    if (!taxi || !taxi.isActive) {
      return res.status(404).json({ message: 'Taxi not found' });
    }
    
    res.json({
      success: true,
      taxi
    });
  } catch (error) {
    console.error('Get taxi error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/taxis/book:
 *   post:
 *     summary: Book a taxi (for self or for group member if instructor)
 *     tags: [Taxis]
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
 * /api/taxis/book:
 *   post:
 *     tags:
 *       - Taxis
 *     summary: Book a taxi (for self or for group member if instructor)
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
// @route   POST /api/taxis/book
// @desc    Book a taxi (for self or for group member if instructor)
// @access  Private
router.post('/book', authenticate, [
  body('taxiId').notEmpty().withMessage('Taxi ID is required'),
  body('pickupLocation').notEmpty().withMessage('Pickup location is required'),
  body('dropoffLocation').notEmpty().withMessage('Drop-off location is required'),
  body('pickupTime').isISO8601().withMessage('Valid pickup time is required'),
  body('distance').isFloat({ min: 0 }).withMessage('Distance must be a positive number'),
  body('memberId').optional().isMongoId().withMessage('Invalid member ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taxiId, pickupLocation, dropoffLocation, pickupTime, distance, memberId } = req.body;

    // Determine booking user: if instructor booking for member, use memberId; otherwise use req.user._id
    let bookingUserId = req.user._id;

    // If memberId is provided and user is a group instructor, verify and use memberId
    if (memberId && req.user.role === 'group') {
      const group = await Group.findOne({ instructor: req.user._id });
      
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      // Verify member belongs to instructor's group
      const memberObjectId = new mongoose.Types.ObjectId(memberId);
      if (!group.members.some(m => m.toString() === memberObjectId.toString())) {
        return res.status(403).json({ 
          message: 'You can only book for members of your group' 
        });
      }

      bookingUserId = memberId;
    } else if (memberId && req.user.role !== 'group') {
      return res.status(403).json({ 
        message: 'Only group instructors can book for members' 
      });
    }

    const taxi = await Taxi.findById(taxiId);
    
    if (!taxi || !taxi.isActive) {
      return res.status(404).json({ message: 'Taxi not found' });
    }

    if (!taxi.isAvailable) {
      return res.status(400).json({ message: 'Taxi is not available at the moment' });
    }

    const estimatedFare = taxi.ratePerKm * distance;

    // Create booking
    const booking = new Booking({
      user: bookingUserId,
      bookingType: 'taxi',
      status: 'confirmed',
      taxi: {
        taxiId: taxi._id,
        pickupLocation,
        dropoffLocation,
        pickupTime: new Date(pickupTime),
        distance,
        estimatedFare
      },
      amount: estimatedFare,
      paymentStatus: 'pending'
    });

    await booking.save();

    // Mark taxi as unavailable (optional - can be based on pickup time)
    taxi.isAvailable = false;
    await taxi.save();

    res.status(201).json({
      success: true,
      message: memberId 
        ? 'Taxi booked successfully for group member' 
        : 'Taxi booked successfully',
      bookedFor: memberId ? 'member' : 'self',
      booking: {
        id: booking._id,
        taxi: {
          driverName: taxi.driverName,
          driverPhone: taxi.driverPhone,
          vehicleType: taxi.vehicleType,
          vehicleNumber: taxi.vehicleNumber
        },
        pickupLocation,
        dropoffLocation,
        pickupTime: new Date(pickupTime),
        distance,
        estimatedFare
      }
    });
  } catch (error) {
    console.error('Book taxi error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/taxis/my-bookings:
 *   get:
 *     summary: Get user's taxi bookings
 *     tags: [Taxis]
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
 * /api/taxis/my-bookings:
 *   get:
 *     tags:
 *       - Taxis
 *     summary: Get user's taxi bookings
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
// @route   GET /api/taxis/my-bookings
// @desc    Get user's taxi bookings
// @access  Private
router.get('/my-bookings', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      bookingType: 'taxi'
    })
      .sort({ createdAt: -1 })
      .populate('taxi.taxiId', 'driverName driverPhone vehicleType vehicleNumber ratePerKm');

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get taxi bookings error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/taxis/cancel/:bookingId:
 *   post:
 *     summary: Cancel a taxi booking
 *     tags: [Taxis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
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
 * /api/taxis/cancel/{bookingId}:
 *   post:
 *     tags:
 *       - Taxis
 *     summary: Cancel a taxi booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
        name: bookingId
        required: true
        schema:
          type: string
        description: bookingId parameter
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
// @route   POST /api/taxis/cancel/:bookingId
// @desc    Cancel a taxi booking
// @access  Private
router.post('/cancel/:bookingId', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
      bookingType: 'taxi'
    }).populate('taxi.taxiId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    await booking.save();

    // Make taxi available again
    if (booking.taxi.taxiId) {
      const taxi = await Taxi.findById(booking.taxi.taxiId);
      if (taxi) {
        taxi.isAvailable = true;
        await taxi.save();
      }
    }

    res.json({
      success: true,
      message: 'Taxi booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel taxi booking error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

export default router;
