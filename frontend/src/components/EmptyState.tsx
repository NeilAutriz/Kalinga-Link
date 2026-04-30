import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="card text-center py-12">
      <div className="mx-auto h-12 w-12 rounded-full bg-bone-100 grid place-items-center text-ink-500">
        <Inbox size={22}/>
      </div>
      <h3 className="mt-3 font-semibold text-phthalo-500">{title}</h3>
      {description && <p className="mt-1 text-sm text-ink-500 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
