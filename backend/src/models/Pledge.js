import mongoose from 'mongoose';

const pledgeSchema = new mongoose.Schema(
  {
    resourceNeedId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceNeed', required: true, index: true },
    donorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    donorName: { type: String, required: true, trim: true },
    donorContact: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['pledged', 'received', 'cancelled'], default: 'pledged' },
    receivedAt: { type: Date },
  },
  { timestamps: true },
);

export const Pledge = mongoose.model('Pledge', pledgeSchema);
