import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema(
  {
    pilgrimId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    generatedAt: { type: Date, default: Date.now },
    inputParams: { type: mongoose.Schema.Types.Mixed },
    weatherSnapshot: { type: mongoose.Schema.Types.Mixed },
    crowdSnapshot: { type: mongoose.Schema.Types.Mixed },
    result: { type: mongoose.Schema.Types.Mixed },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

const Itinerary =
  mongoose.models.Itinerary || mongoose.model('Itinerary', itinerarySchema);

export default Itinerary;
