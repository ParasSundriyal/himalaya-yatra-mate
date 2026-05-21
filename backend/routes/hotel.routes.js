import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Hotel from '../models/Hotel.model.js';
import Booking from '../models/Booking.model.js';
import Group from '../models/Group.model.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Hotels
 *     description: Hotel booking and management
 */

/**
 * @swagger
 * /api/hotels:
 *   get:
 *     summary: Get all hotels with filters
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *       - in: query
 *         name: available
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *     responses:
 *       200:
 *         description: Hotels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 hotels:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/hotels:
 *   get:
 *     summary: Get all hotels with filters
 *     tags: [Hotels]
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
 * /api/hotels:
 *   get:
 *     tags:
 *       - Hotels
 *     summary: Get all hotels with filters
 *     responses:
 *       200:
 *         description: Successful response
 */
// @route   GET /api/hotels
// @desc    Get all hotels with filters
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { location, minPrice, maxPrice, rating, available } = req.query;
    
    const query = { isActive: true };
    
    if (location) {
      query.location = location;
    }
    
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }
    
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }
    
    let hotels = await Hotel.find(query).select('-__v');
    
    // Filter by availability if requested
    if (available === 'true') {
      hotels = hotels.filter(hotel => hotel.availableRooms > 0);
    }
    
    res.json({
      success: true,
      count: hotels.length,
      hotels
    });
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/hotels/{id}:
 *   get:
 *     summary: Get single hotel by ID
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel retrieved successfully
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/hotels/:id:
 *   get:
 *     summary: Get single hotel by ID
 *     tags: [Hotels]
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
 * /api/hotels/{id}:
 *   get:
 *     tags:
 *       - Hotels
 *     summary: Get single hotel by ID
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
// @route   GET /api/hotels/:id
// @desc    Get single hotel by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    
    if (!hotel || !hotel.isActive) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    
    res.json({
      success: true,
      hotel
    });
  } catch (error) {
    console.error('Get hotel error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/hotels/book:
 *   post:
 *     summary: Book a hotel room (for self or for group member if instructor)
 *     tags: [Hotels]
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
 * /api/hotels/book:
 *   post:
 *     tags:
 *       - Hotels
 *     summary: Book a hotel room (for self or for group member if instructor)
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
// @route   POST /api/hotels/book
// @desc    Book a hotel room (for self or for group member if instructor)
// @access  Private
router.post('/book', authenticate, [
  body('hotelId').notEmpty().withMessage('Hotel ID is required'),
  body('checkIn').isISO8601().withMessage('Valid check-in date is required'),
  body('checkOut').isISO8601().withMessage('Valid check-out date is required'),
  body('guests').isInt({ min: 1 }).withMessage('Number of guests must be at least 1'),
  body('rooms').isInt({ min: 1 }).withMessage('Number of rooms must be at least 1'),
  body('memberId').optional().isMongoId().withMessage('Invalid member ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { hotelId, checkIn, checkOut, guests, rooms, memberId } = req.body;

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

    const hotel = await Hotel.findById(hotelId);
    
    if (!hotel || !hotel.isActive) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    if (hotel.availableRooms < rooms) {
      return res.status(400).json({ 
        message: `Only ${hotel.availableRooms} room(s) available. Requested: ${rooms}` 
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (nights < 1) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    const amount = hotel.pricePerNight * nights * rooms;

    // Create booking
    const booking = new Booking({
      user: bookingUserId,
      bookingType: 'hotel',
      status: 'confirmed',
      hotel: {
        hotelId: hotel._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        rooms
      },
      amount,
      paymentStatus: 'pending'
    });

    await booking.save();

    // Update hotel availability
    hotel.availableRooms = hotel.availableRooms - rooms;
    await hotel.save();

    res.status(201).json({
      success: true,
      message: memberId 
        ? 'Hotel booked successfully for group member' 
        : 'Hotel booked successfully',
      bookedFor: memberId ? 'member' : 'self',
      booking: {
        id: booking._id,
        hotel: {
          name: hotel.name,
          location: hotel.location
        },
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        rooms,
        nights,
        amount
      }
    });
  } catch (error) {
    console.error('Book hotel error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/hotels/my-bookings:
 *   get:
 *     summary: Get user's hotel bookings
 *     tags: [Hotels]
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
 * /api/hotels/my-bookings:
 *   get:
 *     tags:
 *       - Hotels
 *     summary: Get user's hotel bookings
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
// @route   GET /api/hotels/my-bookings
// @desc    Get user's hotel bookings
// @access  Private
router.get('/my-bookings', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      bookingType: 'hotel'
    })
      .sort({ createdAt: -1 })
      .populate('hotel.hotelId', 'name location pricePerNight');

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get hotel bookings error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/hotels/cancel/:bookingId:
 *   post:
 *     summary: Cancel a hotel booking
 *     tags: [Hotels]
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
 * /api/hotels/cancel/{bookingId}:
 *   post:
 *     tags:
 *       - Hotels
 *     summary: Cancel a hotel booking
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
// @route   POST /api/hotels/cancel/:bookingId
// @desc    Cancel a hotel booking
// @access  Private
router.post('/cancel/:bookingId', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
      bookingType: 'hotel'
    }).populate('hotel.hotelId');

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

    // Update hotel availability
    if (booking.hotel.hotelId) {
      const hotel = await Hotel.findById(booking.hotel.hotelId);
      if (hotel) {
        hotel.availableRooms = hotel.availableRooms + booking.hotel.rooms;
        await hotel.save();
      }
    }

    res.json({
      success: true,
      message: 'Hotel booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel hotel booking error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

export default router;
