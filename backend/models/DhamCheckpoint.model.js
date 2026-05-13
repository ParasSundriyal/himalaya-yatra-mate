import mongoose from 'mongoose';

const dhamCheckpointSchema = new mongoose.Schema(
  {
    dham: {
      type: String,
      required: true,
      lowercase: true,
      enum: ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'],
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['entry', 'registration', 'medical', 'helipad', 'other'],
      default: 'entry',
    },
    distanceFromTemple: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true, default: '' },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    isOperational: { type: Boolean, default: true },
  },
  { timestamps: true },
);

dhamCheckpointSchema.index({ dham: 1, isOperational: 1, distanceFromTemple: 1 });

const DhamCheckpoint = mongoose.model('DhamCheckpoint', dhamCheckpointSchema);

export default DhamCheckpoint;
