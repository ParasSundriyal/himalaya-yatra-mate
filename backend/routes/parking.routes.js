import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Parking from '../models/Parking.model.js';
import Booking from '../models/Booking.model.js';
import Group from '../models/Group.model.js';
import User from '../models/User.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import QRCode from 'qrcode';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Parking
 *     description: Parking area and booking management
 */

/**
 * @swagger
 * /api/parking/areas:
 *   get:
 *     summary: Get all parking areas
 *     tags: [Parking]
 *     responses:
 *       200:
 *         description: Parking areas retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 areas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       location:
 *                         type: string
 *                       totalSlots:
 *                         type: integer
 *                       availableSlots:
 *                         type: integer
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/parking/areas:
 *   get:
 *     summary: Get all parking areas
 *     tags: [Parking]
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
 * /api/parking/areas:
 *   get:
 *     tags:
 *       - Parking
 *     summary: Get all parking areas
 *     responses:
 *       200:
 *         description: Successful response
 */
// @route   GET /api/parking/areas
// @desc    Get all parking areas
// @access  Public
router.get('/areas', async (req, res) => {
  try {
    const areas = await Parking.find({}).select('name location coordinates totalSlots availableSlots');
    
    res.json({
      success: true,
      count: areas.length,
      areas
    });
  } catch (error) {
    console.error('Get parking areas error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/parking/areas/{areaId}/slots:
 *   get:
 *     summary: Get available slots for a parking area
 *     tags: [Parking]
 *     parameters:
 *       - in: path
 *         name: areaId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, booked, maintenance]
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [compact, sedan, suv, large]
 *     responses:
 *       200:
 *         description: Slots retrieved successfully
 *       404:
 *         description: Parking area not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/parking/areas/:areaId/slots:
 *   get:
 *     summary: Get available slots for a parking area
 *     tags: [Parking]
 *     parameters:
 *       - in: path
 *         name: areaId
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
 * /api/parking/areas/{areaId}/slots:
 *   get:
 *     tags:
 *       - Parking
 *     summary: Get available slots for a parking area
 *     parameters:
 *      - in: path
        name: areaId
        required: true
        schema:
          type: string
        description: areaId parameter
 *     responses:
 *       200:
 *         description: Successful response
 */
// @route   GET /api/parking/areas/:areaId/slots
// @desc    Get available slots for a parking area
// @access  Public
router.get('/areas/:areaId/slots', async (req, res) => {
  try {
    const { areaId } = req.params;
    const { status, size } = req.query;

    const parking = await Parking.findById(areaId);
    
    if (!parking) {
      return res.status(404).json({ message: 'Parking area not found' });
    }

    let slots = parking.slots;

    // Filter by status
    if (status) {
      slots = slots.filter(slot => slot.status === status);
    }

    // Filter by size
    if (size) {
      slots = slots.filter(slot => slot.size === size);
    }

    res.json({
      success: true,
      area: {
        id: parking._id,
        name: parking.name,
        location: parking.location
      },
      slots: slots.map(slot => ({
        id: slot._id,
        slotNumber: slot.slotNumber,
        status: slot.status,
        size: slot.size,
        pricePerDay: slot.pricePerDay,
        location: slot.location
      }))
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/parking/book:
 *   post:
 *     summary: Book a parking slot (for self or for group member if instructor)
 *     tags: [Parking]
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
 * /api/parking/book:
 *   post:
 *     tags:
 *       - Parking
 *     summary: Book a parking slot (for self or for group member if instructor)
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
// @route   POST /api/parking/book
// @desc    Book a parking slot (for self or for group member if instructor)
// @access  Private
router.post('/book', authenticate, [
  body('areaId').notEmpty().withMessage('Parking area ID is required'),
  body('slotId').notEmpty().withMessage('Slot ID is required'),
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('entryTime').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid entry time format'),
  body('exitTime').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid exit time format'),
  body('memberId').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid member ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Parking booking validation errors:', errors.array());
      console.error('Request body:', req.body);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { areaId, slotId, vehicleNumber, entryTime, exitTime, memberId } = req.body;

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

    // Find parking area
    const parking = await Parking.findById(areaId);
    if (!parking) {
      return res.status(404).json({ message: 'Parking area not found' });
    }

    // Find slot
    const slot = parking.slots.id(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Check if slot is available
    if (slot.status !== 'available') {
      return res.status(400).json({ 
        message: `Slot is ${slot.status}. Cannot book this slot.` 
      });
    }

    // Calculate amount (simplified - can be based on hours/days)
    const entry = entryTime ? new Date(entryTime) : new Date();
    const exit = exitTime ? new Date(exitTime) : new Date(entry.getTime() + 24 * 60 * 60 * 1000); // Default 24 hours
    const hours = Math.ceil((exit - entry) / (1000 * 60 * 60));
    const days = Math.ceil(hours / 24);
    const amount = slot.pricePerDay * days;

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

    // Create booking
    const booking = new Booking({
      user: bookingUserId,
      groupId: groupId,
      bookingType: 'parking',
      status: 'confirmed',
      parking: {
        slotId: slot._id,
        areaId: parking._id,
        slotNumber: slot.slotNumber,
        vehicleNumber,
        entryTime: entry,
        exitTime: exit
      },
      amount,
      paymentStatus: 'pending'
    });

    await booking.save();

    // Generate QR code
    const qrData = JSON.stringify({
      bookingId: booking._id,
      slotNumber: slot.slotNumber,
      vehicleNumber,
      entryTime: entry.toISOString()
    });

    const qrCode = await QRCode.toDataURL(qrData);

    // Update slot status
    slot.status = 'reserved';
    slot.bookedBy = bookingUserId;
    slot.bookingId = booking._id;
    slot.entryTime = entry;
    slot.exitTime = exit;

    // Update available slots count
    parking.availableSlots = parking.availableSlots - 1;

    await parking.save();

    // Update booking with QR code
    booking.parking.qrCode = qrCode;
    await booking.save();

    res.status(201).json({
      success: true,
      message: memberId 
        ? 'Parking slot booked successfully for group member' 
        : 'Parking slot booked successfully',
      bookedFor: memberId ? 'member' : 'self',
      booking: {
        id: booking._id,
        slotNumber: slot.slotNumber,
        vehicleNumber,
        entryTime: entry,
        exitTime: exit,
        amount,
        qrCode
      }
    });
  } catch (error) {
    console.error('Book parking error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/parking/my-bookings:
 *   get:
 *     summary: Get user's parking bookings
 *     tags: [Parking]
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
 * /api/parking/my-bookings:
 *   get:
 *     tags:
 *       - Parking
 *     summary: Get user's parking bookings
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
// @route   GET /api/parking/my-bookings
// @desc    Get user's parking bookings
// @access  Private
router.get('/my-bookings', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      bookingType: 'parking'
    })
      .sort({ createdAt: -1 })
      .populate('parking.areaId', 'name location');

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/parking/cancel/:bookingId:
 *   post:
 *     summary: Cancel a parking booking
 *     tags: [Parking]
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
 * /api/parking/cancel/{bookingId}:
 *   post:
 *     tags:
 *       - Parking
 *     summary: Cancel a parking booking
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
// @route   POST /api/parking/cancel/:bookingId
// @desc    Cancel a parking booking
// @access  Private
router.post('/cancel/:bookingId', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
      bookingType: 'parking'
    });

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

    // Update slot status
    const parking = await Parking.findById(booking.parking.areaId);
    if (parking) {
      const slot = parking.slots.id(booking.parking.slotId);
      if (slot) {
        slot.status = 'available';
        slot.bookedBy = null;
        slot.bookingId = null;
        slot.entryTime = null;
        slot.exitTime = null;
        parking.availableSlots = parking.availableSlots + 1;
        await parking.save();
      }
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * @swagger
 * /api/parking/admin/areas:
 *   post:
 *     summary: Create a new parking area (Admin only)
 *     tags: [Parking]
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
 * /api/parking/admin/areas:
 *   post:
 *     tags:
 *       - Parking
 *     summary: Create a new parking area (Admin only)
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
// @route   POST /api/parking/admin/areas
// @desc    Create a new parking area (Admin only)
// @access  Private (Admin only)
router.post('/admin/areas', authenticate, authorize(['admin']), [
  body('name').notEmpty().withMessage('Parking area name is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('coordinates.lat').isFloat().withMessage('Valid latitude is required'),
  body('coordinates.lng').isFloat().withMessage('Valid longitude is required'),
  body('totalSlots').isInt({ min: 1 }).withMessage('Total slots must be at least 1')
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

    const { name, location, coordinates, totalSlots } = req.body;

    const parking = new Parking({
      name,
      location,
      coordinates,
      totalSlots,
      availableSlots: totalSlots,
      slots: []
    });

    await parking.save();

    res.status(201).json({
      success: true,
      message: 'Parking area created successfully',
      parking
    });
  } catch (error) {
    console.error('Create parking area error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/parking/admin/areas/:areaId:
 *   put:
 *     summary: Update a parking area (Admin only)
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: areaId
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
 * /api/parking/admin/areas/{areaId}:
 *   put:
 *     tags:
 *       - Parking
 *     summary: Update a parking area (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
        name: areaId
        required: true
        schema:
          type: string
        description: areaId parameter
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
// @route   PUT /api/parking/admin/areas/:areaId
// @desc    Update a parking area (Admin only)
// @access  Private (Admin only)
router.put('/admin/areas/:areaId', authenticate, authorize(['admin']), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty'),
  body('coordinates.lat').optional().isFloat().withMessage('Valid latitude is required'),
  body('coordinates.lng').optional().isFloat().withMessage('Valid longitude is required')
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

    const parking = await Parking.findById(req.params.areaId);
    if (!parking) {
      return res.status(404).json({
        success: false,
        message: 'Parking area not found'
      });
    }

    if (req.body.name) parking.name = req.body.name;
    if (req.body.location) parking.location = req.body.location;
    if (req.body.coordinates) parking.coordinates = req.body.coordinates;

    await parking.save();

    res.json({
      success: true,
      message: 'Parking area updated successfully',
      parking
    });
  } catch (error) {
    console.error('Update parking area error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/parking/admin/areas/:areaId:
 *   delete:
 *     summary: Delete a parking area (Admin only)
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: areaId
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
 * /api/parking/admin/areas/{areaId}:
 *   delete:
 *     tags:
 *       - Parking
 *     summary: Delete a parking area (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
        name: areaId
        required: true
        schema:
          type: string
        description: areaId parameter
 *     responses:
 *       200:
 *         description: Successful response
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// @route   DELETE /api/parking/admin/areas/:areaId
// @desc    Delete a parking area (Admin only)
// @access  Private (Admin only)
router.delete('/admin/areas/:areaId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.areaId);
    if (!parking) {
      return res.status(404).json({
        success: false,
        message: 'Parking area not found'
      });
    }

    // Check if there are active bookings
    const activeBookings = await Booking.countDocuments({
      'parking.areaId': req.params.areaId,
      status: { $in: ['confirmed', 'pending'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete parking area with active bookings'
      });
    }

    await Parking.findByIdAndDelete(req.params.areaId);

    res.json({
      success: true,
      message: 'Parking area deleted successfully'
    });
  } catch (error) {
    console.error('Delete parking area error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/parking/admin/areas/:areaId/slots:
 *   post:
 *     summary: Add slots to a parking area (Admin only)
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: areaId
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
 * /api/parking/admin/areas/{areaId}/slots:
 *   post:
 *     tags:
 *       - Parking
 *     summary: Add slots to a parking area (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
        name: areaId
        required: true
        schema:
          type: string
        description: areaId parameter
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
// @route   POST /api/parking/admin/areas/:areaId/slots
// @desc    Add slots to a parking area (Admin only)
// @access  Private (Admin only)
router.post('/admin/areas/:areaId/slots', authenticate, authorize(['admin']), [
  body('slots').isArray({ min: 1 }).withMessage('At least one slot is required'),
  body('slots.*.slotNumber').notEmpty().withMessage('Slot number is required'),
  body('slots.*.size').isIn(['Standard', 'Large']).withMessage('Size must be Standard or Large'),
  body('slots.*.pricePerDay').isFloat({ min: 0 }).withMessage('Price per day must be 0 or greater'),
  body('slots.*.location').notEmpty().withMessage('Location is required')
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

    const parking = await Parking.findById(req.params.areaId);
    if (!parking) {
      return res.status(404).json({
        success: false,
        message: 'Parking area not found'
      });
    }

    const { slots } = req.body;
    const addedSlots = [];

    for (const slotData of slots) {
      // Check if slot number already exists in this area
      const existingSlot = parking.slots.find(s => s.slotNumber === slotData.slotNumber);
      if (existingSlot) {
        continue; // Skip if slot already exists
      }

      parking.slots.push({
        slotNumber: slotData.slotNumber,
        size: slotData.size,
        pricePerDay: slotData.pricePerDay,
        location: slotData.location,
        status: slotData.status || 'available'
      });

      addedSlots.push(slotData.slotNumber);
    }

    // Update total and available slots
    parking.totalSlots = parking.slots.length;
    parking.availableSlots = parking.slots.filter(s => s.status === 'available').length;

    await parking.save();

    res.status(201).json({
      success: true,
      message: `${addedSlots.length} slot(s) added successfully`,
      addedSlots,
      totalSlots: parking.totalSlots,
      availableSlots: parking.availableSlots
    });
  } catch (error) {
    console.error('Add slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/parking/admin/areas/:areaId/slots/:slotId:
 *   put:
 *     summary: Update a parking slot (Admin only)
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: areaId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: slotId
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
 * /api/parking/admin/areas/{areaId}/slots/{slotId}:
 *   put:
 *     tags:
 *       - Parking
 *     summary: Update a parking slot (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
        name: areaId
        required: true
        schema:
          type: string
        description: areaId parameter
 *      - in: path
        name: slotId
        required: true
        schema:
          type: string
        description: slotId parameter
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
// @route   PUT /api/parking/admin/areas/:areaId/slots/:slotId
// @desc    Update a parking slot (Admin only)
// @access  Private (Admin only)
router.put('/admin/areas/:areaId/slots/:slotId', authenticate, authorize(['admin']), [
  body('slotNumber').optional().notEmpty().withMessage('Slot number cannot be empty'),
  body('size').optional().isIn(['Standard', 'Large']).withMessage('Size must be Standard or Large'),
  body('pricePerDay').optional().isFloat({ min: 0 }).withMessage('Price per day must be 0 or greater'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty'),
  body('status').optional().isIn(['available', 'occupied', 'reserved', 'maintenance']).withMessage('Invalid status')
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

    const parking = await Parking.findById(req.params.areaId);
    if (!parking) {
      return res.status(404).json({
        success: false,
        message: 'Parking area not found'
      });
    }

    const slot = parking.slots.id(req.params.slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    const oldStatus = slot.status;

    if (req.body.slotNumber) slot.slotNumber = req.body.slotNumber;
    if (req.body.size) slot.size = req.body.size;
    if (req.body.pricePerDay !== undefined) slot.pricePerDay = req.body.pricePerDay;
    if (req.body.location) slot.location = req.body.location;
    if (req.body.status) slot.status = req.body.status;

    // Update available slots count if status changed
    if (oldStatus !== slot.status) {
      if (oldStatus === 'available' && slot.status !== 'available') {
        parking.availableSlots = Math.max(0, parking.availableSlots - 1);
      } else if (oldStatus !== 'available' && slot.status === 'available') {
        parking.availableSlots = Math.min(parking.totalSlots, parking.availableSlots + 1);
      }
    }

    await parking.save();

    res.json({
      success: true,
      message: 'Slot updated successfully',
      slot
    });
  } catch (error) {
    console.error('Update slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/parking/admin/areas/:areaId/slots/:slotId:
 *   delete:
 *     summary: Delete a parking slot (Admin only)
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: areaId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: slotId
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
 * /api/parking/admin/areas/{areaId}/slots/{slotId}:
 *   delete:
 *     tags:
 *       - Parking
 *     summary: Delete a parking slot (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
        name: areaId
        required: true
        schema:
          type: string
        description: areaId parameter
 *      - in: path
        name: slotId
        required: true
        schema:
          type: string
        description: slotId parameter
 *     responses:
 *       200:
 *         description: Successful response
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// @route   DELETE /api/parking/admin/areas/:areaId/slots/:slotId
// @desc    Delete a parking slot (Admin only)
// @access  Private (Admin only)
router.delete('/admin/areas/:areaId/slots/:slotId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.areaId);
    if (!parking) {
      return res.status(404).json({
        success: false,
        message: 'Parking area not found'
      });
    }

    const slot = parking.slots.id(req.params.slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    // Check if slot has active booking
    if (slot.status === 'reserved' || slot.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete slot with active booking'
      });
    }

    const wasAvailable = slot.status === 'available';
    slot.deleteOne();
    
    parking.totalSlots = parking.slots.length;
    if (wasAvailable) {
      parking.availableSlots = Math.max(0, parking.availableSlots - 1);
    }

    await parking.save();

    res.json({
      success: true,
      message: 'Slot deleted successfully'
    });
  } catch (error) {
    console.error('Delete slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
