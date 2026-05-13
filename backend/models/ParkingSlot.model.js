import mongoose from 'mongoose';

const slotTypeSchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0, min: 0 },
    available: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const parkingSlotAreaSchema = new mongoose.Schema(
  {
    dham: {
      type: String,
      required: true,
      lowercase: true,
      enum: ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'],
    },
    locationName: { type: String, required: true, trim: true },
    checkpointName: { type: String, trim: true, default: '' },
    distanceFromTemple: { type: Number, default: 0, min: 0 },
    slotTypes: {
      bike: { type: slotTypeSchema, default: () => ({}) },
      car: { type: slotTypeSchema, default: () => ({}) },
      suv: { type: slotTypeSchema, default: () => ({}) },
      bus: { type: slotTypeSchema, default: () => ({}) },
    },
    pricePerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    /** Optional per-vehicle pricing overrides */
    priceByVehicle: {
      bike: Number,
      car: Number,
      suv: Number,
      bus: Number,
    },
    facilities: [{ type: String }],
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    openingTime: { type: String, default: '05:00' },
    closingTime: { type: String, default: '21:00' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

parkingSlotAreaSchema.index({ dham: 1, isActive: 1, distanceFromTemple: 1 });

const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotAreaSchema);

export default ParkingSlot;
