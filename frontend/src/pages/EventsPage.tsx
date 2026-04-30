import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { EventCard } from '../components/EventCard';
import { EmptyState } from '../components/EmptyState';
import { useApi } from '../lib/useApi';
import type { EventItem, EventStatus, Program } from '../lib/types';
import { norm, PROGRAM_LABELS } from '../lib/types';
import { Loader2 } from 'lucide-react';

const STATUSES: { value: EventStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'draft', label: 'Draft' },
];

const PROGRAMS: { value: Program | 'all'; label: string }[] = [
  { value: 'all', label: 'All programs' },
  ...(Object.keys(PROGRAM_LABELS) as Program[]).map((p) => ({ value: p, label: PROGRAM_LABELS[p] })),
];

export default function EventsPage() {
  const [status, setStatus] = useState<EventStatus | 'all'>('all');
  const [program, setProgram] = useState<Program | 'all'>('all');
  const [q, setQ] = useState('');

  const path = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (program !== 'all') params.set('program', program);
    const qs = params.toString();
    return `/events${qs ? `?${qs}` : ''}`;
  }, [status, program]);

  const { data, loading, error } = useApi<EventItem[]>(path);
  const events = (data ?? []).map(norm).filter((e) =>
    !q ? true : (e.title + ' ' + e.description + ' ' + (e.barangay ?? '') + ' ' + (e.location ?? '')).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        eyebrow="Programs across Los Baños"
        title="Find an event near you"
        description="Browse upcoming feeding cycles, health missions, learning sessions, environmental drives and more — filter by program and barangay."
      />

      <section className="container-page">
        <div className="card-tight grid md:grid-cols-3 gap-3">
          <input className="input" placeholder="Search by title, barangay, or location…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" value={program} onChange={(e) => setProgram(e.target.value as Program | 'all')}>
            {PROGRAMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as EventStatus | 'all')}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="mt-6">
          {loading && <div className="flex items-center gap-2 text-ink-500"><Loader2 className="animate-spin" size={16}/> Loading events from MongoDB Atlas…</div>}
          {error && !loading && <EmptyState title="Could not load events" description={error} />}
          {!loading && !error && events.length === 0 && <EmptyState title="No events match your filters" description="Try a different program or status." />}
          {!loading && !error && events.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {events.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
