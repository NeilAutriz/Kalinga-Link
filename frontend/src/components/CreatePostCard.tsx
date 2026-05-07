import { useRef, useState, useCallback } from 'react';
import {
  Image, X, Send, Loader2, Megaphone, AlignLeft, AlertCircle, Video,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createPost } from '../services/api';
import type { ForumPost, Program } from '../lib/types';
import { PROGRAM_LABELS } from '../lib/types';

type Props = {
  onPostCreated: (post: ForumPost) => void;
  /** Start in expanded compose mode and never collapse (used inside a modal). */
  alwaysExpanded?: boolean;
  /** Called when the user cancels or after a successful post (for modal close). */
  onDismiss?: () => void;
};

const ROLE_AVATAR: Record<string, string> = {
  organizer: 'bg-phthalo-500 text-milk',
  health:    'bg-maximum-500 text-milk',
  volunteer: 'bg-maximum-200 text-phthalo-700',
  donor:     'bg-bone-200 text-phthalo-600',
};

// Images: accept up to 20 MB raw; compress client-side via Canvas before upload
const MAX_RAW_BYTES  = 20 * 1024 * 1024; // 20 MB
const MAX_OUT_PX     = 1200;              // longest edge after compression
const JPEG_QUALITY   = 0.82;             // ~200–500 KB per typical phone photo
// Videos: stored as base64 in MongoDB — 7 MB raw → ~9.3 MB base64 keeps the
// document under MongoDB's 16 MB limit. Suggest trimming above 3 MB.
const MAX_VIDEO_BYTES  =  7 * 1024 * 1024; // 7 MB
const WARN_VIDEO_BYTES =  3 * 1024 * 1024; // 3 MB — suggest trimming above this
const MAX_CHARS = 2000;

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

/** Resize + JPEG-compress an image using the Canvas API → data-URL. */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, MAX_OUT_PX / Math.max(img.width, img.height));
      const w = Math.round(img.width  * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
}

/** Read a video file as a base64 data-URL. */
function readVideoAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read video'));
    reader.readAsDataURL(file);
  });
}

type MediaPreview = { data: string; mimeType: string };

