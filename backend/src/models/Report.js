import mongoose from 'mongoose';

const REASONS = ['spam', 'harassment', 'misinformation', 'inappropriate', 'other'];

const reportSchema = new mongoose.Schema(
  {
    postId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Post',  required: true, index: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
    reason:     { type: String, enum: REASONS, required: true },
    details:    { type: String, trim: true, maxlength: 500, default: '' },
    status:     { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending' },
  },
  { timestamps: true },
);

// One report per user per post
reportSchema.index({ postId: 1, reporterId: 1 }, { unique: true });

export const Report = mongoose.model('Report', reportSchema);
