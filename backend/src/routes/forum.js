import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { User } from '../models/User.js';
import { Report } from '../models/Report.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';

const r = Router();

const PROGRAMS = ['feeding', 'health', 'learning', 'environment', 'livelihood', 'youth'];

const createPostSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty').max(2000).trim(),
  type: z.enum(['status', 'photo', 'announcement']).optional(),
  program: z.enum(PROGRAMS).optional().nullable(),
  media: z
    .array(
      z.object({
        // Images: Canvas-compressed JPEG ≤ ~500 KB → base64 ≤ ~667 K chars
        // Videos: up to 7 MB raw → base64 ≤ ~9.3 M chars (keeps MongoDB doc < 11 MB)
        data: z.string().max(10_000_000, 'Media file is too large'),
        mimeType: z.enum([
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm', 'video/quicktime', 'video/3gpp', 'video/x-msvideo',
        ]),
      }),
    )
    .max(4, 'Maximum 4 media items')
    .optional()
    .default([]),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000).trim(),
});

/** Extract the authenticated userId from the JWT cookie/header without hard-failing. */
const getViewerId = (req) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_SECRET).sub;
  } catch {
    return null;
  }
};

// ──────────────────────────────────────────────────────────
// GET /forum/posts
// Cursor-paginated feed.  First page omits `before`.
// Pinned posts always sort to the top within each page.
// ──────────────────────────────────────────────────────────
r.get('/posts', async (req, res, next) => {
  try {
    const limit   = Math.min(Number(req.query.limit) || 10, 30);
    const before  = req.query.before;
    const type    = req.query.type;
    const program = req.query.program;

    const filter = {};
    if (before)  filter.createdAt = { $lt: new Date(before) };
    if (type)    filter.type = type;
    if (program) filter.program = program;

    const raw = await Post.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore    = raw.length > limit;
    const docs       = hasMore ? raw.slice(0, limit) : raw;
    const viewerId   = getViewerId(req);

    const posts = docs.map((p) => ({
      ...p,
      id:      p._id.toString(),
      isLiked: viewerId
        ? p.likes.some((id) => id.toString() === viewerId)
        : false,
    }));

    res.json({
      posts,
      hasMore,
      nextCursor: hasMore ? docs[docs.length - 1].createdAt.toISOString() : null,
    });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────
// POST /forum/posts
// ──────────────────────────────────────────────────────────
r.post('/posts', requireAuth, validate(createPostSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).select('fullName role');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.type === 'announcement' && req.user.role !== 'organizer') {
      return res.status(403).json({ error: 'Only organizers can post announcements' });
    }

    let type = req.body.type || 'status';
    if ((req.body.media?.length ?? 0) > 0 && type === 'status') type = 'photo';

    const post = await Post.create({
      authorId:   req.user.sub,
      authorName: user.fullName,
      authorRole: user.role,
      content:    req.body.content,
      media:      req.body.media ?? [],
      type,
      program:    req.body.program ?? null,
    });

    res.status(201).json({
      post: { ...post.toObject(), id: post._id.toString(), isLiked: false },
    });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /forum/posts/:id   (owner or organizer)
// Cascades to delete all comments for that post.
// ──────────────────────────────────────────────────────────
r.delete('/posts/:id', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'NotFound' });

    const isOwner     = post.authorId.toString() === req.user.sub;
    const isOrganizer = req.user.role === 'organizer';
    if (!isOwner && !isOrganizer) return res.status(403).json({ error: 'Forbidden' });

    await Post.deleteOne({ _id: post._id });
    await Comment.deleteMany({ postId: post._id });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────
// POST /forum/posts/:id/like   (toggle)
// Returns updated likeCount and the caller's new isLiked state.
// ──────────────────────────────────────────────────────────
r.post('/posts/:id/like', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'NotFound' });

    const userId = req.user.sub;
    const idx = post.likes.findIndex((id) => id.toString() === userId);
    if (idx === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(idx, 1);
    }
    post.likeCount = post.likes.length;
    await post.save();

    res.json({ likeCount: post.likeCount, isLiked: idx === -1 });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────
// PATCH /forum/posts/:id/pin   (organizer only — toggles)
// ──────────────────────────────────────────────────────────
r.patch('/posts/:id/pin', requireAuth, requireRole('organizer'), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'NotFound' });
    post.isPinned = !post.isPinned;
    await post.save();
    res.json({ isPinned: post.isPinned });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────
