import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Loader2, Sparkles, Users, Activity, Gift, CalendarDays, Plus,
  Trash2, Package, Pencil,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import { Stat } from '../components/Stat';
import { EventCard } from '../components/EventCard';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { api, createResourceNeed, deleteResourceNeed, createCommittee, deleteCommittee, updateEvent } from '../services/api';
import { useApi } from '../lib/useApi';
import type { EventItem, ImpactStats, Program, EventStatus, ResourceNeed, ResourceCategory, ResourceNeedInput, Committee } from '../lib/types';
import { norm, PROGRAM_LABELS } from '../lib/types';

const PROGRAMS = Object.keys(PROGRAM_LABELS) as Program[];
const STATUSES: EventStatus[] = ['draft', 'published', 'ongoing', 'completed', 'cancelled'];

/* ───────────── Supply Catalogue ───────────── */
const SUPPLY_CATALOGUE: Record<string, string[]> = {
  food:      ['Rice', 'Canned Goods', 'Cooking Oil', 'Noodles', 'Biscuits', 'Bread'],
  utensils:  ['Plates', 'Cups', 'Spoons & Forks', 'Cooking Pot', 'Ladle', 'Bowls'],
  art:       ['Notebooks', 'Crayons', 'Colored Paper', 'Pencils', 'Scissors', 'Glue'],
  hygiene:   ['Soap', 'Hand Sanitizer', 'Alcohol', 'Face Masks', 'Shampoo', 'Toothbrush'],
  equipment: ['Thermometer', 'Blood Pressure Monitor', 'Weighing Scale', 'Trash Bags', 'First Aid Kit'],
  transport: ['Van Trip', 'Motorcycle Delivery'],
  other:     [],
};

const CATEGORIES = ['food', 'utensils', 'art', 'hygiene', 'equipment', 'transport', 'other'] as const;

