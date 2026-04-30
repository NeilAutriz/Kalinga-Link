import type { EventStatus } from '../lib/types';
import clsx from 'clsx';

const map: Record<EventStatus, string> = {
  draft:     'badge-bone',
  published: 'badge-green',
  ongoing:   'badge-info',
  completed: 'badge-deep',
  cancelled: 'badge-danger',
};

export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  return <span className={clsx(map[status], 'capitalize', className)}>{status}</span>;
}
