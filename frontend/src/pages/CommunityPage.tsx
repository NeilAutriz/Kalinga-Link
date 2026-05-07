import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, MessageSquare, RefreshCw, Users,
  CalendarDays, HeartHandshake, LayoutGrid,
  Megaphone, Image as ImageIcon, AlignLeft,
  BookOpen, X, ChevronDown, Plus,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PostCard } from '../components/PostCard';
import { CreatePostCard } from '../components/CreatePostCard';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { ForumPost, PostType, Program } from '../lib/types';
import { PROGRAM_LABELS, PROGRAM_TONES } from '../lib/types';

// ── Constants ─────────────────────────────────────────────

type FeedFilter = 'all' | PostType;

const TYPE_TABS: { value: FeedFilter; label: string; icon: ReactNode }[] = [
  { value: 'all',          label: 'All',           icon: <LayoutGrid size={14} /> },
  { value: 'status',       label: 'Updates',       icon: <AlignLeft  size={14} /> },
  { value: 'photo',        label: 'Photos',        icon: <ImageIcon  size={14} /> },
  { value: 'announcement', label: 'Announcements', icon: <Megaphone  size={14} /> },
];

const PROGRAMS = Object.entries(PROGRAM_LABELS) as [Program, string][];

// ── Loading skeleton ──────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="mb-4 rounded-2xl bg-milk border border-bone-200 shadow-soft p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-bone-200" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-32 rounded bg-bone-200" />
          <div className="h-2.5 w-20 rounded bg-bone-100" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full rounded bg-bone-200" />
        <div className="h-3 w-4/5 rounded bg-bone-200" />
        <div className="h-3 w-3/5 rounded bg-bone-100" />
      </div>
      <div className="h-8 rounded-xl bg-bone-100" />
    </div>
  );
}

// ── CommunityPage ─────────────────────────────────────────

