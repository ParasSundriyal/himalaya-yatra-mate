import mongoose from 'mongoose';

const sosSchema = new mongoose.Schema({
  sosId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pilgrimId: {
    type: String,
  },
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'enroute', 'resolved'],
    default: 'active',
  },
  nearestStation: {
    name: String,
    distance: Number,
    phone: String,
  },
  healthConditions: [String],
  timeline: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String,
    },
  ],
  emergencyContact: {
    name: String,
    phone: String,
  },
  smsSent: { type: Boolean, default: false },
}, { timestamps: true });

const SOS = mongoose.model('SOS', sosSchema);
export default SOS;
