import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hotel name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    enum: ['Badrinath', 'Kedarnath', 'Gangotri', 'Yamunotri', 'Rishikesh', 'Haridwar']
  },
  /** Lowercase dham key for itinerary queries: yamunotri | gangotri | kedarnath | badrinath */
  dham: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
  },
  type: {
    type: String,
    enum: ['dharamshala', 'budget', 'midrange', 'premium'],
    default: 'midrange',
  },
  distanceFromTemple: {
    type: Number,
    default: 1,
    min: 0,
  },
  isGMVN: {
    type: Boolean,
    default: false,
  },
  locationName: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
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
    type: String
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  pricePerNight: {
    type: Number,
    required: [true, 'Price per night is required']
  },
  amenities: [{
    type: String
  }],
  images: [{
    type: String
  }],
  totalRooms: {
    type: Number,
    required: true
  },
  availableRooms: {
    type: Number,
    default: function() {
      return this.totalRooms;
    }
  },
  contact: {
    phone: String,
    email: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

hotelSchema.index({ dham: 1, type: 1, isActive: 1 });
hotelSchema.index({ location: 1, isActive: 1 });

const Hotel = mongoose.model('Hotel', hotelSchema);

export default Hotel;
