import mongoose from 'mongoose';

const mediaItemSchema = new mongoose.Schema(
  {
    data:     { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  { _id: false },
);

const postSchema = new mongoose.Schema(
  {
    authorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName:   { type: String, required: true, trim: true },
    authorRole:   { type: String, required: true },
    content:      { type: String, required: true, trim: true, maxlength: 2000 },
    media:        {
      type: [mediaItemSchema],
      default: [],
      validate: [(a) => a.length <= 4, 'Maximum 4 images per post'],
    },
    type:         { type: String, enum: ['status', 'photo', 'announcement'], default: 'status' },
    program:      {
      type: String,
      enum: ['feeding', 'health', 'learning', 'environment', 'livelihood', 'youth', null],
      default: null,
    },
    likes:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount:    { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isPinned:     { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Feed index: pinned first, then newest
postSchema.index({ isPinned: -1, createdAt: -1 });

export const Post = mongoose.model('Post', postSchema);
