import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <header className="container-page pt-10 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-bold text-phthalo-500">{title}</h1>
        {description && <p className="mt-2 text-ink-700 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
