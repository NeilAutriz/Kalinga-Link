import mongoose from 'mongoose';

const signupSchema = new mongoose.Schema(
  {
    committeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['signed_up', 'cancelled', 'attended', 'no_show'],
      default: 'signed_up',
    },
    signedUpAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
  },
  { timestamps: true },
);

signupSchema.index({ committeeId: 1, userId: 1 }, { unique: true });

export const VolunteerSignup = mongoose.model('VolunteerSignup', signupSchema);
