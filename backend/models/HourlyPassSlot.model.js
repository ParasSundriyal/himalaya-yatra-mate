import mongoose from 'mongoose';

const hourlyPassSlotSchema = new mongoose.Schema({
  checkpoint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checkpoint',
    required: true
  },
  // Date in IST (YYYY-MM-DD format)
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  // Hour in 24-hour format (0-23)
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  // Capacity for this specific slot (admin controlled)
  capacity: {
    type: Number,
    required: true,
    min: 0,
    default: 50
  },
  // Price for this slot (can override checkpoint default)
  price: {
    type: Number,
    default: null, // null means use checkpoint default
    min: 0
  },
  // Whether this slot is active/available
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness per checkpoint/date/hour
hourlyPassSlotSchema.index({ checkpoint: 1, date: 1, hour: 1 }, { unique: true });
hourlyPassSlotSchema.index({ checkpoint: 1, date: 1 });
hourlyPassSlotSchema.index({ date: 1, hour: 1 });

const HourlyPassSlot = mongoose.model('HourlyPassSlot', hourlyPassSlotSchema);

export default HourlyPassSlot;

