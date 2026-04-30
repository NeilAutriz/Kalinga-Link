import clsx from 'clsx';

type Props = {
  size?: number;
  withWordmark?: boolean;
  variant?: 'full' | 'mark';
  tone?: 'dark' | 'light';
  className?: string;
};

/**
 * KalingaLink logo — a clasped-hands leaf inside a rounded shield.
 * `tone="light"` is for dark backgrounds (renders milk fill).
 */
export function Logo({
  size = 36,
  withWordmark = true,
  variant = 'full',
  tone = 'dark',
  className,
}: Props) {
  const fg = tone === 'light' ? '#FFFDF5' : '#103713';
  const accent = tone === 'light' ? '#BDD296' : '#628B35';

  const mark = (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="kl-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone === 'light' ? '#0A240D' : '#103713'} />
          <stop offset="1" stopColor={tone === 'light' ? '#326639' : '#628B35'} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#kl-bg)" />
      {/* leaf */}
      <path
        d="M18 44c0-13 11-24 24-24 0 13-11 24-24 24z"
        fill="#FFFDF5"
        opacity="0.96"
      />
      <path
        d="M18 44c10-7 17-14 24-24"
        stroke={fg}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* hand circle */}
      <circle cx="20" cy="46" r="4.5" fill="#FFFDF5" />
      <circle cx="20" cy="46" r="2" fill={accent} />
    </svg>
  );

  if (variant === 'mark' || !withWordmark) return <span className={className}>{mark}</span>;

  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      {mark}
      <span className="leading-none">
        <span
          className={clsx(
            'block font-display font-bold tracking-tight',
            tone === 'light' ? 'text-milk' : 'text-phthalo-500',
          )}
          style={{ fontSize: size * 0.55 }}
        >
          KalingaLink
        </span>
        <span
          className={clsx(
            'block text-[10px] font-medium uppercase tracking-[0.18em]',
            tone === 'light' ? 'text-maximum-200' : 'text-maximum-600',
          )}
        >
          Bayanihan, organized.
        </span>
      </span>
    </span>
  );
}
