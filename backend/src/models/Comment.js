import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    postId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true, trim: true },
    authorRole: { type: String, required: true },
    content:    { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

export const Comment = mongoose.model('Comment', commentSchema);