export function CreatePostCard({ onPostCreated, alwaysExpanded = false, onDismiss }: Props) {
  const { user } = useAuth();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [expanded,    setExpanded]    = useState(alwaysExpanded);
  const [content,     setContent]     = useState('');
  const [media,       setMedia]       = useState<MediaPreview[]>([]);
  const [program,     setProgram]     = useState<Program | ''>('');
  const [type,        setType]        = useState<'status' | 'photo' | 'announcement'>('status');
  const [posting,     setPosting]     = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  if (!user) return null;

  // Whether current media is a video post (mutually exclusive with photos)
  const hasVideo  = media.length > 0 && media[0].mimeType.startsWith('video/');
  const hasPhotos = media.length > 0 && !hasVideo;

  const openPhotoPicker = () => photoRef.current?.click();
  const openVideoPicker = () => videoRef.current?.click();

  // ── Photo handler ──────────────────────────────────────────
  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    setError(null);

    if (hasVideo) {
      setError('Remove the video first before adding photos.');
      return;
    }

    const remaining = 4 - media.length;
    if (files.length === 0) return;
    if (remaining <= 0) { setError('You can attach up to 4 photos per post.'); return; }

    const toProcess = files.slice(0, remaining);
    if (files.length > remaining) {
      setError(`Only the first ${remaining} photo${remaining > 1 ? 's were' : ' was'} added — maximum 4 per post.`);
    }

    setCompressing(true);
    setExpanded(true);
    const added: MediaPreview[] = [];

    for (const file of toProcess) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_RAW_BYTES) {
        setError(`"${file.name}" exceeds 20 MB — please choose a smaller file.`);
        continue;
      }
      try {
        const data = await compressImage(file);
        added.push({ data, mimeType: 'image/jpeg' });
      } catch {
        setError(`Could not process "${file.name}" — please try a different image.`);
      }
    }

    setCompressing(false);
    if (added.length > 0) setMedia((prev) => [...prev, ...added].slice(0, 4));
  }, [media.length, hasVideo]);

  // ── Video handler ──────────────────────────────────────────
  const handleVideoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setError(null);

    if (!file) return;
    if (hasPhotos) {
      setError('Remove the photos first before adding a video.');
      return;
    }
    if (!file.type.startsWith('video/')) {
      setError('Only video files are supported here.');
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError(`"${file.name}" is too large — videos must be under 7 MB. Trim your clip to roughly 5–10 seconds and try again.`);
      return;
    }

    if (file.size > WARN_VIDEO_BYTES) {
      setError(`Heads up: this video is large and may take a moment to upload. Trimming to under 3 MB will be faster.`);
      // non-blocking — continue with the upload
    }

    setCompressing(true);
    setExpanded(true);
    try {
      const data = await readVideoAsDataURL(file);
      setMedia([{ data, mimeType: file.type }]);
    } catch {
      setError(`Could not read "${file.name}" — please try a different video.`);
    } finally {
      setCompressing(false);
    }
  }, [hasPhotos]);

  const removeImage = (idx: number) =>
    setMedia((prev) => prev.filter((_, i) => i !== idx));

  const clearMedia = () => setMedia([]);

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) return;
    setPosting(true);
    setError(null);
    try {
      const resolvedType = media.length > 0 && type === 'status' ? 'photo' : type;
      const res = await createPost({
        content: content.trim(),
        type:    resolvedType,
        program: program || null,
        media:   media.map(({ data, mimeType }) => ({ data, mimeType })),
      });
      onPostCreated(res.post as ForumPost);
      setContent('');
      setMedia([]);
      setProgram('');
      setType('status');
      if (!alwaysExpanded) setExpanded(false);
      setError(null);
      onDismiss?.();
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to post — please try again.',
      );
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = (content.trim().length > 0 || media.length > 0) && !posting && !compressing && content.length <= MAX_CHARS;
  const charsLeft = MAX_CHARS - content.length;
  const charWarn  = charsLeft < 100;

  return (
    <div className="card-tight mb-4">
      {/* Hidden file inputs — always in DOM */}
      <input
        ref={photoRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={handlePhotoChange}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/3gpp,video/*"
        className="hidden"
        onChange={handleVideoChange}
      />

      {/* Author row — always show avatar + name; collapsed prompt only when not always-expanded */}
      {!alwaysExpanded && (
        <div className="flex items-center gap-3 mb-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 select-none ${ROLE_AVATAR[user.role] ?? 'bg-bone-200 text-phthalo-500'}`}>
            {initials(user.fullName)}
          </div>
          {!expanded ? (
            <button
              className="flex-1 text-left input text-ink-400 cursor-text"
              onClick={() => setExpanded(true)}
            >
              What's on your mind, {user.fullName.split(' ')[0]}?
            </button>
          ) : (
            <span className="text-sm font-medium text-phthalo-500 truncate">{user.fullName}</span>
          )}
        </div>
      )}

      {/* Expanded compose area */}
      {expanded && (
        <>
          {/* Textarea with char counter */}
          <div className="relative mb-3">
            <textarea
              className="textarea resize-none pr-14"
              placeholder="Share an update, photo, video, or announcement…"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <span className={`absolute bottom-2 right-3 text-[10px] tabular-nums pointer-events-none transition-colors ${charWarn ? (charsLeft < 0 ? 'text-red-500 font-semibold' : 'text-amber-500') : 'text-ink-300'}`}>
              {charsLeft}
            </span>
          </div>

          {/* Processing spinner */}
          {compressing && (
            <div className="flex items-center gap-2 text-xs text-ink-500 mb-3 bg-bone-50 rounded-xl px-3 py-2">
              <Loader2 size={13} className="animate-spin shrink-0" />
              {hasVideo || (media.length === 0)
                ? 'Loading video…'
                : `Compressing photo${media.length + 1 > 1 ? 's' : ''}…`}
            </div>
          )}

          {/* Media previews */}
          {media.length > 0 && !compressing && (
            <div className="mb-3 rounded-xl overflow-hidden">
              {hasVideo ? (
                <VideoPreview src={media[0].data} onRemove={clearMedia} />
              ) : (
                <ImagePreviewGrid media={media} onRemove={removeImage} />
              )}
            </div>
          )}

          {/* Options row */}
          <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-bone-100">
            {/* Photo button — disabled if video present */}
            <button
              type="button"
              onClick={openPhotoPicker}
              disabled={hasVideo || media.length >= 4 || compressing}
              className="btn btn-outline btn-sm gap-1.5 disabled:opacity-40"
              title={hasVideo ? 'Remove the video first to add photos' : undefined}
            >
              <Image size={14} />
              {compressing && !hasVideo
                ? 'Processing…'
                : hasPhotos
                ? `${media.length}/4 photos`
                : 'Photos'}
            </button>

            {/* Video button — disabled if photos present */}
            <button
              type="button"
              onClick={openVideoPicker}
              disabled={hasPhotos || hasVideo || compressing}
              className="btn btn-outline btn-sm gap-1.5 disabled:opacity-40"
              title={hasPhotos ? 'Remove photos first to add a video' : hasVideo ? 'One video per post' : undefined}
            >
              <Video size={14} />
              {compressing && hasVideo ? 'Loading…' : hasVideo ? '1 video' : 'Video'}
            </button>

            <select
              className="select text-xs"
              style={{ height: 'auto', paddingTop: '0.375rem', paddingBottom: '0.375rem' }}
              value={program}
              onChange={(e) => setProgram(e.target.value as Program | '')}
            >
              <option value="">Tag program…</option>
              {(Object.entries(PROGRAM_LABELS) as [Program, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            {user.role === 'organizer' && (
              <div className="flex items-center rounded-xl border border-bone-300 overflow-hidden text-xs">
                {(['status', 'announcement'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 transition ${
                      type === t
                        ? t === 'announcement' ? 'bg-maximum-500 text-milk' : 'bg-phthalo-500 text-milk'
                        : 'bg-milk text-ink-500 hover:bg-bone-50'
                    }`}
                  >
                    {t === 'announcement' ? <Megaphone size={11} /> : <AlignLeft size={11} />}
                    {t === 'announcement' ? 'Announce' : 'Status'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-ink-400">Ctrl+Enter to post</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (!alwaysExpanded) setExpanded(false);
                  setError(null);
                  setContent('');
                  setMedia([]);
                  onDismiss?.();
                }}
                disabled={posting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm gap-1.5"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Post
              </button>
            </div>
          </div>
        </>
      )}

      {/* Collapsed quick-action bar — only when NOT always-expanded */}
      {!alwaysExpanded && !expanded && (
        <div className="flex items-center gap-1 pt-2 border-t border-bone-100">
          <button
            type="button"
            onClick={() => { setExpanded(true); setTimeout(openPhotoPicker, 60); }}
            className="flex-1 btn btn-ghost btn-sm justify-center gap-1.5 text-ink-500 hover:text-phthalo-500"
          >
            <Image size={15} />
            <span className="hidden sm:inline">Photo</span>
          </button>
          <div className="w-px h-5 bg-bone-200" />
          <button
            type="button"
            onClick={() => { setExpanded(true); setTimeout(openVideoPicker, 60); }}
            className="flex-1 btn btn-ghost btn-sm justify-center gap-1.5 text-ink-500 hover:text-phthalo-500"
          >
            <Video size={15} />
            <span className="hidden sm:inline">Video</span>
          </button>
          <div className="w-px h-5 bg-bone-200" />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex-1 btn btn-ghost btn-sm justify-center gap-1.5 text-ink-500 hover:text-phthalo-500"
          >
            <AlignLeft size={15} />
            <span className="hidden sm:inline">Status</span>
          </button>
          {user.role === 'organizer' && (
            <>
              <div className="w-px h-5 bg-bone-200" />
              <button
                type="button"
                onClick={() => { setType('announcement'); setExpanded(true); }}
                className="flex-1 btn btn-ghost btn-sm justify-center gap-1.5 text-ink-500 hover:text-maximum-600"
              >
                <Megaphone size={15} />
                <span className="hidden sm:inline">Announce</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Video preview in compose ───────────────────────────────

function VideoPreview({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-black">
      <video
        src={src}
        controls
        className="w-full max-h-[320px] object-contain"
        preload="metadata"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-ink-900/65 text-white flex items-center justify-center hover:bg-ink-900/85 transition z-10"
        aria-label="Remove video"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ── Photo preview grid inside compose ─────────────────────

function ImagePreviewGrid({
  media,
  onRemove,
}: {
  media: MediaPreview[];
  onRemove: (i: number) => void;
}) {
  const RemoveBtn = ({ i }: { i: number }) => (
    <button
      type="button"
      onClick={() => onRemove(i)}
      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-ink-900/65 text-white flex items-center justify-center hover:bg-ink-900/85 transition z-10"
      aria-label="Remove image"
    >
      <X size={11} />
    </button>
  );

  if (media.length === 1) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-bone-100" style={{ aspectRatio: '16/9' }}>
        <img src={media[0].data} alt="Preview" className="w-full h-full object-cover" />
        <RemoveBtn i={0} />
      </div>
    );
  }

  if (media.length === 2) {
    return (
      <div className="flex gap-0.5 rounded-xl overflow-hidden" style={{ height: '220px' }}>
        {media.map((m, i) => (
          <div key={i} className="relative flex-1 bg-bone-100">
            <img src={m.data} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
            <RemoveBtn i={i} />
          </div>
        ))}
      </div>
    );
  }

  if (media.length === 3) {
    return (
      <div className="flex gap-0.5 rounded-xl overflow-hidden" style={{ height: '250px' }}>
        <div className="relative w-1/2 bg-bone-100">
          <img src={media[0].data} alt="Preview 1" className="w-full h-full object-cover" />
          <RemoveBtn i={0} />
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          {media.slice(1).map((m, i) => (
            <div key={i} className="relative flex-1 bg-bone-100">
              <img src={m.data} alt={`Preview ${i + 2}`} className="w-full h-full object-cover" />
              <RemoveBtn i={i + 1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4 photos
  return (
    <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden" style={{ height: '280px' }}>
      {media.map((m, i) => (
        <div key={i} className="relative bg-bone-100">
          <img src={m.data} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
          <RemoveBtn i={i} />
        </div>
      ))}
    </div>
  );
}
