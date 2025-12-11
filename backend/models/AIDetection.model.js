import mongoose from 'mongoose';

const aiDetectionSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required']
  },
  detectionType: {
    type: String,
    enum: ['entry', 'exit'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  gate: {
    type: String,
    required: true
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  imageUrl: {
    type: String
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
aiDetectionSchema.index({ vehicleNumber: 1, createdAt: -1 });
aiDetectionSchema.index({ location: 1, createdAt: -1 });
aiDetectionSchema.index({ detectionType: 1 });

const AIDetection = mongoose.model('AIDetection', aiDetectionSchema);

export default AIDetection;
