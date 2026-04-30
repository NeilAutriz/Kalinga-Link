import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    program: {
      type: String,
      enum: ['feeding', 'health', 'learning', 'environment', 'livelihood', 'youth'],
      default: 'feeding',
      index: true,
    },
    barangay:   { type: String, default: '' },
    sitio:      { type: String, default: '' },
    partnerOrg: { type: String, default: '' },
    location:   { type: String, required: true, trim: true },
    eventDate:  { type: Date, required: true, index: true },
    startTime: { type: String },
    endTime: { type: String },
    targetChildren: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Event = mongoose.model('Event', eventSchema);
