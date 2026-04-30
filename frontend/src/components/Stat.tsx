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
    <div className="card-tight">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={clsx('h-10 w-10 grid place-items-center rounded-xl', toneMap[tone])}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-2xl font-display font-bold text-phthalo-500 leading-tight">{value}</div>
          <div className="text-xs text-ink-500 truncate">{label}</div>
        </div>
      </div>
      {hint && <p className="mt-3 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
