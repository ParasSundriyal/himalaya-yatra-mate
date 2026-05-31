import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Group reference - automatically set when member books
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  bookingType: {
    type: String,
    enum: ['parking', 'hotel', 'taxi'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  // Parking booking details
  parking: {
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parking.slots'
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parking'
    },
    slotNumber: String,
    vehicleNumber: String,
    entryTime: Date,
    exitTime: Date,
    qrCode: String,
    /** Set when admin scans QR at entry — starts pilgrim timer */
    scannedAt: Date,
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  // Hotel booking details
  hotel: {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel'
    },
    checkIn: Date,
    checkOut: Date,
    guests: Number,
    rooms: Number
  },
  // Taxi booking details
  taxi: {
    taxiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxi'
    },
    pickupLocation: String,
    dropoffLocation: String,
    pickupTime: Date,
    distance: Number, // in km
    estimatedFare: Number
  },
  amount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: null
  },
  cancellationReason: String,
  cancelledAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingType: 1 });
bookingSchema.index({ groupId: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
