import type { Role } from '../lib/types';
import { ROLE_INFO } from '../lib/nav';
import clsx from 'clsx';

type Props = {
  role: Role;
  className?: string;
  /** When true, append the role's short tagline (e.g. "Organizer · Runs the program"). */
  withTagline?: boolean;
  /** When true, render the role icon to its left. */
  withIcon?: boolean;
};

/**
 * Always shows the friendly label ("Health partner", not "health"), with an
 * accessible title attribute that explains what the role does. This is the only
 * place in the UI users see role wording, so keep it consistent with ROLE_INFO.
 */
export function RoleBadge({ role, className, withTagline, withIcon }: Props) {
  const info = ROLE_INFO[role];
  const Icon = info.icon;
  return (
    <span
      className={clsx('badge inline-flex items-center gap-1', info.badgeClass, className)}
      title={`${info.label} — ${info.summary}`}
      aria-label={`${info.label} role: ${info.tagline}`}
    >
      {withIcon && <Icon size={12} aria-hidden />}
      <span>{info.label}</span>
      {withTagline && (
        <span className="opacity-80 font-normal">· {info.tagline}</span>
      )}
    </span>
  );
}
