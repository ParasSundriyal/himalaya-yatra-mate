import mongoose from 'mongoose';

const checkpointPassSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for generic passes
    default: null
  },
  checkpoint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checkpoint',
    required: true
  },
  // Time slot for the pass
  timeSlot: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  // Vehicle owner information (required for booking)
  vehicleOwnerName: {
    type: String,
    required: true,
    trim: true
  },
  vehicleOwnerPhone: {
    type: String,
    required: true,
    trim: true
  },
  // Vehicle information
  vehicleNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  // Number of people in the group
  numberOfPeople: {
    type: Number,
    default: 1,
    min: 1
  },
  // QR code data URL
  qrCode: {
    type: String,
    required: true
  },
  // Unique pass ID for QR code
  passId: {
    type: String,
    required: true,
    unique: true
  },
  // Status of the pass
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'used', 'expired', 'cancelled'],
    default: 'confirmed'
  },
  // Verification tracking
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Amount paid
  amount: {
    type: Number,
    default: 0,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'paid' // For free passes or admin-issued passes
  },
  transactionId: {
    type: String,
    default: null
  },
  // Issued by (admin, user, or null for public bookings)
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  // Booking type: 'public', 'user', 'group'
  bookingType: {
    type: String,
    enum: ['public', 'user', 'group'],
    default: 'public'
  },
  // Cancellation details
  cancellationReason: String,
  cancelledAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
checkpointPassSchema.index({ user: 1, createdAt: -1 });
checkpointPassSchema.index({ checkpoint: 1, 'timeSlot.start': 1, 'timeSlot.end': 1 });
checkpointPassSchema.index({ passId: 1 });
checkpointPassSchema.index({ status: 1 });
checkpointPassSchema.index({ 'timeSlot.start': 1, 'timeSlot.end': 1 });
checkpointPassSchema.index({ vehicleNumber: 1, checkpoint: 1, status: 1 });
checkpointPassSchema.index({ vehicleOwnerPhone: 1 });

// Method to check if pass is currently valid
checkpointPassSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.status === 'confirmed' &&
    now >= this.timeSlot.start &&
    now <= this.timeSlot.end
  );
};

// Method to check if pass is expired
checkpointPassSchema.methods.isExpired = function() {
  const now = new Date();
  return now > this.timeSlot.end;
};

// Static method to generate unique pass ID
checkpointPassSchema.statics.generatePassId = function() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `PASS-${timestamp}-${random}`;
};

// Pre-save middleware to update status based on time
checkpointPassSchema.pre('save', function(next) {
  if (this.status === 'confirmed' && this.isExpired()) {
    this.status = 'expired';
  }
  next();
});

const CheckpointPass = mongoose.model('CheckpointPass', checkpointPassSchema);

export default CheckpointPass;

