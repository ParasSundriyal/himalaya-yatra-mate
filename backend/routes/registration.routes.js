import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';
import { generatePilgrimId, hashAadhaar } from '../utils/pilgrimId.js';
import { syncPilgrimToFirestore } from '../services/pilgrimFirestoreSync.js';

const router = express.Router();

/**
 * POST /api/registration/profile
 * Completes Smart Chardham profile after login (OTP/Firebase can be wired later).
 * Stores Aadhaar only as SHA-256 hash. Generates CY-[STATE]-[YEAR]-[6-digit] pilgrim ID.
 */
router.post(
  '/profile',
  authenticate,
  [
    body('fullName').optional().trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_say']),
    body('homeState').trim().notEmpty().withMessage('homeState is required'),
    body('emergencyContact').isObject().withMessage('emergencyContact is required'),
    body('emergencyContact.name').trim().notEmpty(),
    body('emergencyContact.phone').matches(/^[0-9]{10}$/),
    body('aadhaar12').matches(/^[0-9]{12}$/).withMessage('Aadhaar must be exactly 12 digits'),
    body('healthConditions').isArray(),
    body('fitnessLevel').isIn(['low', 'moderate', 'active']),
    body('vehicle').optional().isObject(),
    body('groupInfo').optional().isObject(),
    body('locationCapture').optional().isObject(),
    body('locationCapture.latitude')
      .optional()
      .isFloat({ min: -90, max: 90 }),
    body('locationCapture.longitude')
      .optional()
      .isFloat({ min: -180, max: 180 }),
    body('locationCapture.accuracyMeters')
      .optional()
      .isFloat({ min: 0, max: 50000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.registrationCompleted) {
        return res.status(409).json({
          message:
            'Pilgrim registration is already complete for this account. Your details are saved.',
          pilgrimId: user.pilgrimId,
          registrationCompleted: true,
        });
      }

      const {
        fullName,
        dateOfBirth,
        gender,
        homeState,
        emergencyContact,
        aadhaar12,
        healthConditions,
        fitnessLevel,
        vehicle,
        groupInfo,
        locationCapture,
      } = req.body;

      const aadhaarHash = hashAadhaar(aadhaar12);

      const duplicateHash = await User.findOne({
        aadhaarHash,
        _id: { $ne: user._id },
      }).select('_id');
      if (duplicateHash) {
        return res.status(400).json({ message: 'This Aadhaar is already registered' });
      }

      if (!user.pilgrimId) {
        user.pilgrimId = generatePilgrimId(homeState);
      }

      if (fullName) user.name = fullName;
      if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
      if (gender !== undefined && gender !== null && gender !== '') {
        user.gender = gender;
      }
      user.homeState = homeState;
      user.address = { ...user.address, state: homeState };
      user.emergencyContact = emergencyContact;
      user.aadhaarHash = aadhaarHash;
      user.healthConditions = healthConditions;
      user.fitnessLevel = fitnessLevel;

      if (vehicle && (vehicle.vehicleType || vehicle.registrationNumber)) {
        user.vehicle = {
          vehicleType: vehicle.vehicleType || '',
          registrationNumber: vehicle.registrationNumber || '',
          passengers: vehicle.passengers ?? 0,
        };
      }

      if (groupInfo && groupInfo.name) {
        let pinHash = undefined;
        if (groupInfo.pin && String(groupInfo.pin).length >= 4) {
          pinHash = await bcrypt.hash(String(groupInfo.pin), 10);
        }
        user.groupInfo = {
          name: groupInfo.name,
          size: groupInfo.size || 1,
          pinHash,
        };
      }

      user.registrationCompleted = true;
      await user.save();

      let firestoreSync = { ok: false, reason: 'skipped' };
      try {
        const loc =
          locationCapture &&
          typeof locationCapture.latitude === 'number' &&
          typeof locationCapture.longitude === 'number'
            ? {
                latitude: locationCapture.latitude,
                longitude: locationCapture.longitude,
                accuracyMeters: locationCapture.accuracyMeters,
              }
            : null;
        firestoreSync = await syncPilgrimToFirestore(user, loc);
      } catch (syncErr) {
        console.error('[Firestore] Pilgrim sync failed (Mongo save already OK):', syncErr.message);
        firestoreSync = { ok: false, reason: syncErr.message };
      }

      res.json({
        message: 'Profile saved',
        pilgrimId: user.pilgrimId,
        user: user.toJSON(),
        firestoreSynced: firestoreSync.ok === true,
      });
    } catch (error) {
      console.error('Registration profile error:', error);
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Pilgrim ID collision — retry' });
      }
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
);

export default router;
