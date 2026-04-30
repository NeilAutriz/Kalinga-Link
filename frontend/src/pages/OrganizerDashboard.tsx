import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Loader2, Sparkles, Users, Activity, Gift, CalendarDays, Plus } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Stat } from '../components/Stat';
import { EventCard } from '../components/EventCard';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import { useApi } from '../lib/useApi';
import type { EventItem, ImpactStats, Program, EventStatus } from '../lib/types';
import { norm, PROGRAM_LABELS } from '../lib/types';

const PROGRAMS = Object.keys(PROGRAM_LABELS) as Program[];
const STATUSES: EventStatus[] = ['draft', 'published', 'ongoing', 'completed', 'cancelled'];

type FormState = {
  title: string; description: string;
  program: Program; barangay: string; sitio: string; partnerOrg: string;
  location: string; eventDate: string; startTime: string; endTime: string;
  targetChildren: number; status: EventStatus;
};

const blankForm = (): FormState => ({
  title: '', description: '',
  program: 'feeding', barangay: 'Putho-Tuntungin', sitio: 'Sitio Villegas', partnerOrg: '',
  location: 'Sitio Villegas Covered Court',
  eventDate: '', startTime: '09:00', endTime: '12:00',
  targetChildren: 30, status: 'draft',
});

export default function OrganizerDashboard() {
  const events = useApi<EventItem[]>('/events');
  const impact = useApi<ImpactStats>('/dashboard/impact');
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.eventDate) {
      toast.error('Missing details', 'Title, location, and date are required.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/events', {
        ...form,
        // backend expects ISO date; date input gives YYYY-MM-DD
        eventDate: new Date(form.eventDate + 'T00:00:00').toISOString(),
        targetChildren: Number(form.targetChildren) || 0,
      });
      toast.success('Event created', `${form.title} saved as ${form.status}.`);
      setOpen(false);
      setForm(blankForm());
      events.reload();
    } catch (err: any) {
      toast.error('Could not create event', err?.response?.data?.error ?? 'Please try again.');
    } finally { setBusy(false); }
  };

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
        actions={(
          <>
            <button onClick={() => setOpen(true)} className="btn-primary"><Plus size={14}/> Create event</button>
            <Link to="/events" className="btn-outline">Browse events</Link>
            <Link to="/children" className="btn-ghost">Child monitoring</Link>
          </>
        )}
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
        {!events.loading && !events.error && all.length === 0 && <EmptyState title="No events yet" description="Click the Create event button above to schedule the first one." action={<button onClick={() => setOpen(true)} className="btn-primary"><Plus size={14}/> Create event</button>} />}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-3">
          {all.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>

      {/* ── Create Event modal (organizer-only POST /events) ── */}
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="Create a new event"
        description="This becomes a visit on the public Events page. Save as Draft first if you're not ready to publish."
        size="lg"
        busy={busy}
        footer={(
          <>
            <button type="button" disabled={busy} onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" form="create-event-form" disabled={busy} className="btn-primary">
              {busy ? <><Loader2 className="animate-spin" size={14}/> Saving…</> : <><Plus size={14}/> Save event</>}
            </button>
          </>
        )}
      >
        <form id="create-event-form" onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input className="input" required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Sitio Villegas Feeding — November" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What will happen on this visit?" />
            </div>
            <div>
              <label className="label">Program</label>
              <select className="select" value={form.program} onChange={(e) => update('program', e.target.value as Program)}>
                {PROGRAMS.map((p) => <option key={p} value={p}>{PROGRAM_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={(e) => update('status', e.target.value as EventStatus)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" required value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start</label>
                <input type="time" className="input" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} />
              </div>
              <div>
                <label className="label">End</label>
                <input type="time" className="input" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Location</label>
              <input className="input" required value={form.location} onChange={(e) => update('location', e.target.value)} />
            </div>
            <div>
              <label className="label">Barangay</label>
              <input className="input" value={form.barangay} onChange={(e) => update('barangay', e.target.value)} />
            </div>
            <div>
              <label className="label">Sitio</label>
              <input className="input" value={form.sitio} onChange={(e) => update('sitio', e.target.value)} />
            </div>
            <div>
              <label className="label">Partner org (optional)</label>
              <input className="input" value={form.partnerOrg} onChange={(e) => update('partnerOrg', e.target.value)} placeholder="UPLB CHE · IRRI Staff Council · …" />
            </div>
            <div>
              <label className="label">Target children</label>
              <input type="number" min={0} className="input" value={form.targetChildren} onChange={(e) => update('targetChildren', Number(e.target.value))} />
            </div>
          </div>
          <p className="text-[11px] text-ink-500">Only organizers can create events. The backend enforces this via <code>requireRole('organizer')</code> on <code>POST /api/v1/events</code>.</p>
        </form>
      </Modal>
    </div>
  );
}
