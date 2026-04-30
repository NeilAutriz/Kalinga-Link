import mongoose from 'mongoose';

const measurementSchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChildRecord', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    heightCm: { type: Number, min: 0 },
    weightKg: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['baseline', 'monitored', 'improved', 'no_change', 'declined'],
      default: 'monitored',
    },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recordedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Measurement = mongoose.model('Measurement', measurementSchema);