// GET /forum/posts/:id/comments   (public, offset-paginated)
// ──────────────────────────────────────────────────────────
r.get('/posts/:id/comments', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip  = Number(req.query.skip) || 0;

    const [comments, total] = await Promise.all([
      Comment.find({ postId: req.params.id })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ postId: req.params.id }),
    ]);

    res.json({
      comments: comments.map((c) => ({ ...c, id: c._id.toString() })),
      total,
    });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────
// POST /forum/posts/:id/comments
// ──────────────────────────────────────────────────────────
r.post('/posts/:id/comments', requireAuth, validate(createCommentSchema), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'NotFound' });

    const user = await User.findById(req.user.sub).select('fullName role');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const comment = await Comment.create({
      postId:     req.params.id,
      authorId:   req.user.sub,
      authorName: user.fullName,
      authorRole: user.role,
      content:    req.body.content,
    });

    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentCount: 1 } });

    res.status(201).json({ comment: { ...comment.toObject(), id: comment._id.toString() } });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /forum/comments/:id   (owner or organizer)
// ──────────────────────────────────────────────────────────
r.delete('/comments/:id', requireAuth, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'NotFound' });

    const isOwner     = comment.authorId.toString() === req.user.sub;
    const isOrganizer = req.user.role === 'organizer';
    if (!isOwner && !isOrganizer) return res.status(403).json({ error: 'Forbidden' });

    await Comment.deleteOne({ _id: comment._id });
    await Post.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────
// POST /forum/posts/:id/report   (authenticated, non-author)
// One report per user per post — duplicate returns 409.
// ──────────────────────────────────────────────────────────
const REPORT_REASONS = ['spam', 'harassment', 'misinformation', 'inappropriate', 'other'];

const createReportSchema = z.object({
  reason:  z.enum(REPORT_REASONS),
  details: z.string().max(500).trim().optional().default(''),
});

r.post('/posts/:id/report', requireAuth, validate(createReportSchema), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'NotFound' });

    // Post authors cannot report their own posts
    if (post.authorId.toString() === req.user.sub) {
      return res.status(403).json({ error: 'You cannot report your own post' });
    }

    const report = await Report.create({
      postId:     post._id,
      reporterId: req.user.sub,
      reason:     req.body.reason,
      details:    req.body.details ?? '',
    });

    res.status(201).json({ success: true, reportId: report._id.toString() });
  } catch (e) {
    // Duplicate key → user already reported this post
    if (e.code === 11000) {
      return res.status(409).json({ error: 'AlreadyReported' });
    }
    next(e);
  }
});

// ──────────────────────────────────────────────────────────
// GET /forum/reports   (organizer only — paginated list)
// Returns pending reports with post + reporter details.
// ──────────────────────────────────────────────────────────
r.get('/reports', requireAuth, requireRole('organizer'), async (req, res, next) => {
  try {
    const limit  = Math.min(Number(req.query.limit) || 20, 50);
    const skip   = Number(req.query.skip) || 0;
    const status = req.query.status ?? 'pending';

    const [reports, total] = await Promise.all([
      Report.find({ status })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('postId', 'content authorName type createdAt')
        .populate('reporterId', 'fullName role')
        .lean(),
      Report.countDocuments({ status }),
    ]);

    res.json({ reports, total });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────
// PATCH /forum/reports/:id   (organizer only — update status)
// ──────────────────────────────────────────────────────────
r.patch('/reports/:id', requireAuth, requireRole('organizer'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['reviewed', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!report) return res.status(404).json({ error: 'NotFound' });
    res.json({ success: true, status: report.status });
  } catch (e) {
    next(e);
  }
});

export default r;
