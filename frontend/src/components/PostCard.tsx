import { useState, useCallback, useEffect } from 'react';
import {
  Heart, MessageCircle, Pin, Trash2, MoreHorizontal,
  Loader2, Send, X, Megaphone, ChevronDown, ChevronUp,
  Flag, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  likePost, pinPost, deletePost,
  getComments, createComment, deleteComment, reportPost,
} from '../services/api';
import type { ForumPost, ForumComment } from '../lib/types';
import { PROGRAM_LABELS, PROGRAM_TONES } from '../lib/types';

// ── Helpers ───────────────────────────────────────────────

const ROLE_AVATAR: Record<string, string> = {
  organizer: 'bg-phthalo-500 text-milk',
  health:    'bg-maximum-500 text-milk',
  volunteer: 'bg-maximum-200 text-phthalo-700',
  donor:     'bg-bone-200 text-phthalo-600',
};

const ROLE_LABEL: Record<string, string> = {
  organizer: 'Organizer',
  health:    'Health partner',
  volunteer: 'Volunteer',
  donor:     'Donor',
};

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric',
    year: new Date(iso).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

// ── Media grid ────────────────────────────────────────────

function MediaGrid({ media }: { media: ForumPost['media'] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (media.length === 0) return null;

  const isVideo = (m: ForumPost['media'][number]) => m.mimeType.startsWith('video/');

  const open  = (i: number) => setLightbox(i);
  const close = () => setLightbox(null);
  const prev  = () => setLightbox((i) => (i !== null ? (i - 1 + media.length) % media.length : null));
  const next  = () => setLightbox((i) => (i !== null ? (i + 1) % media.length : null));

  const imgClass = 'w-full h-full object-cover cursor-zoom-in hover:brightness-90 transition duration-150';

  // Render a single media slot — video or image
  const Slot = ({ m, i, className = '' }: { m: ForumPost['media'][number]; i: number; className?: string }) => (
    isVideo(m) ? (
      <div className={`relative ${className}`}>
        <video
          src={m.data}
          className="w-full h-full object-cover"
          preload="metadata"
          onClick={() => open(i)}
          style={{ cursor: 'pointer' }}
        />
        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <span className="h-12 w-12 rounded-full bg-black/50 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white fill-white ml-1" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>
    ) : (
      <div className={className}>
        <img src={m.data} alt={`Media ${i + 1}`} className={imgClass} onClick={() => open(i)} />
      </div>
    )
  );

  return (
    <>
      {/* ── 1 item: full width (video or photo) ── */}
      {media.length === 1 && (
        <div className="mb-3 rounded-xl overflow-hidden bg-black w-full" style={{ maxHeight: '420px' }}>
          {isVideo(media[0]) ? (
            <video
              src={media[0].data}
              controls
              className="w-full max-h-[420px] object-contain"
              preload="metadata"
            />
          ) : (
            <img
              src={media[0].data}
              alt="Post photo"
              className={imgClass}
              style={{ maxHeight: '420px', width: '100%' }}
              onClick={() => open(0)}
            />
          )}
        </div>
      )}

      {/* ── 2 items: side by side ── */}
      {media.length === 2 && (
        <div className="mb-3 flex gap-0.5 rounded-xl overflow-hidden" style={{ height: '280px' }}>
          {media.map((m, i) => (
            <Slot key={i} m={m} i={i} className="flex-1 bg-bone-100 overflow-hidden" />
          ))}
        </div>
      )}

      {/* ── 3 items: left tall, right two stacked ── */}
      {media.length === 3 && (
        <div className="mb-3 flex gap-0.5 rounded-xl overflow-hidden" style={{ height: '320px' }}>
          <Slot m={media[0]} i={0} className="w-[55%] bg-bone-100 overflow-hidden" />
          <div className="flex flex-col gap-0.5 flex-1">
            {media.slice(1).map((m, i) => (
              <Slot key={i} m={m} i={i + 1} className="flex-1 bg-bone-100 overflow-hidden" />
            ))}
          </div>
        </div>
      )}

      {/* ── 4 items: 2 × 2 grid ── */}
      {media.length === 4 && (
        <div className="mb-3 grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden" style={{ height: '320px' }}>
          {media.map((m, i) => (
            <Slot key={i} m={m} i={i} className="bg-bone-100 overflow-hidden" />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/95 flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
            onClick={close}
          >
            <X size={18} />
          </button>

          {/* Nav arrows */}
          {media.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <ChevronDown size={18} className="rotate-90" />
              </button>
              <button
                className="absolute right-16 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <ChevronUp size={18} className="rotate-90" />
              </button>
            </>
          )}

          {/* Media content */}
          {isVideo(media[lightbox]) ? (
            <video
              src={media[lightbox].data}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={media[lightbox].data}
              alt={`Image ${lightbox + 1} of ${media.length}`}
              className="max-w-full max-h-[90vh] rounded-xl shadow-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Counter */}
          {media.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
              {lightbox + 1} / {media.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}

// ── Comment item ──────────────────────────────────────────

function CommentItem({
  comment,
  currentUserId,
  currentRole,
  onDeleted,
}: {
  comment: ForumComment;
  currentUserId?: string;
  currentRole?: string;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const canDelete = currentUserId === comment.authorId || currentRole === 'organizer';

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    setDeleting(true);
    try {
      await deleteComment(comment.id);
      onDeleted(comment.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`flex gap-2.5 group transition-opacity ${deleting ? 'opacity-40 pointer-events-none' : ''}`}>
      <div
        className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold mt-0.5 select-none ${ROLE_AVATAR[comment.authorRole] ?? 'bg-bone-200 text-phthalo-500'}`}
      >
        {initials(comment.authorName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-bone-50 rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
          <span className="font-semibold text-xs text-phthalo-500 mr-1.5">{comment.authorName}</span>
          <span className="text-sm text-ink-700 break-words">{comment.content}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 pl-2">
          <time className="text-[10px] text-ink-400" dateTime={comment.createdAt}>
            {timeAgo(comment.createdAt)}
          </time>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[10px] text-ink-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Comments section ──────────────────────────────────────

function CommentsSection({
  postId,
  commentCount,
  onCountChange,
}: {
  postId: string;
  commentCount: number;
  onCountChange: (delta: number) => void;
}) {
  const { user } = useAuth();

  const [comments,   setComments]   = useState<ForumComment[]>([]);
  const [total,      setTotal]      = useState(commentCount);
  const [loading,    setLoading]    = useState(false);
  const [loaded,     setLoaded]     = useState(false);
  const [newText,    setNewText]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState<string | null>(null);

  const load = useCallback(async (skip = 0) => {
    setLoading(true);
    try {
      const res = await getComments(postId, skip, 20);
      setComments((prev) => skip === 0 ? res.comments : [...prev, ...res.comments]);
      setTotal(res.total);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Auto-load when section first mounts (user clicked "Comment")
  useEffect(() => {
    load(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const res = await createComment(postId, newText.trim());
      setComments((prev) => [...prev, res.comment]);
      setTotal((t) => t + 1);
      onCountChange(1);
      setNewText('');
    } catch {
      setSubmitErr('Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleted = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    setTotal((t) => Math.max(0, t - 1));
    onCountChange(-1);
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Spinner while loading */}
      {loading && !loaded && (
        <div className="flex items-center gap-2 text-xs text-ink-400 py-1">
          <Loader2 size={12} className="animate-spin" />
          Loading comments…
        </div>
      )}

      {/* Rendered comments */}
      {loaded && comments.length === 0 && !loading && (
        <p className="text-xs text-ink-400 italic py-1">No comments yet — be the first!</p>
      )}

      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          currentUserId={user?.id ?? user?._id}
          currentRole={user?.role}
          onDeleted={handleDeleted}
        />
      ))}

      {/* Load more */}
      {loaded && comments.length < total && (
        <button
          onClick={() => load(comments.length)}
          disabled={loading}
          className="text-xs font-medium text-phthalo-500 hover:underline flex items-center gap-1 disabled:opacity-60"
        >
          {loading && <Loader2 size={11} className="animate-spin" />}
          {loading ? 'Loading…' : `View ${total - comments.length} more comment${total - comments.length !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* Add comment */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
          <div
            className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold select-none ${ROLE_AVATAR[user.role] ?? 'bg-bone-200 text-phthalo-500'}`}
          >
            {initials(user.fullName)}
          </div>
          <div className="flex-1 flex items-center gap-1.5 bg-bone-50 rounded-full px-3 py-1.5 border border-bone-200 focus-within:border-maximum-400 transition">
            <input
              type="text"
              placeholder="Write a comment…"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400 min-w-0"
              disabled={submitting}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!newText.trim() || submitting}
              className="text-maximum-600 disabled:opacity-30 hover:text-maximum-700 transition shrink-0"
            >
              {submitting
                ? <Loader2 size={14} className="animate-spin" />
                : <Send size={14} />}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-ink-400 italic pt-1">
          <a href="/login" className="text-phthalo-500 hover:underline font-medium">Sign in</a>
          {' '}to join the conversation
        </p>
      )}

      {submitErr && (
        <p className="text-xs text-red-500 pl-9">{submitErr}</p>
      )}
    </div>
  );
}

// ── PostContent with "see more" ───────────────────────────

function PostContent({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 280;

  const isLong = content.length > LIMIT;

  return (
    <p className="text-sm text-ink-700 whitespace-pre-wrap mb-3 leading-relaxed break-words">
      {(!isLong || expanded) ? content : `${content.slice(0, LIMIT)}…`}
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-1.5 text-phthalo-500 text-xs font-medium hover:underline"
        >
          {expanded ? 'see less' : 'see more'}
        </button>
      )}
    </p>
  );
}

// ── ReportModal ───────────────────────────────────────────

const REPORT_REASONS: { value: string; label: string; description: string }[] = [
  { value: 'spam',           label: 'Spam',                 description: 'Repetitive, irrelevant, or advertising content' },
  { value: 'harassment',     label: 'Harassment',           description: 'Bullying, threats, or targeting a person' },
  { value: 'misinformation', label: 'Misinformation',       description: 'False or misleading information' },
  { value: 'inappropriate',  label: 'Inappropriate content',description: 'Offensive, graphic, or adult content' },
  { value: 'other',          label: 'Other',                description: 'Something else not listed above' },
];

function ReportModal({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [reason,      setReason]      = useState('');
  const [details,     setDetails]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      await reportPost(postId, reason, details.trim() || undefined);
      setSubmitted(true);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number; data?: { error?: string } } })?.response?.status;
      if (status === 409) {
        setError('You have already reported this post.');
      } else {
        setError('Failed to submit report. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="w-full sm:max-w-md bg-milk rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-0">
          <div className="w-9 h-1 rounded-full bg-bone-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bone-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <Flag size={15} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-ink-900">Report Post</h2>
              <p className="text-[11px] text-ink-500">Help us keep the community safe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full hover:bg-bone-100 flex items-center justify-center transition text-ink-400 hover:text-ink-700"
          >
            <X size={15} />
          </button>
        </div>

        {submitted ? (
          /* ── Success state ── */
          <div className="px-5 py-8 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={26} className="text-emerald-500" />
            </div>
            <h3 className="font-semibold text-ink-900 mb-1.5">Report Submitted</h3>
            <p className="text-sm text-ink-500 leading-relaxed max-w-xs mx-auto">
              Thank you for keeping our community safe. We'll review this post
              and take appropriate action.
            </p>
            <button
              onClick={onClose}
              className="mt-5 btn btn-primary btn-sm px-6"
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <div className="px-5 py-4 space-y-4">
            {/* Reason selector */}
            <div>
              <p className="text-xs font-semibold text-ink-700 mb-2">
                Why are you reporting this post?
              </p>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition text-sm ${
                      reason === r.value
                        ? 'border-phthalo-400 bg-phthalo-50 ring-1 ring-phthalo-300'
                        : 'border-bone-200 hover:border-bone-300 hover:bg-bone-50'
                    }`}
                  >
                    <span className="font-medium text-ink-900">{r.label}</span>
                    <span className="text-[11px] text-ink-500 block leading-tight mt-0.5">
                      {r.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional details */}
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1.5">
                Additional details <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <textarea
                rows={2}
                maxLength={500}
                placeholder="Provide any extra context that might help us review this report…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full resize-none rounded-xl border border-bone-200 bg-bone-50 focus:bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phthalo-300 focus:border-phthalo-300 transition placeholder:text-ink-400"
              />
              <p className="text-right text-[10px] text-ink-400 mt-0.5">{details.length}/500</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-ghost btn-sm"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="flex-1 btn btn-sm bg-red-500 hover:bg-red-600 text-white gap-1.5 disabled:opacity-40"
              >
                {submitting
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Flag size={13} />
                }
                Submit Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PostCard ──────────────────────────────────────────────

type Props = {
  post: ForumPost;
  onDeleted:            (id: string) => void;
  onLikeToggled:        (id: string, likeCount: number, isLiked: boolean) => void;
  onCommentCountChange: (id: string, delta: number) => void;
  onPinToggled:         (id: string, isPinned: boolean) => void;
};

export function PostCard({ post, onDeleted, onLikeToggled, onCommentCountChange, onPinToggled }: Props) {
  const { user } = useAuth();

  const [showComments, setShowComments] = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [liking,       setLiking]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  const isOwner    = user && (user.id === post.authorId || user._id === post.authorId);
  const canDelete  = isOwner || user?.role === 'organizer';
  const canPin     = user?.role === 'organizer';
  const canReport  = !!user && !isOwner;

  const handleLike = async () => {
    if (!user || liking) return;
    setLiking(true);
    try {
      const res = await likePost(post.id);
      onLikeToggled(post.id, res.likeCount, res.isLiked);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post and all its comments?')) return;
    setMenuOpen(false);
    setDeleting(true);
    try {
      await deletePost(post.id);
      onDeleted(post.id);
    } catch {
      setDeleting(false);
    }
  };

  const handlePin = async () => {
    setMenuOpen(false);
    try {
      const res = await pinPost(post.id);
      onPinToggled(post.id, res.isPinned);
    } catch { /* silent */ }
  };

  const isAnnouncement = post.type === 'announcement';

  return (
    <article
      className={`mb-4 rounded-2xl bg-milk border shadow-soft overflow-hidden transition-opacity ${
        deleting ? 'opacity-40 pointer-events-none' : ''
      } ${
        post.isPinned
          ? 'border-maximum-300'
          : isAnnouncement
          ? 'border-maximum-200'
          : 'border-bone-200'
      }`}
    >
      {/* Announcement banner */}
      {isAnnouncement && (
        <div className="bg-maximum-50 border-b border-maximum-200 px-4 py-2 flex items-center gap-2">
          <Megaphone size={13} className="text-maximum-600 shrink-0" />
          <span className="text-xs font-semibold text-maximum-700 uppercase tracking-wide">
            Community Announcement
          </span>
        </div>
      )}

      {/* Pinned banner (only if not announcement) */}
      {post.isPinned && !isAnnouncement && (
        <div className="bg-phthalo-50 border-b border-phthalo-100 px-4 py-1.5 flex items-center gap-1.5">
          <Pin size={11} className="text-phthalo-400 shrink-0" />
          <span className="text-[10px] font-semibold text-phthalo-400 uppercase tracking-wide">
            Pinned post
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Author row */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`h-10 w-10 rounded-full shrink-0 flex items-center justify-center font-semibold text-sm select-none ${ROLE_AVATAR[post.authorRole] ?? 'bg-bone-200 text-phthalo-500'}`}
          >
            {initials(post.authorName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-phthalo-500 text-sm leading-tight">{post.authorName}</span>
              <span className="badge badge-bone text-[10px]">
                {ROLE_LABEL[post.authorRole] ?? post.authorRole}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <time className="text-[11px] text-ink-400" dateTime={post.createdAt}>
                {timeAgo(post.createdAt)}
              </time>
              {post.program && (
                <span className={`badge text-[10px] ${PROGRAM_TONES[post.program]}`}>
                  {PROGRAM_LABELS[post.program]}
                </span>
              )}
            </div>
          </div>

          {/* Options menu — visible to any authenticated user with an action */}
          {(canDelete || canPin || canReport) && (
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="btn btn-ghost btn-sm p-1 text-ink-400 hover:text-phthalo-500 rounded-lg"
                aria-label="Post options"
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-9 z-20 bg-milk border border-bone-200 rounded-xl shadow-soft w-48 py-1 overflow-hidden">
                    {canPin && (
                      <button
                        onClick={handlePin}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-bone-50 flex items-center gap-2.5 text-phthalo-500"
                      >
                        <Pin size={14} />
                        {post.isPinned ? 'Unpin post' : 'Pin to top'}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 flex items-center gap-2.5 text-red-600"
                      >
                        <Trash2 size={14} />
                        Delete post
                      </button>
                    )}
                    {/* Divider between destructive owner actions and report */}
                    {(canDelete || canPin) && canReport && (
                      <div className="mx-2 my-1 border-t border-bone-100" />
                    )}
                    {canReport && (
                      <button
                        onClick={() => { setMenuOpen(false); setShowReport(true); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 flex items-center gap-2.5 text-ink-600 hover:text-red-600"
                      >
                        <Flag size={14} />
                        Report post
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Post content */}
        <PostContent content={post.content} />

        {/* Media grid */}
        <MediaGrid media={post.media} />

        {/* Stats row (likes + comment count) */}
        {(post.likeCount > 0 || post.commentCount > 0) && (
          <div className="flex items-center justify-between text-xs text-ink-400 pb-2.5 border-b border-bone-100">
            {post.likeCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-flex h-[18px] w-[18px] rounded-full bg-red-50 border border-red-100 items-center justify-center">
                  <Heart size={9} className="text-red-500 fill-red-500" />
                </span>
                <span>{post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}</span>
              </span>
            )}
            {post.commentCount > 0 && (
              <button
                onClick={() => setShowComments((v) => !v)}
                className="hover:underline ml-auto text-xs"
              >
                {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center pt-1">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={!user || liking}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition select-none ${
              post.isLiked
                ? 'text-red-500'
                : 'text-ink-500 hover:bg-bone-50 hover:text-red-400'
            } disabled:opacity-50`}
          >
            <Heart
              size={16}
              className={`transition-all duration-150 ${
                post.isLiked ? 'fill-red-500 scale-110' : ''
              } ${liking ? 'animate-pulse' : ''}`}
            />
            <span className="hidden sm:inline text-xs">
              {post.isLiked ? 'Liked' : 'Like'}
            </span>
            {post.likeCount > 0 && (
              <span className="text-xs opacity-70 sm:hidden">{post.likeCount}</span>
            )}
          </button>

          <div className="w-px h-6 bg-bone-100 mx-1" />

          {/* Comment */}
          <button
            onClick={() => setShowComments((v) => !v)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition select-none ${
              showComments
                ? 'text-phthalo-500 bg-phthalo-50'
                : 'text-ink-500 hover:bg-bone-50 hover:text-phthalo-400'
            }`}
          >
            <MessageCircle size={16} className={showComments ? 'fill-phthalo-100' : ''} />
            <span className="hidden sm:inline text-xs">
              {showComments ? 'Hide' : 'Comment'}
            </span>
            {post.commentCount > 0 && (
              <span className="text-xs opacity-70 sm:hidden">{post.commentCount}</span>
            )}
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="border-t border-bone-100 pt-3 mt-1">
            <CommentsSection
              postId={post.id}
              commentCount={post.commentCount}
              onCountChange={(delta) => onCommentCountChange(post.id, delta)}
            />
          </div>
        )}
      </div>

      {/* Report modal — rendered inside article so it's scoped to this post */}
      {showReport && (
        <ReportModal
          postId={post.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </article>
  );
}
