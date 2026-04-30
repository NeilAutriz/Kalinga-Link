import mongoose from 'mongoose';

const committeeSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    slotCount: { type: Number, required: true, min: 1 },
    leadUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const Committee = mongoose.model('Committee', committeeSchema);
