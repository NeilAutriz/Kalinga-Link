import clsx from 'clsx';
import { Wifi, WifiOff } from 'lucide-react';

export function LiveIndicator({ live, className }: { live: boolean; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-semibold px-2 py-1 rounded-full',
        live ? 'bg-maximum-100 text-maximum-700' : 'bg-bone-100 text-ink-500',
        className,
      )}
      title={live ? 'Live data from MongoDB' : 'Demo data (API offline)'}
    >
      {live ? <Wifi size={10} /> : <WifiOff size={10} />}
      {live ? 'Live' : 'Demo data'}
    </span>
  );
}
