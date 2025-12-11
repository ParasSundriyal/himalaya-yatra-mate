import express from 'express';
import Booking from '../models/Booking.model.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/bookings
// @desc    Get all user's bookings
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, status } = req.query;
    
    const query = { user: req.user._id };
    
    if (type) {
      query.bookingType = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('parking.areaId', 'name location')
      .populate('hotel.hotelId', 'name location')
      .populate('taxi.taxiId', 'driverName vehicleType');
    
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

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('parking.areaId', 'name location')
      .populate('hotel.hotelId', 'name location pricePerNight')
      .populate('taxi.taxiId', 'driverName driverPhone vehicleType vehicleNumber');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

export default router;
