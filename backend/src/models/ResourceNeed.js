import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    itemName: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['food', 'utensils', 'art', 'hygiene', 'equipment', 'transport', 'other'],
      default: 'other',
    },
    quantityNeeded: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'pcs' },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

export const ResourceNeed = mongoose.model('ResourceNeed', resourceSchema);
