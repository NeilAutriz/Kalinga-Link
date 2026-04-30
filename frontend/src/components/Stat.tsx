import clsx from 'clsx';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: 'phthalo' | 'maximum' | 'bone';
};

const toneMap = {
  phthalo: 'bg-phthalo-50 text-phthalo-500',
  maximum: 'bg-maximum-50 text-maximum-600',
  bone:    'bg-bone-100 text-ink-700',
};

export function Stat({ label, value, hint, icon, tone = 'maximum' }: Props) {
  return (
    <div className="card-tight h-full flex flex-col">
      <div className="flex items-start gap-3">
        {icon && (
          <div className={clsx('h-10 w-10 shrink-0 grid place-items-center rounded-xl', toneMap[tone])}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-2xl font-display font-bold text-phthalo-500 leading-tight">{value}</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-ink-500 leading-snug break-words">
            {label}
          </div>
        </div>
      </div>
      {hint && <p className="mt-2 text-[11px] text-ink-500 leading-snug">{hint}</p>}
    </div>
  );
}