/* ───────────── SupplyManager component ───────────── */
function SupplyManager({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: resourceNeeds = [], isLoading } = useQuery({
    queryKey: ['resources', eventId],
    queryFn: () =>
      api.get(`/resources?eventId=${eventId}`).then(r => r.data.resourceNeeds ?? r.data),
    enabled: !!eventId,
  });

  const [isCustom, setIsCustom] = useState(false);
  const [category, setCategory] = useState<ResourceCategory>('food');
  const [itemName, setItemName] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState<number>(1);
  const [unit, setUnit] = useState('pcs');

  const catalogueItems = SUPPLY_CATALOGUE[category] ?? [];

  const addMutation = useMutation({
    mutationFn: (data: ResourceNeedInput) => createResourceNeed(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', eventId] });
      toast.success('Supply added', 'Resource need has been created.');
      setItemName('');
      setCustomItemName('');
      setQuantityNeeded(1);
      setUnit('pcs');
    },
    onError: (err: any) => {
      toast.error('Could not add supply', err?.response?.data?.error ?? 'Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteResourceNeed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', eventId] });
      toast.success('Supply removed', 'Resource need has been deleted.');
    },
    onError: (err: any) => {
      toast.error('Could not delete supply', err?.response?.data?.error ?? 'Please try again.');
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedName = isCustom ? customItemName.trim() : itemName;
    if (!resolvedName) {
      toast.error('Item name required', 'Please select or enter an item name.');
      return;
    }
    if (quantityNeeded < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    addMutation.mutate({ eventId, itemName: resolvedName, category, quantityNeeded, unit });
  };

  const handleDelete = (need: ResourceNeed & { id: string }) => {
    if (!window.confirm(`Delete "${need.itemName}"? This cannot be undone.`)) return;
    deleteMutation.mutate(need.id);
  };

  return (
    <div className="mt-3 border-t border-bone-200 pt-4 space-y-4">
      <h3 className="text-sm font-semibold text-phthalo-500 flex items-center gap-2">
        <Package size={14} /> Manage Supplies
      </h3>

      {/* Existing resource needs list */}
      {isLoading && (
        <div className="text-ink-500 flex items-center gap-2 text-sm">
          <Loader2 className="animate-spin" size={13} /> Loading supplies…
        </div>
      )}
      {!isLoading && resourceNeeds.length === 0 && (
        <p className="text-xs text-ink-500">No resource needs added yet for this event.</p>
      )}
      {!isLoading && resourceNeeds.length > 0 && (
        <ul className="space-y-1.5">
          {resourceNeeds.map((need: ResourceNeed & { _id?: string; id?: string }) => {
            const normalized = norm(need);
            return (
              <li key={normalized.id} className="flex items-center justify-between gap-2 rounded-lg border border-bone-200 bg-milk px-3 py-2 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-phthalo-500">{normalized.itemName}</span>
                  <span className="ml-2 text-xs text-ink-500">{normalized.category}</span>
                  <span className="ml-2 text-xs text-ink-400">
                    {normalized.quantityNeeded} {normalized.unit}
                    {normalized.quantityReceived > 0 && ` (${normalized.quantityReceived} received)`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(normalized)}
                  disabled={deleteMutation.isPending}
                  className="shrink-0 text-ink-400 hover:text-rose-600 transition disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add Supply form */}
      <form onSubmit={handleAdd} className="rounded-xl border border-bone-200 bg-bone-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-phthalo-500 uppercase tracking-wider">Add Supply</span>
          <button
            type="button"
            onClick={() => { setIsCustom(v => !v); setItemName(''); setCustomItemName(''); }}
            className="text-[11px] text-maximum-600 hover:underline"
          >
            {isCustom ? 'Use catalogue' : 'Enter custom item'}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <select
              className="select"
              value={category}
              onChange={e => { setCategory(e.target.value as ResourceCategory); setItemName(''); }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Item</label>
            {isCustom ? (
              <input
                className="input"
                required
                placeholder="Custom item name"
                value={customItemName}
                onChange={e => setCustomItemName(e.target.value)}
              />
            ) : (
              <select
                className="select"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                required
              >
                <option value="">— Select item —</option>
                {catalogueItems.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
                {catalogueItems.length === 0 && (
                  <option value="" disabled>No catalogue items — use custom</option>
                )}
              </select>
            )}
          </div>

          <div>
            <label className="label">Quantity needed</label>
            <input
              type="number"
              min={1}
              className="input"
              required
              value={quantityNeeded}
              onChange={e => setQuantityNeeded(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <div>
            <label className="label">Unit</label>
            <input
              className="input"
              required
              placeholder="pcs, kg, pack…"
              value={unit}
              onChange={e => setUnit(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={addMutation.isPending}
          className="btn-primary btn-sm"
        >
          {addMutation.isPending
            ? <><Loader2 className="animate-spin" size={13} /> Adding…</>
            : <><Plus size={13} /> Add Supply</>}
        </button>
      </form>
    </div>
  );
}

/* ───────────── CommitteeManager component ───────────── */
function CommitteeManager({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: committeeData, isLoading } = useQuery({
    queryKey: ['committees', eventId],
    queryFn: () => api.get(`/committees?eventId=${eventId}`).then(r => r.data.committees ?? r.data),
    enabled: !!eventId,
  });
  const committees: (Committee & { _id?: string })[] = committeeData ?? [];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slotCount, setSlotCount] = useState<number>(1);

  const addMutation = useMutation({
    mutationFn: () => createCommittee({ eventId, name: name.trim(), description: description.trim(), slotCount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committees', eventId] });
      toast.success('Committee added');
      setName(''); setDescription(''); setSlotCount(1);
    },
    onError: (err: any) => toast.error('Could not add committee', err?.response?.data?.error ?? 'Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCommittee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committees', eventId] });
      toast.success('Committee removed');
    },
    onError: (err: any) => toast.error('Could not remove committee', err?.response?.data?.error ?? 'Please try again.'),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name required'); return; }
    if (slotCount < 1) { toast.error('Slots must be at least 1'); return; }
    addMutation.mutate();
  };

  const handleDelete = (c: Committee & { _id?: string }) => {
    const id = c.id ?? c._id;
    if (!id) return;
    if (!window.confirm(`Delete committee "${c.name}"?`)) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-phthalo-500 flex items-center gap-2">
        <Users size={14} /> Committees & Volunteer Slots
      </h3>
      {isLoading && <div className="text-ink-500 flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={13}/> Loading…</div>}
      {!isLoading && committees.length === 0 && <p className="text-xs text-ink-500">No committees yet.</p>}
      {!isLoading && committees.length > 0 && (
        <ul className="space-y-1.5">
          {committees.map((c) => {
            const id = c.id ?? c._id ?? '';
            return (
              <li key={id} className="flex items-center justify-between gap-2 rounded-lg border border-bone-200 bg-milk px-3 py-2 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-phthalo-500">{c.name}</span>
                  {c.description && <span className="ml-2 text-xs text-ink-500">{c.description}</span>}
                  <span className="ml-2 text-xs text-ink-400">{c.slotCount} slot{c.slotCount !== 1 ? 's' : ''}</span>
                </div>
                <button type="button" onClick={() => handleDelete(c)} disabled={deleteMutation.isPending} className="shrink-0 text-ink-400 hover:text-rose-600 transition disabled:opacity-50" title="Delete"><Trash2 size={14}/></button>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={handleAdd} className="rounded-xl border border-bone-200 bg-bone-50 p-4 space-y-3">
        <span className="text-xs font-semibold text-phthalo-500 uppercase tracking-wider">Add Committee</span>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={name} onChange={e => setName(e.target.value)} placeholder="Food preparation" />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" />
          </div>
          <div>
            <label className="label">Volunteer slots</label>
            <input type="number" min={1} className="input" required value={slotCount} onChange={e => setSlotCount(Math.max(1, Number(e.target.value) || 1))} />
          </div>
        </div>
        <button type="submit" disabled={addMutation.isPending} className="btn-primary btn-sm">
          {addMutation.isPending ? <><Loader2 className="animate-spin" size={13}/> Adding…</> : <><Plus size={13}/> Add Committee</>}
        </button>
      </form>
    </div>
  );
}

/* ───────────── CommitteeDraftList (for create-event modal) ───────────── */
type CommitteeDraft = { name: string; description: string; slotCount: number };

function CommitteeDraftList({ drafts, onChange }: { drafts: CommitteeDraft[]; onChange: (d: CommitteeDraft[]) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slotCount, setSlotCount] = useState<number>(1);
  const { toast } = useToast();

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name required'); return; }
    onChange([...drafts, { name: name.trim(), description: description.trim(), slotCount }]);
    setName(''); setDescription(''); setSlotCount(1);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-phthalo-500 flex items-center gap-2"><Users size={14}/> Committees & Volunteer Slots</h3>
      {drafts.length === 0 && <p className="text-xs text-ink-500">No committees added — you can add them here or after saving the event.</p>}
      {drafts.length > 0 && (
        <ul className="space-y-1.5">
          {drafts.map((d, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-bone-200 bg-milk px-3 py-2 text-sm">
              <div className="min-w-0">
                <span className="font-medium text-phthalo-500">{d.name}</span>
                {d.description && <span className="ml-2 text-xs text-ink-500">{d.description}</span>}
                <span className="ml-2 text-xs text-ink-400">{d.slotCount} slot{d.slotCount !== 1 ? 's' : ''}</span>
              </div>
              <button type="button" onClick={() => onChange(drafts.filter((_, j) => j !== i))} className="shrink-0 text-ink-400 hover:text-rose-600 transition" title="Remove"><Trash2 size={14}/></button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="rounded-xl border border-bone-200 bg-bone-50 p-4 space-y-3">
        <span className="text-xs font-semibold text-phthalo-500 uppercase tracking-wider">Add Committee</span>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Food preparation" />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" />
          </div>
          <div>
            <label className="label">Volunteer slots</label>
            <input type="number" min={1} className="input" value={slotCount} onChange={e => setSlotCount(Math.max(1, Number(e.target.value) || 1))} />
          </div>
        </div>
        <button type="submit" className="btn-primary btn-sm"><Plus size={13}/> Add Committee</button>
      </form>
    </div>
  );
}

/* ───────────── OrganizerEventCard ───────────── */
function OrganizerEventCard({ event, onEdit }: { event: EventItem & { id: string }; onEdit: (e: EventItem & { id: string }) => void }) {
  const canEdit = event.status === 'draft' || event.status === 'published';
  return (
    <EventCard
      event={event}
      actions={canEdit ? (
        <button type="button" onClick={() => onEdit(event)} className="btn-outline">
          <Pencil size={14}/> Edit event
        </button>
      ) : undefined}
    />
  );
}

/* ───────────── FormState ───────────── */
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

/* ───────────── OrganizerDashboard ───────────── */
export default function OrganizerDashboard() {
  const events = useApi<EventItem[]>('/events');
  const impact = useApi<ImpactStats>('/dashboard/impact');
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());
  const [editingEvent, setEditingEvent] = useState<(EventItem & { id: string }) | null>(null);
  const [editForm, setEditForm] = useState<FormState>(blankForm());
  const [editBusy, setEditBusy] = useState(false);
  const [pendingCommittees, setPendingCommittees] = useState<CommitteeDraft[]>([]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openEdit = (event: EventItem & { id: string }) => {
    setEditForm({
      title: event.title,
      description: event.description ?? '',
      program: event.program ?? 'feeding',
      barangay: event.barangay ?? '',
      sitio: event.sitio ?? '',
      partnerOrg: event.partnerOrg ?? '',
      location: event.location,
      eventDate: event.eventDate ? event.eventDate.split('T')[0] : '',
      startTime: event.startTime ?? '09:00',
      endTime: event.endTime ?? '12:00',
      targetChildren: event.targetChildren ?? 0,
      status: event.status,
    });
    setEditingEvent(event);
  };

  const editUpdate = <K extends keyof FormState>(k: K, v: FormState[K]) => setEditForm((f) => ({ ...f, [k]: v }));

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setEditBusy(true);
    try {
      await updateEvent(editingEvent.id, {
        ...editForm,
        eventDate: new Date(editForm.eventDate + 'T00:00:00').toISOString(),
        targetChildren: Number(editForm.targetChildren) || 0,
      });
      toast.success('Event updated', `${editForm.title} has been saved.`);
      setEditingEvent(null);
      events.reload();
    } catch (err: any) {
      toast.error('Could not update event', err?.response?.data?.error ?? 'Please try again.');
    } finally { setEditBusy(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.eventDate) {
      toast.error('Missing details', 'Title, location, and date are required.');
      return;
    }
    setBusy(true);
    try {
      const submitted = await api.post('/events', {
        ...form,
        eventDate: new Date(form.eventDate + 'T00:00:00').toISOString(),
        targetChildren: Number(form.targetChildren) || 0,
      });
      const newEventId = submitted.data?.event?._id ?? submitted.data?.event?.id;
      if (newEventId && pendingCommittees.length > 0) {
        const results = await Promise.allSettled(
          pendingCommittees.map(c => createCommittee({ eventId: newEventId, ...c }))
        );
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) toast.error(`${failed} committee(s) could not be saved`, 'You can add them in Edit event.');
      }
      toast.success('Event created', `${form.title} saved as ${form.status}.`);
      setOpen(false);
      setForm(blankForm());
      setPendingCommittees([]);
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
          {all.map((e) => <OrganizerEventCard key={e.id} event={e} onEdit={openEdit} />)}
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
          <div className="border-t border-bone-200 pt-4">
            <CommitteeDraftList drafts={pendingCommittees} onChange={setPendingCommittees} />
          </div>
          <p className="text-[11px] text-ink-500">Only organizers can create events. The backend enforces this via <code>requireRole('organizer')</code> on <code>POST /api/v1/events</code>.</p>
        </form>
      </Modal>

      {/* ── Edit Event modal ── */}
      <Modal
        open={!!editingEvent}
        onClose={() => !editBusy && setEditingEvent(null)}
        title={`Edit: ${editingEvent?.title ?? ''}`}
        size="lg"
        busy={editBusy}
        footer={(
          <>
            <button type="button" disabled={editBusy} onClick={() => setEditingEvent(null)} className="btn-ghost">Cancel</button>
            <button type="submit" form="edit-event-form" disabled={editBusy} className="btn-primary">
              {editBusy ? <><Loader2 className="animate-spin" size={14}/> Saving…</> : <>Save changes</>}
            </button>
          </>
        )}
      >
        {editingEvent && (
          <form id="edit-event-form" onSubmit={submitEdit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="label">Title</label>
                <input className="input" required value={editForm.title} onChange={(e) => editUpdate('title', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" value={editForm.description} onChange={(e) => editUpdate('description', e.target.value)} />
              </div>
              <div>
                <label className="label">Program</label>
                <select className="select" value={editForm.program} onChange={(e) => editUpdate('program', e.target.value as Program)}>
                  {PROGRAMS.map((p) => <option key={p} value={p}>{PROGRAM_LABELS[p]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="select" value={editForm.status} onChange={(e) => editUpdate('status', e.target.value as EventStatus)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" required value={editForm.eventDate} onChange={(e) => editUpdate('eventDate', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start</label>
                  <input type="time" className="input" value={editForm.startTime} onChange={(e) => editUpdate('startTime', e.target.value)} />
                </div>
                <div>
                  <label className="label">End</label>
                  <input type="time" className="input" value={editForm.endTime} onChange={(e) => editUpdate('endTime', e.target.value)} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Location</label>
                <input className="input" required value={editForm.location} onChange={(e) => editUpdate('location', e.target.value)} />
              </div>
              <div>
                <label className="label">Barangay</label>
                <input className="input" value={editForm.barangay} onChange={(e) => editUpdate('barangay', e.target.value)} />
              </div>
              <div>
                <label className="label">Sitio</label>
                <input className="input" value={editForm.sitio} onChange={(e) => editUpdate('sitio', e.target.value)} />
              </div>
              <div>
                <label className="label">Partner org (optional)</label>
                <input className="input" value={editForm.partnerOrg} onChange={(e) => editUpdate('partnerOrg', e.target.value)} />
              </div>
              <div>
                <label className="label">Target children</label>
                <input type="number" min={0} className="input" value={editForm.targetChildren} onChange={(e) => editUpdate('targetChildren', Number(e.target.value))} />
              </div>
            </div>
            <div className="border-t border-bone-200 pt-4">
              <CommitteeManager eventId={editingEvent.id} />
            </div>
            <div className="border-t border-bone-200 pt-4">
              <SupplyManager eventId={editingEvent.id} />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
