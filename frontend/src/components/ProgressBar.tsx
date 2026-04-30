import clsx from 'clsx';

type Props = {
  value: number; // 0..100
  tone?: 'maximum' | 'phthalo' | 'amber' | 'red';
  className?: string;
};

const toneMap = {
  maximum: 'bg-maximum-500',
  phthalo: 'bg-phthalo-500',
  amber:   'bg-amber-500',
  red:     'bg-red-500',
};

export function ProgressBar({ value, tone = 'maximum', className }: Props) {
  return (
    <div className={clsx('progress', className)}>
      <div className={toneMap[tone]} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