export default function CommunityPage() {
  const { user } = useAuth();

  const [posts,      setPosts]      = useState<ForumPost[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [hasMore,    setHasMore]    = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [typeFilter,    setTypeFilter]    = useState<FeedFilter>('all');
  const [programFilter, setProgramFilter] = useState<Program | 'all'>('all');
  const [composerOpen,  setComposerOpen]  = useState(false);

  // ── Data fetching ───────────────────────────────────────

  const load = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor)                  params.set('before',  cursor);
      if (typeFilter !== 'all')    params.set('type',    typeFilter);
      if (programFilter !== 'all') params.set('program', programFilter);

      const r = await api.get(`/forum/posts?${params}`);
      const { posts: incoming, hasMore: more, nextCursor: next } = r.data as {
        posts: ForumPost[];
        hasMore: boolean;
        nextCursor: string | null;
      };

      setPosts((prev) => cursor ? [...prev, ...incoming] : incoming);
      setHasMore(more);
      setNextCursor(next);
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not load posts. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [typeFilter, programFilter, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPosts([]);
    setNextCursor(null);
    setHasMore(false);
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, programFilter, refreshKey]);

  // ── Feed mutation callbacks ─────────────────────────────

  const handlePostCreated = (post: ForumPost) =>
    setPosts((prev) => {
      const pinned = prev.filter((p) => p.isPinned);
      const rest   = prev.filter((p) => !p.isPinned);
      return [...pinned, post, ...rest];
    });

  const handleDeleted = (id: string) =>
    setPosts((prev) => prev.filter((p) => p.id !== id));

  const handleLikeToggled = (id: string, likeCount: number, isLiked: boolean) =>
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, likeCount, isLiked } : p));

  const handleCommentCountChange = (id: string, delta: number) =>
    setPosts((prev) =>
      prev.map((p) => p.id === id ? { ...p, commentCount: p.commentCount + delta } : p),
    );

  const handlePinToggled = (id: string, isPinned: boolean) =>
    setPosts((prev) => {
      const updated = prev.map((p) => p.id === id ? { ...p, isPinned } : p);
      return [...updated.filter((p) => p.isPinned), ...updated.filter((p) => !p.isPinned)];
    });

  // ── Derived state ───────────────────────────────────────

  const isEmpty      = !loading && !error && posts.length === 0;
  const isFiltered   = typeFilter !== 'all' || programFilter !== 'all';
  const activeProgram = programFilter !== 'all' ? PROGRAM_LABELS[programFilter as Program] : null;

  return (
    <div>
      <PageHeader
        eyebrow="Sitio Villegas community"
        title="Community Forum"
        description="Stay connected, share event recaps, and celebrate milestones together."
        actions={
          !user ? (
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign in to post
            </Link>
          ) : undefined
        }
      />

      <section className="container-page pb-16">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left sidebar (desktop) ─────────────────── */}
          <aside className="hidden lg:block lg:w-64 shrink-0 space-y-3">

            {/* About card */}
            <div className="card-tight">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-phthalo-400" />
                <h2 className="text-sm font-semibold text-phthalo-500">Community</h2>
              </div>
              <p className="text-xs text-ink-500 leading-relaxed mb-3">
                A shared space for the Sitio Villegas volunteer family — share event recaps,
                photos from visit days, and messages of encouragement.
              </p>
              {!user && (
                <Link to="/register" className="btn btn-outline btn-sm w-full justify-center">
                  Join the community
                </Link>
              )}
            </div>

            {/* Program filter */}
            <div className="card-tight">
              <h2 className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2.5">
                Filter by program
              </h2>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setProgramFilter('all')}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    programFilter === 'all'
                      ? 'bg-phthalo-500 text-milk'
                      : 'text-ink-600 hover:bg-bone-100'
                  }`}
                >
                  All programs
                </button>
                {PROGRAMS.map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setProgramFilter(programFilter === k ? 'all' : k)}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      programFilter === k
                        ? `${PROGRAM_TONES[k]}`
                        : 'text-ink-600 hover:bg-bone-100'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="card-tight">
              <h2 className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2.5">
                Quick links
              </h2>
              <div className="space-y-0.5">
                {[
                  { to: '/events',    icon: CalendarDays,   label: 'Upcoming events'   },
                  { to: '/resources', icon: HeartHandshake, label: 'Resource needs'     },
                  { to: '/about',     icon: BookOpen,       label: 'About Sitio Villegas' },
                ].map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2.5 text-xs text-ink-600 hover:text-phthalo-500 py-1.5 px-1 rounded-lg hover:bg-bone-50 transition"
                  >
                    <Icon size={13} className="text-ink-400 shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

          </aside>

          {/* ── Main feed ─────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Type filter tabs */}
            <div className="flex gap-1 mb-3 bg-milk border border-bone-200 rounded-xl p-1 shadow-soft overflow-x-auto">
              {TYPE_TABS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap min-w-0 ${
                    typeFilter === value
                      ? 'bg-phthalo-500 text-milk shadow-sm'
                      : 'text-ink-500 hover:bg-bone-50'
                  }`}
                >
                  {icon}
                  <span className="hidden xs:inline sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Mobile: horizontal program chips */}
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none">
              <button
                onClick={() => setProgramFilter('all')}
                className={`badge shrink-0 cursor-pointer transition text-xs ${
                  programFilter === 'all' ? 'bg-phthalo-500 text-milk' : 'bg-bone-100 text-ink-700'
                }`}
              >
                All
              </button>
              {PROGRAMS.map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setProgramFilter(programFilter === k ? 'all' : k)}
                  className={`badge shrink-0 cursor-pointer transition text-xs ${
                    programFilter === k
                      ? `${PROGRAM_TONES[k]} ring-1 ring-inset ring-current`
                      : 'bg-bone-100 text-ink-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Active filter bar */}
            {isFiltered && (
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="text-ink-400">Filtered:</span>
                {activeProgram && (
                  <button
                    onClick={() => setProgramFilter('all')}
                    className={`badge ${PROGRAM_TONES[programFilter as Program]} inline-flex items-center gap-1`}
                  >
                    {activeProgram}
                    <X size={10} />
                  </button>
                )}
                {typeFilter !== 'all' && (
                  <button
                    onClick={() => setTypeFilter('all')}
                    className="badge badge-bone inline-flex items-center gap-1"
                  >
                    {TYPE_TABS.find((t) => t.value === typeFilter)?.label}
                    <X size={10} />
                  </button>
                )}
                <button
                  onClick={() => { setTypeFilter('all'); setProgramFilter('all'); }}
                  className="text-ink-400 hover:text-phthalo-500 hover:underline ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Refresh row */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-ink-400">
                {!loading && posts.length > 0 && `${posts.length}+ post${posts.length !== 1 ? 's' : ''}`}
              </span>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                disabled={loading}
                className="btn btn-ghost btn-sm gap-1.5 text-ink-400 hover:text-phthalo-500 disabled:opacity-40"
                title="Refresh feed"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline text-xs">Refresh</span>
              </button>
            </div>

            {/* Create post */}
            {user && <CreatePostCard onPostCreated={handlePostCreated} />}

            {/* Initial skeleton loading */}
            {loading && posts.length === 0 && (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="card-tight text-center py-10 mb-4">
                <MessageSquare size={32} className="mx-auto text-red-300 mb-3" />
                <p className="text-sm text-red-600 font-medium mb-1">Couldn't load posts</p>
                <p className="text-xs text-ink-400 mb-4">{error}</p>
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="btn btn-outline btn-sm gap-1.5"
                >
                  <RefreshCw size={13} /> Try again
                </button>
              </div>
            )}

            {/* Empty state */}
            {isEmpty && (
              <div className="card-tight text-center py-16 mb-4">
                <div className="w-16 h-16 rounded-full bg-bone-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={28} className="text-bone-300" />
                </div>
                <h3 className="font-semibold text-phthalo-500 mb-1 text-base">
                  {isFiltered ? 'No posts match your filters' : 'No posts yet'}
                </h3>
                <p className="text-sm text-ink-400 max-w-xs mx-auto mb-4">
                  {isFiltered
                    ? 'Try clearing the filters or choose a different category.'
                    : user
                    ? 'Be the first to share something with the Sitio Villegas community!'
                    : 'Sign in to be the first to share an update.'}
                </p>
                {isFiltered ? (
                  <button
                    onClick={() => { setTypeFilter('all'); setProgramFilter('all'); }}
                    className="btn btn-outline btn-sm"
                  >
                    Clear filters
                  </button>
                ) : !user ? (
                  <Link to="/login" className="btn btn-primary btn-sm">
                    Sign in to post
                  </Link>
                ) : null}
              </div>
            )}

            {/* Post feed */}
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDeleted={handleDeleted}
                onLikeToggled={handleLikeToggled}
                onCommentCountChange={handleCommentCountChange}
                onPinToggled={handlePinToggled}
              />
            ))}

            {/* Load more */}
            {hasMore && !loading && (
              <button
                onClick={() => load(nextCursor ?? undefined)}
                className="w-full btn btn-outline mt-2 gap-2"
              >
                <ChevronDown size={15} />
                Load more posts
              </button>
            )}

            {/* Loading more spinner */}
            {loading && posts.length > 0 && (
              <div className="flex items-center justify-center gap-2 py-6 text-ink-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading more…</span>
              </div>
            )}

            {/* End of feed */}
            {!hasMore && posts.length > 0 && !loading && (
              <p className="text-center text-xs text-ink-400 py-6">
                You're all caught up · {posts.length} post{posts.length !== 1 ? 's' : ''}
              </p>
            )}

          </div>
        </div>
      </section>

      {/* ── Compose FAB — sits above the chat widget FAB ── */}
      {user && (
        <button
          type="button"
          aria-label="Create a new post"
          onClick={() => setComposerOpen(true)}
          className="fixed bottom-24 right-5 z-40 group touch-manipulation"
        >
          <span className="h-12 w-12 rounded-full bg-maximum-500 text-white shadow-lg shadow-maximum/30 flex items-center justify-center hover:bg-maximum-600 active:scale-95 transition-all duration-150 group-hover:shadow-xl">
            <Plus className="h-5 w-5" />
          </span>
          {/* Tooltip — desktop only */}
          <span className="hidden sm:block absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap bg-ink-900/90 text-white text-xs rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-md">
            New post
          </span>
        </button>
      )}

      {/* ── Post composer modal ── */}
      {composerOpen && user && (
        <PostComposerModal
          onPostCreated={(post) => {
            handlePostCreated(post);
            setComposerOpen(false);
          }}
          onClose={() => setComposerOpen(false)}
        />
      )}
    </div>
  );
}

// ── Post composer modal ────────────────────────────────────

function PostComposerModal({
  onPostCreated,
  onClose,
}: {
  onPostCreated: (post: ForumPost) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Sheet / card */}
      <div
        className="w-full sm:max-w-xl bg-milk rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile */}
        <div className="sm:hidden flex justify-center pt-2.5 shrink-0">
          <div className="w-9 h-1 rounded-full bg-bone-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-maximum-50 flex items-center justify-center">
              <Plus size={14} className="text-maximum-600" />
            </div>
            <h2 className="font-semibold text-sm text-ink-900">Create Post</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full hover:bg-bone-100 flex items-center justify-center transition text-ink-400 hover:text-ink-700"
            aria-label="Close composer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain p-3 sm:p-4">
          <CreatePostCard
            alwaysExpanded
            onDismiss={onClose}
            onPostCreated={onPostCreated}
          />
        </div>
      </div>
    </div>
  );
}
