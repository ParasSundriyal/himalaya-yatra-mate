import mongoose from 'mongoose';

const taxiSchema = new mongoose.Schema({
  driverName: {
    type: String,
    required: [true, 'Driver name is required']
  },
  driverPhone: {
    type: String,
    required: [true, 'Driver phone is required'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required']
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true
  },
  seats: {
    type: Number,
    required: [true, 'Number of seats is required'],
    min: 4,
    max: 12
  },
  ratePerKm: {
    type: Number,
    required: [true, 'Rate per km is required']
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRides: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    enum: ['Badrinath', 'Kedarnath', 'Gangotri', 'Yamunotri', 'Rishikesh', 'Haridwar'],
    required: true
  },
  coordinates: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  licenseNumber: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Taxi = mongoose.model('Taxi', taxiSchema);

export default Taxi;
