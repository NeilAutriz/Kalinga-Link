import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Copy,
  Check,
  Calendar,
  HandHeart,
  Package,
  MapPin,
} from 'lucide-react';
import { api } from '../services/api';

type Msg = { role: 'user' | 'assistant'; text: string };
type Size = 'normal' | 'expanded';

const STORAGE_KEY = 'kalinga.chat.v1';

const GREETING: Msg = {
  role: 'assistant',
  text:
    "Kumusta! I'm **Kalinga** 🌱 — your guide to the program at Sitio Villegas.\n\nAsk me about our monthly visits, how to volunteer, what we currently need, or the community itself.",
};

type Suggestion = {
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STARTER_SUGGESTIONS: Suggestion[] = [
  { label: 'Next visit', prompt: 'When is the next visit and what is planned?', icon: Calendar },
  { label: 'How to volunteer', prompt: 'How can I volunteer for an upcoming visit?', icon: HandHeart },
  { label: "What's needed", prompt: 'What items are most needed right now?', icon: Package },
  { label: 'About Sitio Villegas', prompt: 'Tell me about Sitio Villegas and why this program exists.', icon: MapPin },
];

const FOLLOWUP_SUGGESTIONS = [
  'How do I make a donation pledge?',
  'What programs do you run each month?',
  "What's the story behind KalingaLink?",
  'How do health visits work?',
  'Can I bring my org to volunteer?',
  'How do I get to Sitio Villegas?',
];

const QUICK_LINKS = [
  { label: 'Events', to: '/events' },
  { label: 'Resources', to: '/resources' },
  { label: 'Donate', to: '/donate' },
  { label: 'About', to: '/about' },
];

/** Inline-markdown: **bold**, *italic*, `code`, [text](url). */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(
        <strong key={`${keyPrefix}-b${i++}`} className="font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith('`')) {
      parts.push(
        <code
          key={`${keyPrefix}-c${i++}`}
          className="px-1 py-0.5 rounded bg-bone-100 text-[0.85em] font-mono"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith('[')) {
      const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, url] = linkMatch;
        const internal = url.startsWith('/');
        parts.push(
          internal ? (
            <Link
              key={`${keyPrefix}-l${i++}`}
              to={url}
              className="underline decoration-phthalo-300 hover:text-phthalo"
            >
              {label}
            </Link>
          ) : (
            <a
              key={`${keyPrefix}-l${i++}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-phthalo-300 hover:text-phthalo"
            >
              {label}
            </a>
          ),
        );
      } else {
        parts.push(tok);
      }
    } else if (tok.startsWith('*')) {
      parts.push(<em key={`${keyPrefix}-i${i++}`}>{tok.slice(1, -1)}</em>);
    }
    last = idx + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MessageBody({ text, idx }: { text: string; idx: number }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.split('\n');
  let bulletBuf: string[] = [];
  let paraBuf: string[] = [];
  const flushPara = () => {
    if (paraBuf.length) {
      blocks.push(
        <p key={`p-${idx}-${blocks.length}`} className="leading-relaxed">
          {renderInline(paraBuf.join(' '), `m${idx}-${blocks.length}`)}
        </p>,
      );
      paraBuf = [];
    }
  };
  const flushBullets = () => {
    if (bulletBuf.length) {
      const buf = bulletBuf;
      blocks.push(
        <ul key={`u-${idx}-${blocks.length}`} className="list-disc pl-5 space-y-1 leading-relaxed">
          {buf.map((b, i) => (
            <li key={i}>{renderInline(b, `m${idx}-l${blocks.length}-${i}`)}</li>
          ))}
        </ul>,
      );
      bulletBuf = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      flushPara();
      bulletBuf.push(bullet[1]);
    } else if (line.trim() === '') {
      flushPara();
      flushBullets();
    } else {
      flushBullets();
      paraBuf.push(line);
    }
  }
  flushPara();
  flushBullets();
  return <div className="space-y-2 text-sm">{blocks}</div>;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<Size>('normal');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Msg[];
    } catch {
      // ignore
    }
    return [GREETING];
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isFirstTurn = msgs.length <= 1;

  const followUps = useMemo(() => {
    const seed = msgs.length;
    return [...FOLLOWUP_SUGGESTIONS]
      .sort((a, b) => ((a.charCodeAt(0) + seed) % 7) - ((b.charCodeAt(0) + seed) % 7))
      .slice(0, 3);
  }, [msgs.length]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    } catch {
      // ignore
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, open, sending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, size]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [input]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        if (size === 'expanded') setSize('normal');
        else setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, size]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setInput('');
    const next = [...msgs, { role: 'user' as const, text }];
    setMsgs(next);
    setSending(true);
    try {
      const history = next.slice(-9, -1);
      const { data } = await api.post<{ reply: string }>('/chat', {
        message: text,
        history,
      });
      setMsgs((m) => [...m, { role: 'assistant', text: data.reply }]);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg =
        status === 503
          ? 'The chat assistant is not configured yet. Please try again later.'
          : status === 429
            ? "Whoa — too many messages. Let's pause for a minute."
            : "Sorry, I couldn't reach the assistant. Please try again.";
      setMsgs((m) => [...m, { role: 'assistant', text: msg }]);
    } finally {
      setSending(false);
    }
  };

  const onComposerKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const reset = () => {
    setMsgs([GREETING]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const copyMsg = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((v) => (v === idx ? null : v)), 1500);
    } catch {
      // ignore
    }
  };

  const panelClass =
    size === 'expanded'
      ? 'fixed inset-3 sm:inset-6 md:inset-10 z-50 max-w-5xl mx-auto'
      : 'fixed bottom-24 right-5 z-50 w-[min(400px,calc(100vw-2rem))] h-[min(620px,calc(100vh-8rem))]';

  return (
    <>
      {open && size === 'expanded' && (
        <div
          className="fixed inset-0 z-40 bg-phthalo/40 backdrop-blur-sm"
          onClick={() => setSize('normal')}
          aria-hidden
        />
      )}

      {!(open && size === 'expanded') && (
        <button
          type="button"
          aria-label={open ? 'Close chat' : 'Open Kalinga chat assistant'}
          onClick={() => setOpen((o) => !o)}
          className="fixed bottom-5 right-5 z-50 group"
        >
          <span className="absolute inset-0 rounded-full bg-phthalo/40 animate-ping opacity-40 group-hover:opacity-0 transition" />
          <span className="relative h-14 w-14 rounded-full bg-phthalo text-white shadow-xl shadow-phthalo/30 flex items-center justify-center hover:bg-phthalo-700 transition">
            {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          </span>
          {!open && (
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-maximum border-2 border-milk" />
          )}
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Kalinga chat assistant"
          className={`${panelClass} bg-milk border border-bone-200 rounded-2xl shadow-2xl shadow-phthalo/20 flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-phthalo text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 shrink-0 rounded-full bg-maximum/90 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-phthalo" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  Kalinga
                  <span className="inline-flex items-center gap-1 text-[10px] font-normal text-bone-200/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> online
                  </span>
                </div>
                <div className="text-[11px] text-bone-200/80 truncate">
                  Your Sitio Villegas guide
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={reset}
                title="Start a new conversation"
                aria-label="Reset conversation"
                className="p-1.5 rounded-md hover:bg-white/10 transition"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSize((s) => (s === 'expanded' ? 'normal' : 'expanded'))}
                title={size === 'expanded' ? 'Shrink' : 'Expand'}
                aria-label={size === 'expanded' ? 'Shrink chat' : 'Expand chat'}
                className="p-1.5 rounded-md hover:bg-white/10 transition"
              >
                {size === 'expanded' ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                aria-label="Close chat"
                className="p-1.5 rounded-md hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-bone-50 border-b border-bone-200 overflow-x-auto">
            <span className="text-[10px] uppercase tracking-wider text-ink-400 shrink-0">
              Jump to
            </span>
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                onClick={() => size === 'expanded' && setSize('normal')}
                className="text-[11px] px-2 py-1 rounded-full bg-white border border-bone-200 text-ink-700 hover:border-phthalo-300 hover:text-phthalo transition shrink-0"
              >
                {q.label}
              </Link>
            ))}
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-gradient-to-b from-bone-50 to-milk"
          >
            {isFirstTurn && (
              <div className="rounded-2xl border border-bone-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-maximum/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-phthalo" />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <div className="font-semibold text-ink-900 text-sm">
                      Kumusta! I'm Kalinga 🌱
                    </div>
                    <div className="text-sm text-ink-700 leading-relaxed">
                      Ask me about Sitio Villegas, our monthly program, volunteering,
                      or what we need right now. Pick a starter below or type your own.
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STARTER_SUGGESTIONS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => send(s.prompt)}
                        className="text-left flex items-start gap-2 px-3 py-2.5 rounded-xl border border-bone-200 bg-bone-50 hover:bg-white hover:border-phthalo-300 hover:shadow-sm transition group"
                      >
                        <Icon className="h-4 w-4 mt-0.5 text-phthalo shrink-0 group-hover:scale-110 transition" />
                        <div className="min-w-0">
                          <div className="text-[12px] font-semibold text-ink-900">
                            {s.label}
                          </div>
                          <div className="text-[11px] text-ink-500 leading-snug truncate">
                            {s.prompt}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {msgs.slice(isFirstTurn ? 1 : 0).map((m, i) => {
              const realIdx = i + (isFirstTurn ? 1 : 0);
              const isUser = m.role === 'user';
              return (
                <div
                  key={realIdx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
                >
                  {!isUser && (
                    <div className="h-7 w-7 shrink-0 mr-2 rounded-full bg-phthalo/10 flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 text-phthalo" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${isUser ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 ${
                        isUser
                          ? 'bg-phthalo text-white rounded-br-sm'
                          : 'bg-white text-ink-900 border border-bone-200 rounded-bl-sm'
                      }`}
                    >
                      {isUser ? (
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {m.text}
                        </div>
                      ) : (
                        <MessageBody text={m.text} idx={realIdx} />
                      )}
                    </div>
                    {!isUser && (
                      <div className="mt-1 px-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => copyMsg(m.text, realIdx)}
                          className="text-[10px] text-ink-400 hover:text-phthalo flex items-center gap-1"
                        >
                          {copiedIdx === realIdx ? (
                            <>
                              <Check className="h-3 w-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex justify-start">
                <div className="h-7 w-7 shrink-0 mr-2 rounded-full bg-phthalo/10 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-phthalo" />
                </div>
                <div className="bg-white text-ink-500 border border-bone-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-phthalo/50 animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-phthalo/50 animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-phthalo/50 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {!isFirstTurn && !sending && (
            <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 bg-milk border-t border-bone-100">
              {followUps.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="text-[11px] px-2.5 py-1.5 rounded-full bg-white border border-bone-200 text-ink-700 hover:border-phthalo-300 hover:text-phthalo transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <div className="border-t border-bone-200 bg-white p-2.5">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onComposerKey}
                rows={1}
                maxLength={500}
                placeholder="Ask anything about Sitio Villegas…"
                className="flex-1 resize-none rounded-xl border border-bone-200 bg-bone-50 focus:bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-phthalo-300 focus:border-phthalo-300 transition max-h-36"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || sending}
                className="h-10 w-10 shrink-0 rounded-xl bg-phthalo text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-phthalo-700 active:scale-95 transition"
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-ink-400">
              <span>Press Enter to send · Shift+Enter for new line</span>
              <span className={input.length > 450 ? 'text-amber-600' : ''}>
                {input.length}/500
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
