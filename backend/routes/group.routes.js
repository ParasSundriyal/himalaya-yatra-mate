import express from 'express';
import { body, validationResult } from 'express-validator';
import Group from '../models/Group.model.js';
import User from '../models/User.model.js';
import Booking from '../models/Booking.model.js';
import CheckpointPass from '../models/CheckpointPass.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Groups
 *     description: Group management for instructors and members
 */

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group (Group Instructor only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Group already exists
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group (Group Instructor only)
 *     tags: [Groups]
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
 * /api/groups:
 *   post:
 *     tags:
 *       - Groups
 *     summary: Create a new group (Group Instructor only)
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

/**
 * @swagger
 * /api/groups/my-group:
 *   get:
 *     summary: Get instructor's group
 *     tags: [Groups]
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
 * /api/groups/my-group:
 *   get:
 *     tags:
 *       - Groups
 *     summary: Get instructor's group
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

/**
 * @swagger
 * /api/groups/add-member:
 *   post:
 *     summary: Add a member to the group
 *     tags: [Groups]
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
 * /api/groups/add-member:
 *   post:
 *     tags:
 *       - Groups
 *     summary: Add a member to the group
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

/**
 * @swagger
 * /api/groups/remove-member/:memberId:
 *   delete:
 *     summary: Remove a member from the group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
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
 * /api/groups/remove-member/{memberId}:
 *   delete:
 *     tags:
 *       - Groups
 *     summary: Remove a member from the group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
        name: memberId
        required: true
        schema:
          type: string
        description: memberId parameter
 *     responses:
 *       200:
 *         description: Successful response
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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

/**
 * @swagger
 * /api/groups/member-bookings:
 *   get:
 *     summary: Get all bookings from group members (including parking, hotels, taxis, and hourly passes)
 *     tags: [Groups]
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
 * /api/groups/member-bookings:
 *   get:
 *     tags:
 *       - Groups
 *     summary: Get all bookings from group members (including parking, hotels, taxis, and hourly passes)
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
// @route   GET /api/groups/member-bookings
// @desc    Get all bookings from group members (including parking, hotels, taxis, and hourly passes)
// @access  Private (Group role)
router.get('/member-bookings', authenticate, authorize('group', 'admin'), async (req, res) => {
  try {
    const { type, status } = req.query;
    
    // Get instructor's group (without populating members to get ObjectIds directly)
    const group = await Group.findOne({ instructor: req.user._id }).select('members _id');
    if (!group) {
      return res.status(404).json({ message: 'Group not found. Create a group first.' });
    }

    const groupId = group._id;
    const memberIds = group.members || [];
    const instructorId = req.user._id;
    
    // Retroactively update bookings/passes that have null groupId
    // This fixes existing data that was created before the auto-linking feature
    // Update bookings by members OR by instructor
    if (memberIds.length > 0) {
      await Booking.updateMany(
        { 
          $or: [
            { user: { $in: memberIds } },
            { user: instructorId }
          ],
          groupId: null 
        },
        { 
          $set: { groupId: groupId } 
        }
      );
    } else {
      // Even if no members, update instructor's bookings
      await Booking.updateMany(
        { 
          user: instructorId,
          groupId: null 
        },
        { 
          $set: { groupId: groupId } 
        }
      );
    }
    
    // Update hourly passes by members OR by instructor
    if (memberIds.length > 0) {
      await CheckpointPass.updateMany(
        { 
          $or: [
            { user: { $in: memberIds } },
            { user: instructorId },
            { issuedBy: instructorId }
          ],
          groupId: null 
        },
        { 
          $set: { groupId: groupId } 
        }
      );
    } else {
      // Even if no members, update instructor's passes
      await CheckpointPass.updateMany(
        { 
          $or: [
            { user: instructorId },
            { issuedBy: instructorId }
          ],
          groupId: null 
        },
        { 
          $set: { groupId: groupId } 
        }
      );
    }
    
    // Build query for regular bookings (hotels, taxis, parking)
    // Query by:
    // 1. Member IDs (bookings by group members)
    // 2. groupId (bookings linked to group)
    // 3. Instructor ID (bookings made by instructor for the whole group)
    const bookingQueryConditions = [];
    
    if (memberIds.length > 0) {
      bookingQueryConditions.push({ user: { $in: memberIds } });
    }
    bookingQueryConditions.push({ groupId: groupId });
    bookingQueryConditions.push({ user: instructorId }); // Instructor's own bookings
    
    const bookingQuery = {
      $or: bookingQueryConditions
    };
    
    if (type && type !== 'hourly-pass') {
      bookingQuery.bookingType = type;
    }
    
    if (status) {
      bookingQuery.status = status;
    }
    
    // Fetch bookings with populated data
    const bookings = await Booking.find(bookingQuery)
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .populate('parking.areaId', 'name location')
      .populate('hotel.hotelId', 'name location pricePerNight')
      .populate('taxi.taxiId', 'driverName driverPhone vehicleType vehicleNumber');
    
    // Fetch hourly passes for group members
    // Query by:
    // 1. Member IDs (passes booked by group members)
    // 2. groupId (passes linked to group)
    // 3. Instructor ID (passes booked by instructor for the whole group)
    // 4. issuedBy (passes issued by instructor)
    const passQueryConditions = [];
    
    if (memberIds.length > 0) {
      passQueryConditions.push({ user: { $in: memberIds } });
    }
    passQueryConditions.push({ groupId: groupId });
    passQueryConditions.push({ user: instructorId }); // Instructor's own passes
    passQueryConditions.push({ issuedBy: instructorId }); // Passes issued by instructor
    
    const passQuery = {
      $or: passQueryConditions
    };
    
    if (status) {
      passQuery.status = status;
    }
    
    const hourlyPasses = await CheckpointPass.find(passQuery)
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .populate('checkpoint', 'name location');
    
    res.json({
      success: true,
      count: bookings.length + hourlyPasses.length,
      bookings,
      hourlyPasses
    });
  } catch (error) {
    console.error('Get member bookings error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/groups/:groupId:
 *   get:
 *     summary: Get group by ID (for admin)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
 * /api/groups/{groupId}:
 *   get:
 *     tags:
 *       - Groups
 *     summary: Get group by ID (for admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
        name: groupId
        required: true
        schema:
          type: string
        description: groupId parameter
 *     responses:
 *       200:
 *         description: Successful response
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
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
