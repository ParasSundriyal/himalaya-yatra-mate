import mongoose from 'mongoose';

const dhamPassSchema = new mongoose.Schema({
  passId: {
    type: String,
    required: true,
    unique: true,
  },
  pilgrimId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dham: {
    type: String,
    enum: ['Yamunotri', 'Gangotri', 'Kedarnath', 'Badrinath'],
    required: true,
  },
  visitDate: {
    type: Date,
    required: true,
  },
  slot: {
    type: String,
    default: 'Morning',
  },
  status: {
    type: String,
    enum: ['active', 'used', 'cancelled', 'expired'],
    default: 'active',
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  usedAt: {
    type: Date,
  },
}, { timestamps: true });

const DhamPass = mongoose.model('DhamPass', dhamPassSchema);
export default DhamPass;
