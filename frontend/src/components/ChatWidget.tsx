import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';

type Msg = { role: 'user' | 'assistant'; text: string };

const STORAGE_KEY = 'kalinga.chat.v1';
const GREETING: Msg = {
  role: 'assistant',
  text: "Hi! I'm Kalinga 🌱 — ask me about Sitio Villegas, our monthly visits, how to volunteer, or what we currently need.",
};
const SUGGESTIONS = [
  'When is the next visit?',
  'How can I volunteer?',
  'What items are needed right now?',
  'Tell me about Sitio Villegas.',
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
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

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    } catch {
      // ignore
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setInput('');
    const next = [...msgs, { role: 'user' as const, text }];
    setMsgs(next);
    setSending(true);
    try {
      const history = next.slice(-9, -1); // last 8 turns of context, excluding current
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

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        aria-label={open ? 'Close chat' : 'Open chat'}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-phthalo text-white shadow-lg shadow-phthalo/30 flex items-center justify-center hover:bg-phthalo-700 transition"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Kalinga assistant"
          className="fixed bottom-24 right-5 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-8rem))] bg-milk border border-bone-200 rounded-2xl shadow-2xl shadow-phthalo/20 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-phthalo text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-maximum-200" />
              <div className="leading-tight">
                <div className="font-semibold text-sm">Kalinga assistant</div>
                <div className="text-[11px] text-bone-200/80">Ask about Sitio Villegas</div>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-[11px] uppercase tracking-wide opacity-70 hover:opacity-100"
            >
              Reset
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-bone-50">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-phthalo text-white rounded-br-sm'
                      : 'bg-white text-ink-900 border border-bone-200 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white text-ink-500 border border-bone-200 rounded-2xl rounded-bl-sm px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
            {msgs.length <= 1 && !sending && (
              <div className="pt-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="text-xs px-2.5 py-1.5 rounded-full bg-white border border-bone-200 text-ink-700 hover:border-phthalo-300 hover:text-phthalo transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-bone-200 bg-white p-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                rows={1}
                maxLength={500}
                placeholder="Type your question…"
                className="flex-1 resize-none rounded-xl border border-bone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-phthalo-300 max-h-28"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || sending}
                className="h-9 w-9 shrink-0 rounded-xl bg-phthalo text-white flex items-center justify-center disabled:opacity-40 hover:bg-phthalo-700 transition"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1 px-1 text-[10px] text-ink-400">
              AI replies may be inaccurate. No child data is shared with the assistant.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
