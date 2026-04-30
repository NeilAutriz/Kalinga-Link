import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export type ToastKind = 'success' | 'error' | 'info' | 'loading';
type Toast = { id: string; kind: ToastKind; title: string; description?: string; duration?: number };

type Ctx = {
  toast: {
    success: (title: string, description?: string) => string;
    error:   (title: string, description?: string) => string;
    info:    (title: string, description?: string) => string;
    loading: (title: string, description?: string) => string;
  };
  dismiss: (id: string) => void;
  update:  (id: string, t: Partial<Omit<Toast,'id'>>) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

const ICONS: Record<ToastKind, JSX.Element> = {
  success: <CheckCircle2 size={18} className="text-maximum-600" />,
  error:   <AlertTriangle size={18} className="text-rose-600" />,
  info:    <Info size={18} className="text-sky-600" />,
  loading: <Loader2 size={18} className="text-phthalo-500 animate-spin" />,
};

const TONE: Record<ToastKind, string> = {
  success: 'border-maximum-200 bg-maximum-50',
  error:   'border-rose-200 bg-rose-50',
  info:    'border-sky-200 bg-sky-50',
  loading: 'border-phthalo-100 bg-phthalo-50',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const update  = useCallback((id: string, patch: Partial<Omit<Toast,'id'>>) =>
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t))), []);

  const push = useCallback((kind: ToastKind, title: string, description?: string) => {
    const id = Math.random().toString(36).slice(2);
    const duration = kind === 'loading' ? 0 : kind === 'error' ? 6500 : 4500;
    setToasts((ts) => [...ts, { id, kind, title, description, duration }]);
    return id;
  }, []);

  const value: Ctx = {
    toast: {
      success: (t, d) => push('success', t, d),
      error:   (t, d) => push('error',   t, d),
      info:    (t, d) => push('info',    t, d),
      loading: (t, d) => push('loading', t, d),
    },
    dismiss, update,
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[min(380px,92vw)] pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  useEffect(() => {
    if (!t.duration) return;
    const id = setTimeout(onDismiss, t.duration);
    return () => clearTimeout(id);
  }, [t.duration, onDismiss]);

  return (
    <div
      role={t.kind === 'error' ? 'alert' : 'status'}
      className={clsx(
        'pointer-events-auto rounded-2xl border shadow-soft p-3.5 pr-9 relative animate-[toastIn_.18s_ease-out]',
        TONE[t.kind],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{ICONS[t.kind]}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-phthalo-500 leading-tight">{t.title}</p>
          {t.description && <p className="mt-0.5 text-xs text-ink-700 leading-snug">{t.description}</p>}
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="absolute top-2 right-2 p-1 rounded-md text-ink-500 hover:bg-bone-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export const useToast = () => {
  const v = useContext(ToastCtx);
  if (!v) throw new Error('useToast must be used within ToastProvider');
  return v;
};
