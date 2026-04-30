import { Link } from 'react-router-dom';
import { Loader2, Sparkles, Users, Activity, Gift, CalendarDays } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Stat } from '../components/Stat';
import { EventCard } from '../components/EventCard';
import { EmptyState } from '../components/EmptyState';
import { useApi } from '../lib/useApi';
import type { EventItem, ImpactStats } from '../lib/types';
import { norm, PROGRAM_LABELS } from '../lib/types';

export default function OrganizerDashboard() {
  const events = useApi<EventItem[]>('/events');
  const impact = useApi<ImpactStats>('/dashboard/impact');

  const all = (events.data ?? []).map(norm);
  const draft     = all.filter((e) => e.status === 'draft');
  const published = all.filter((e) => e.status === 'published');
  const ongoing   = all.filter((e) => e.status === 'ongoing');
  const completed = all.filter((e) => e.status === 'completed');

  const byProgram = all.reduce<Record<string, number>>((acc, e) => {
    if (!e.program) return acc;
    acc[e.program] = (acc[e.program] ?? 0) + 1; return acc;
  }, {});

  return (
    <div>
      <PageHeader
        eyebrow="Organizer console"
        title="Operations overview"
        description="Live snapshot of programs, events, volunteers and pledges across Los Baños."
        actions={<><Link to="/events" className="btn-outline">Browse events</Link><Link to="/children" className="btn-primary">Child monitoring</Link></>}
      />

      <section className="container-page grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Sparkles size={18}/>} label="Events completed" value={impact.data?.eventsCompleted ?? '—'} />
        <Stat icon={<Users size={18}/>}    label="Children served"  value={impact.data?.childrenServed ?? '—'} tone="phthalo"/>
        <Stat icon={<Activity size={18}/>} label="Children improved" value={impact.data?.childrenImproved ?? '—'} />
        <Stat icon={<Gift size={18}/>}     label="Pledges received" value={impact.data?.pledgesReceived ?? '—'} tone="bone"/>
      </section>

      <section className="container-page mt-8 grid md:grid-cols-4 gap-3">
        <Stat icon={<CalendarDays size={18}/>} label="Drafts"     value={draft.length} />
        <Stat icon={<CalendarDays size={18}/>} label="Published"  value={published.length} tone="phthalo"/>
        <Stat icon={<CalendarDays size={18}/>} label="Ongoing"    value={ongoing.length} />
        <Stat icon={<CalendarDays size={18}/>} label="Completed"  value={completed.length} tone="bone"/>
      </section>

      <section className="container-page mt-8">
        <h2 className="section-title">Events by program</h2>
        <div className="card-tight grid grid-cols-2 md:grid-cols-6 gap-3">
          {Object.keys(PROGRAM_LABELS).map((p) => (
            <div key={p} className="text-center">
              <div className="text-2xl font-display font-bold text-phthalo-500">{byProgram[p] ?? 0}</div>
              <div className="text-xs uppercase tracking-wider text-ink-500">{PROGRAM_LABELS[p as keyof typeof PROGRAM_LABELS]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page mt-8">
        <h2 className="section-title">All events (live)</h2>
        {events.loading && <div className="text-ink-500 flex items-center gap-2"><Loader2 className="animate-spin" size={14}/> Loading…</div>}
        {events.error && <EmptyState title="Could not load events" description={events.error} />}
        {!events.loading && !events.error && all.length === 0 && <EmptyState title="No events yet" description="Run the seed script to populate." />}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-3">
          {all.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>
    </div>
  );
}
