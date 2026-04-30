export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en-PH', opts);

export const formatRelative = (iso: string) => {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60) return fmt.format(Math.round(diff), 'second');
  if (abs < 3600) return fmt.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return fmt.format(Math.round(diff / 3600), 'hour');
  return fmt.format(Math.round(diff / 86400), 'day');
};

export const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);
