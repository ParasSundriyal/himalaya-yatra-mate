import mongoose from 'mongoose';

const checkpointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Checkpoint name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Checkpoint location is required'],
    trim: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Time slot configuration
  slotDuration: {
    type: Number,
    default: 60, // Duration in minutes (default 1 hour)
    required: true
  },
  operatingHours: {
    start: {
      type: String,
      default: '00:00', // 24-hour format - full day availability
      required: true
    },
    end: {
      type: String,
      default: '24:00', // 24-hour format - full day availability (24:00 means end of day)
      required: true
    }
  },
  // Maximum passes per time slot
  maxPassesPerSlot: {
    type: Number,
    default: 50,
    required: true
  },
  // Price per hour (can be 0 for free)
  pricePerHour: {
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
checkpointSchema.index({ isActive: 1 });
checkpointSchema.index({ location: 1 });

const Checkpoint = mongoose.model('Checkpoint', checkpointSchema);

export default Checkpoint;

