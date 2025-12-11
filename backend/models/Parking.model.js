import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  slotNumber: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  size: {
    type: String,
    enum: ['Standard', 'Large'],
    default: 'Standard'
  },
  pricePerDay: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  entryTime: {
    type: Date,
    default: null
  },
  exitTime: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const parkingAreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
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
  totalSlots: {
    type: Number,
    required: true
  },
  availableSlots: {
    type: Number,
    default: function() {
      return this.totalSlots;
    }
  },
  slots: [slotSchema]
}, { timestamps: true });

const Parking = mongoose.model('Parking', parkingAreaSchema);

export default Parking;
