import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [params, setParams] = useSearchParams();
  const programParam = (params.get('program') as Program | 'all' | null) ?? 'all';
  const statusParam  = (params.get('status')  as EventStatus | 'all' | null) ?? 'all';
  const qParam       = params.get('q') ?? '';

  const [status,  setStatus]  = useState<EventStatus | 'all'>(statusParam);
  const [program, setProgram] = useState<Program | 'all'>(programParam);
  const [q,       setQ]       = useState(qParam);

  // Keep URL in sync when filters change (so links remain shareable).
  useEffect(() => {
    const next = new URLSearchParams();
    if (status  !== 'all') next.set('status',  status);
    if (program !== 'all') next.set('program', program);
    if (q.trim())          next.set('q', q.trim());
    setParams(next, { replace: true });
  }, [status, program, q, setParams]);

  // Reflect URL changes (e.g. clicking a homepage program card) into local state.
  useEffect(() => { setProgram(programParam); }, [programParam]);
  useEffect(() => { setStatus(statusParam);   }, [statusParam]);

  const path = useMemo(() => {
    const sp = new URLSearchParams();
    if (status  !== 'all') sp.set('status',  status);
    if (program !== 'all') sp.set('program', program);
    const qs = sp.toString();
    return `/events${qs ? `?${qs}` : ''}`;
  }, [status, program]);

  const { data, loading, error } = useApi<EventItem[]>(path);
  const events = (data ?? []).map(norm).filter((e) =>
    !q ? true : (e.title + ' ' + e.description + ' ' + (e.barangay ?? '') + ' ' + (e.location ?? '')).toLowerCase().includes(q.toLowerCase())
  );

  const activeProgramLabel = program === 'all' ? null : PROGRAM_LABELS[program];

  return (
    <div>
      <PageHeader
        eyebrow="Visits & programs"
        title={activeProgramLabel ? `${activeProgramLabel} visits at Sitio Villegas` : 'Find an event near you'}
        description={
          activeProgramLabel
            ? `Showing only ${activeProgramLabel.toLowerCase()} visits. Clear the program filter below to see everything scheduled for Sitio Villegas.`
            : 'Browse upcoming visits to Sitio Villegas \u2014 feeding cycles, health pop-ups, reading sessions, trail cleanups, and youth-arts days. Filter by program.'
        }
      />

      <section className="container-page">
        {(program !== 'all' || status !== 'all' || q.trim()) && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink-500">Active filters:</span>
            {program !== 'all' && (
              <button onClick={() => setProgram('all')} className="badge-green inline-flex items-center gap-1">
                {PROGRAM_LABELS[program]} ×
              </button>
            )}
            {status !== 'all' && (
              <button onClick={() => setStatus('all')} className="badge-bone inline-flex items-center gap-1">
                {status} ×
              </button>
            )}
            {q.trim() && (
              <button onClick={() => setQ('')} className="badge-bone inline-flex items-center gap-1">
                “{q}” ×
              </button>
            )}
            <button
              onClick={() => { setProgram('all'); setStatus('all'); setQ(''); }}
              className="text-maximum-700 hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="card-tight grid md:grid-cols-3 gap-3">
          <input className="input" placeholder="Search by title, program, or location…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" value={program} onChange={(e) => setProgram(e.target.value as Program | 'all')}>
            {PROGRAMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as EventStatus | 'all')}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="mt-6">
          {loading && <div className="flex items-center gap-2 text-ink-500"><Loader2 className="animate-spin" size={16}/> Loading visits…</div>}
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
