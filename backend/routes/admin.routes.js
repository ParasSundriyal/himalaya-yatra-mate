import express from 'express';
import User from '../models/User.model.js';
import Booking from '../models/Booking.model.js';
import Parking from '../models/Parking.model.js';
import Hotel from '../models/Hotel.model.js';
import Taxi from '../models/Taxi.model.js';
import AIDetection from '../models/AIDetection.model.js';
import Group from '../models/Group.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalTourists,
      totalGroups,
      totalBookings,
      activeBookings,
      totalHotels,
      totalTaxis,
      totalParkingSlots,
      occupiedParkingSlots,
      todayDetections,
      activeVehicles
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'user' }),
      Group.countDocuments({}),
      Booking.countDocuments({}),
      Booking.countDocuments({ status: 'confirmed' }),
      Hotel.countDocuments({ isActive: true }),
      Taxi.countDocuments({ isActive: true }),
      Parking.aggregate([
        { $unwind: '$slots' },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]),
      Parking.aggregate([
        { $unwind: '$slots' },
        { $match: { 'slots.status': { $in: ['occupied', 'reserved'] } } },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]),
      AIDetection.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      AIDetection.countDocuments({
        detectionType: 'entry',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }) - AIDetection.countDocuments({
        detectionType: 'exit',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    const totalSlots = totalParkingSlots[0]?.total || 0;
    const occupiedSlots = occupiedParkingSlots[0]?.total || 0;
    const parkingOccupancy = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          tourists: totalTourists,
          groups: totalGroups
        },
        bookings: {
          total: totalBookings,
          active: activeBookings
        },
        services: {
          hotels: totalHotels,
          taxis: totalTaxis,
          parkingSlots: totalSlots,
          parkingOccupancy: `${parkingOccupancy}%`,
          occupiedParkingSlots: occupiedSlots
        },
        aiDetection: {
          todayDetections,
          activeVehicles: Math.max(0, activeVehicles)
        }
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private (Admin)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings with filters
// @access  Private (Admin)
router.get('/bookings', async (req, res) => {
  try {
    const { type, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (type) query.bookingType = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('parking.areaId', 'name location')
      .populate('hotel.hotelId', 'name location')
      .populate('taxi.taxiId', 'driverName vehicleType')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      count: bookings.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      bookings
    });
  } catch (error) {
    console.error('Get admin bookings error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/activities
// @desc    Get recent activities
// @access  Private (Admin)
router.get('/activities', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;

    const [recentBookings, recentDetections, recentUsers] = await Promise.all([
      Booking.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('bookingType status user createdAt'),
      AIDetection.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('vehicleNumber detectionType location gate createdAt'),
      User.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name email role createdAt')
    ]);

    // Combine and sort activities
    const activities = [
      ...recentBookings.map(booking => ({
        type: 'booking',
        action: `${booking.bookingType} booking`,
        user: booking.user?.name || 'Unknown',
        status: booking.status,
        timestamp: booking.createdAt
      })),
      ...recentDetections.map(detection => ({
        type: 'detection',
        action: `Vehicle ${detection.detectionType}`,
        vehicle: detection.vehicleNumber,
        location: detection.location,
        timestamp: detection.createdAt
      })),
      ...recentUsers.map(user => ({
        type: 'user',
        action: 'New registration',
        user: user.name,
        role: user.role,
        timestamp: user.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

    res.json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

export default router;
