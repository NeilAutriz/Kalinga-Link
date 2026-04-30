import type { Role } from '../lib/types';
import clsx from 'clsx';

const map: Record<Role, string> = {
  organizer: 'bg-phthalo-500 text-milk',
  health:    'bg-maximum-500 text-milk',
  volunteer: 'bg-maximum-100 text-maximum-700',
  donor:     'bg-bone-200 text-ink-700',
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return <span className={clsx('badge capitalize', map[role], className)}>{role}</span>;
}
