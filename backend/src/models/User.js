import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    contactNumber: { type: String, trim: true },
    affiliation: { type: String, trim: true },
    role: {
      type: String,
      enum: ['organizer', 'health', 'volunteer', 'donor'],
      default: 'volunteer',
      index: true,
    },
    emailVerifiedAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model('User', userSchema);
