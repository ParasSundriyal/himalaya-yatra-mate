import express from 'express';
import { body, validationResult } from 'express-validator';
import Group from '../models/Group.model.js';
import User from '../models/User.model.js';
import Booking from '../models/Booking.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   POST /api/groups
// @desc    Create a new group (Group Instructor only)
// @access  Private (Group role)
router.post('/', authenticate, authorize('group', 'admin'), [
  body('name').trim().notEmpty().withMessage('Group name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    // Check if user already has a group
    const existingGroup = await Group.findOne({ instructor: req.user._id });
    if (existingGroup && req.user.role !== 'admin') {
      return res.status(400).json({ 
        message: 'You already have a group. One instructor can manage one group.' 
      });
    }

    // Create group
    const group = new Group({
      name,
      description,
      instructor: req.user._id,
      members: []
    });

    await group.save();

    // Update user's groupId
    req.user.groupId = group._id;
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/groups/my-group
// @desc    Get instructor's group
// @access  Private (Group role)
router.get('/my-group', authenticate, authorize('group', 'admin'), async (req, res) => {
  try {
    const group = await Group.findOne({ instructor: req.user._id })
      .populate('members', 'name email phone aadhar isVerified isActive')
      .populate('instructor', 'name email phone');

    if (!group) {
      return res.status(404).json({ message: 'Group not found. Create a group first.' });
    }

    res.json({
      success: true,
      group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   POST /api/groups/add-member
// @desc    Add a member to the group
// @access  Private (Group role)
router.post('/add-member', authenticate, authorize('group', 'admin'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('aadhar').optional().matches(/^[0-9]{12}$/).withMessage('Aadhar must be 12 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get instructor's group
    const group = await Group.findOne({ instructor: req.user._id });
    if (!group) {
      return res.status(404).json({ message: 'Group not found. Create a group first.' });
    }

    const { name, email, phone, aadhar, dateOfBirth, address } = req.body;

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (user) {
      // If user exists, add to group if not already a member
      if (!group.members.includes(user._id)) {
        group.members.push(user._id);
        user.instructorId = req.user._id;
        await user.save();
        await group.save();
      }
    } else {
      // Create new user
      // Generate a random password (in production, send via email)
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      user = new User({
        name,
        email,
        password: tempPassword, // Will be hashed by pre-save hook
        phone,
        aadhar,
        dateOfBirth,
        address,
        role: 'user',
        instructorId: req.user._id
      });

      await user.save();
      group.members.push(user._id);
      await group.save();
    }

    res.status(201).json({
      success: true,
      message: 'Member added to group successfully',
      member: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   DELETE /api/groups/remove-member/:memberId
// @desc    Remove a member from the group
// @access  Private (Group role)
router.delete('/remove-member/:memberId', authenticate, authorize('group', 'admin'), async (req, res) => {
  try {
    const { memberId } = req.params;

    const group = await Group.findOne({ instructor: req.user._id });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Remove member from group
    group.members = group.members.filter(member => member.toString() !== memberId);
    await group.save();

    // Update user's instructorId
    await User.findByIdAndUpdate(memberId, { instructorId: null });

    res.json({
      success: true,
      message: 'Member removed from group successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/groups/member-bookings
// @desc    Get all bookings from group members
// @access  Private (Group role)
router.get('/member-bookings', authenticate, authorize('group', 'admin'), async (req, res) => {
  try {
    const { type, status } = req.query;
    
    // Get instructor's group (without populating members to get ObjectIds directly)
    const group = await Group.findOne({ instructor: req.user._id }).select('members');
    if (!group) {
      return res.status(404).json({ message: 'Group not found. Create a group first.' });
    }

    // Check if group has any members
    if (!group.members || group.members.length === 0) {
      return res.json({
        success: true,
        count: 0,
        bookings: []
      });
    }

    // group.members is already an array of ObjectIds, use directly
    const memberIds = group.members;
    
    // Build query
    const query = { user: { $in: memberIds } };
    
    if (type) {
      query.bookingType = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Fetch bookings with populated data
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .populate('parking.areaId', 'name location')
      .populate('hotel.hotelId', 'name location pricePerNight')
      .populate('taxi.taxiId', 'driverName driverPhone vehicleType vehicleNumber');
    
    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get member bookings error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/groups/:groupId
// @desc    Get group by ID (for admin)
// @access  Private (Admin)
router.get('/:groupId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members', 'name email phone')
      .populate('instructor', 'name email phone');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({
      success: true,
      group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

export default router;
