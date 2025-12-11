import express from 'express';
import { body, validationResult } from 'express-validator';
import Checkpoint from '../models/Checkpoint.model.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/checkpoints
// @desc    Get all active checkpoints (admins get all)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const query = isAdmin ? {} : { isActive: true };

    const checkpoints = await Checkpoint.find(query)
      .select('name location coordinates description slotDuration operatingHours maxPassesPerSlot pricePerHour isActive')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: checkpoints.length,
      checkpoints
    });
  } catch (error) {
    console.error('Get checkpoints error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/checkpoints
// @desc    Create a new checkpoint (Admin only)
router.post('/', authenticate, authorize(['admin']), [
  body('name').notEmpty().withMessage('Checkpoint name is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('coordinates.lat').isFloat().withMessage('Valid latitude is required'),
  body('coordinates.lng').isFloat().withMessage('Valid longitude is required'),
  body('slotDuration').optional().isInt({ min: 1 }).withMessage('Slot duration must be at least 1 minute'),
  body('maxPassesPerSlot').optional().isInt({ min: 1 }).withMessage('Max passes per slot must be at least 1'),
  body('pricePerHour').optional().isFloat({ min: 0 }).withMessage('Price per hour must be 0 or greater')
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

    const checkpoint = new Checkpoint({
      name: req.body.name,
      location: req.body.location,
      coordinates: req.body.coordinates,
      description: req.body.description,
      slotDuration: req.body.slotDuration || 60,
      operatingHours: req.body.operatingHours || { start: '00:00', end: '24:00' },
      maxPassesPerSlot: req.body.maxPassesPerSlot || 50,
      pricePerHour: req.body.pricePerHour || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });

    await checkpoint.save();

    res.status(201).json({
      success: true,
      message: 'Checkpoint created successfully',
      checkpoint
    });
  } catch (error) {
    console.error('Create checkpoint error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/checkpoints/:checkpointId
// @desc    Update a checkpoint (Admin only)
router.put('/:checkpointId', authenticate, authorize(['admin']), [
  body('name').optional().notEmpty().withMessage('Checkpoint name cannot be empty'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty'),
  body('coordinates.lat').optional().isFloat().withMessage('Valid latitude is required'),
  body('coordinates.lng').optional().isFloat().withMessage('Valid longitude is required'),
  body('slotDuration').optional().isInt({ min: 1 }).withMessage('Slot duration must be at least 1 minute'),
  body('maxPassesPerSlot').optional().isInt({ min: 1 }).withMessage('Max passes per slot must be at least 1'),
  body('pricePerHour').optional().isFloat({ min: 0 }).withMessage('Price per hour must be 0 or greater')
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

    const checkpoint = await Checkpoint.findById(req.params.checkpointId);
    if (!checkpoint) {
      return res.status(404).json({ message: 'Checkpoint not found' });
    }

    if (req.body.name) checkpoint.name = req.body.name;
    if (req.body.location) checkpoint.location = req.body.location;
    if (req.body.coordinates) checkpoint.coordinates = req.body.coordinates;
    if (req.body.description !== undefined) checkpoint.description = req.body.description;
    if (req.body.slotDuration) checkpoint.slotDuration = req.body.slotDuration;
    if (req.body.operatingHours) checkpoint.operatingHours = req.body.operatingHours;
    if (req.body.maxPassesPerSlot) checkpoint.maxPassesPerSlot = req.body.maxPassesPerSlot;
    if (req.body.pricePerHour !== undefined) checkpoint.pricePerHour = req.body.pricePerHour;
    if (req.body.isActive !== undefined) checkpoint.isActive = req.body.isActive;

    await checkpoint.save();

    res.json({
      success: true,
      message: 'Checkpoint updated successfully',
      checkpoint
    });
  } catch (error) {
    console.error('Update checkpoint error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/checkpoints/:checkpointId
// @desc    Delete a checkpoint (Admin only)
router.delete('/:checkpointId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findById(req.params.checkpointId);
    if (!checkpoint) {
      return res.status(404).json({ message: 'Checkpoint not found' });
    }

    await Checkpoint.findByIdAndDelete(req.params.checkpointId);

    res.json({
      success: true,
      message: 'Checkpoint deleted successfully'
    });
  } catch (error) {
    console.error('Delete checkpoint error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;

