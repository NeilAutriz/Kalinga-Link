import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

const anonId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

const childSchema = new mongoose.Schema(
  {
    anonCode: { type: String, unique: true, default: () => anonId() },
    firstName: { type: String, required: true, trim: true },
    age: { type: Number, min: 0, max: 18, required: true },
    sex: { type: String, enum: ['M', 'F', 'X'], required: true },
    guardianName: { type: String, required: true, trim: true },
    guardianContact: { type: String, trim: true },
    consentGiven: { type: Boolean, required: true },
    consentDate: { type: Date },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

childSchema.pre('validate', function (next) {
  if (!this.consentGiven) return next(new Error('Guardian consent is required to save a child record.'));
  if (!this.consentDate) this.consentDate = new Date();
  next();
});

export const ChildRecord = mongoose.model('ChildRecord', childSchema);
