import { ReactNode, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import clsx from 'clsx';

type Variant = 'default' | 'danger' | 'success' | 'info';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: Variant;
  /** Disable closing via backdrop click & esc — use for in-flight operations. */
  busy?: boolean;
  /** Hide the X close button (useful for blocking modals). */
  hideClose?: boolean;
};

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const variantBar = {
  default: 'from-maximum-500 to-maximum-300',
  danger:  'from-rose-600 to-rose-400',
  success: 'from-maximum-600 to-maximum-300',
  info:    'from-phthalo-500 to-maximum-400',
};

const variantIcon: Record<Variant, ReactNode> = {
  default: null,
  danger:  <span className="h-9 w-9 grid place-items-center rounded-full bg-rose-100 text-rose-600"><AlertTriangle size={18}/></span>,
  success: <span className="h-9 w-9 grid place-items-center rounded-full bg-maximum-100 text-maximum-700"><CheckCircle2 size={18}/></span>,
  info:    <span className="h-9 w-9 grid place-items-center rounded-full bg-phthalo-50 text-phthalo-500"><Info size={18}/></span>,
};

export function Modal({
  open, onClose, title, description, children, footer,
  size = 'md', variant = 'default', busy = false, hideClose = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose, busy]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center p-4 animate-[fadeIn_.18s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Close modal"
        onClick={() => !busy && onClose()}
        className="absolute inset-0 bg-phthalo-700/45 backdrop-blur-[3px] cursor-default"
      />
      <div
        className={clsx(
          'relative w-full bg-milk rounded-3xl border border-bone-200 shadow-2xl overflow-hidden',
          'animate-[modalIn_.22s_ease-out]',
          sizeMap[size],
        )}
      >
        {/* color bar */}
        <div className={clsx('h-1 w-full bg-gradient-to-r', variantBar[variant])} />

        <div className="px-6 pt-5 pb-4 border-b border-bone-200 flex items-start gap-3">
          {variantIcon[variant]}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-phthalo-500 leading-tight">{title}</h2>
            {description && <div className="mt-1 text-sm text-ink-700">{description}</div>}
          </div>
          {!hideClose && (
            <button
              onClick={() => !busy && onClose()}
              aria-label="Close"
              disabled={busy}
              className="p-1.5 rounded-lg text-ink-500 hover:bg-bone-100 disabled:opacity-40"
            >
              <X size={18}/>
            </button>
          )}
        </div>

        {children && <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>}

        {footer && (
          <div className="px-6 py-4 border-t border-bone-200 bg-bone-50/70 flex flex-wrap items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Convenience confirm-only dialog. */
export function ConfirmModal({
  open, onClose, onConfirm, title, description, busy,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default',
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  busy?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      variant={variant}
      size="sm"
      busy={busy}
      footer={(
        <>
          <button className="btn-ghost" onClick={onClose} disabled={busy}>{cancelLabel}</button>
          <button
            className={variant === 'danger' ? 'btn bg-rose-600 text-white hover:bg-rose-700' : 'btn-primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      )}
    >
      {children}
    </Modal>
  );
}
