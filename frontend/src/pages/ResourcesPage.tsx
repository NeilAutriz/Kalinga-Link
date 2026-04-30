import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, Calendar, MapPin, HeartHandshake, Search, Filter,
  Apple, Soup, Brush, Pill, Wrench, Truck, Package,
} from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { EmptyState } from '../components/EmptyState';
import { useApi } from '../lib/useApi';
import type { EventItem, ResourceCategory, ResourceNeed } from '../lib/types';
import { norm, PROGRAM_LABELS } from '../lib/types';
import { formatDate, pct } from '../lib/format';

const CATEGORY_ICON: Record<ResourceCategory, typeof Apple> = {
  food: Soup, utensils: Apple, art: Brush, hygiene: Pill,
  equipment: Wrench, transport: Truck, other: Package,
};
const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  food: 'Food', utensils: 'Utensils', art: 'Art / books', hygiene: 'Hygiene',
  equipment: 'Equipment', transport: 'Transport', other: 'Other',
};
const CATEGORIES: (ResourceCategory | 'all')[] = ['all', 'food', 'utensils', 'hygiene', 'art', 'equipment', 'transport', 'other'];
const STATUSES = [
  { v: 'all',    label: 'All needs' },
  { v: 'urgent', label: 'Most needed' },
  { v: 'open',   label: 'Open' },
  { v: 'done',   label: 'Fully pledged' },
] as const;

export default function ResourcesPage() {
  const events = useApi<EventItem[]>('/events?status=published');
  const eventOptions = useMemo(
    () => (events.data ?? []).map(norm).sort((a, b) => +new Date(a.eventDate) - +new Date(b.eventDate)),
    [events.data],
  );

  const [eventId, setEventId]   = useState<string>('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('all');
  const [status, setStatus]     = useState<(typeof STATUSES)[number]['v']>('all');
  const [q, setQ]               = useState('');

  const effectiveId = eventId || eventOptions[0]?.id || '';
  const selectedEvent = eventOptions.find((e) => e.id === effectiveId);
  const path = effectiveId ? `/resources?eventId=${effectiveId}` : null;
  const resources = useApi<ResourceNeed[]>(path);

  const items = useMemo(() => {
    const all = (resources.data ?? []).map(norm);
    return all.filter((r) => {
      if (category !== 'all' && r.category !== category) return false;
      const remaining = r.quantityNeeded - r.quantityReceived;
      const ratio = r.quantityNeeded ? remaining / r.quantityNeeded : 0;
      if (status === 'urgent' && !(remaining > 0 && ratio > 0.5)) return false;
      if (status === 'open'   && remaining <= 0) return false;
      if (status === 'done'   && remaining > 0)  return false;
      if (q && !r.itemName.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [resources.data, category, status, q]);

  const totals = useMemo(() => {
    const all = (resources.data ?? []).map(norm);
    const received = all.reduce((s, r) => s + r.quantityReceived, 0);
    const needed   = all.reduce((s, r) => s + r.quantityNeeded, 0);
    const open     = all.filter((r) => r.quantityReceived < r.quantityNeeded).length;
    return { received, needed, open, count: all.length, percent: pct(received, needed) };
  }, [resources.data]);

  return (
    <div>
      <PageHeader
        eyebrow="Open resource needs"
        title="What we need this cycle"
        description="Donations of food, supplies, books, art materials, and equipment go directly to the next monthly visit at Sitio Villegas, Brgy. Putho-Tuntungin."
        actions={<Link to="/donate" className="btn-primary"><HeartHandshake size={16}/> Make a pledge</Link>}
      />

      <section className="container-page space-y-6 pb-16">
        {/* ─── Visit picker ─── */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="eyebrow">Showing supplies for</div>
              <h2 className="text-lg font-semibold text-phthalo-500">{selectedEvent?.title ?? 'Select a visit'}</h2>
              {selectedEvent && (
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                  <span className="flex items-center gap-1.5"><Calendar size={12} className="text-maximum-600"/>{formatDate(selectedEvent.eventDate)} · {selectedEvent.startTime}</span>
                  <span className="flex items-center gap-1.5"><MapPin   size={12} className="text-maximum-600"/>{selectedEvent.sitio || selectedEvent.location}</span>
                  {selectedEvent.program && <span className="badge-bone !text-[10px]">{PROGRAM_LABELS[selectedEvent.program]}</span>}
                </div>
              )}
            </div>
            <Link to={effectiveId ? `/events/${effectiveId}` : '/events'} className="btn-outline btn-sm">View visit</Link>
          </div>

          {events.loading && <div className="text-sm text-ink-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Loading visits…</div>}
          {!events.loading && eventOptions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {eventOptions.map((ev) => {
                const active = ev.id === effectiveId;
                return (
                  <button key={ev.id} type="button" onClick={() => setEventId(ev.id)}
                    className={clsx(
                      'shrink-0 max-w-[260px] text-left rounded-xl border px-3 py-2 transition',
                      active ? 'border-maximum-500 bg-maximum-50 shadow-soft' : 'border-bone-200 bg-milk hover:border-maximum-300',
                    )}>
                    <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-maximum-600">
                      {ev.program ? PROGRAM_LABELS[ev.program] : 'Visit'}
                    </div>
                    <div className="text-sm font-semibold text-phthalo-500 leading-snug line-clamp-2">{ev.title}</div>
                    <div className="text-[11px] text-ink-500 mt-0.5">{formatDate(ev.eventDate)}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Visit progress summary */}
          {!resources.loading && totals.count > 0 && (
            <div className="rounded-xl border border-bone-200 bg-bone-50 p-4">
              <div className="flex items-center justify-between text-xs text-ink-700">
                <span><strong>{totals.open}</strong> of {totals.count} supplies still need pledges</span>
                <span className="font-medium">{totals.received} / {totals.needed} units · {totals.percent}%</span>
              </div>
              <div className="mt-2"><ProgressBar value={totals.percent} tone="maximum" /></div>
            </div>
          )}
        </div>

        {/* ─── Filters ─── */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 text-phthalo-500">
            <Filter size={16}/>
            <h3 className="font-semibold">Filter supplies</h3>
          </div>

          <div className="grid md:grid-cols-[1fr_auto] gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/>
              <input
                className="input !pl-9"
                placeholder="Search items (e.g. rice, notebook, alcohol)…"
                value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button key={s.v} type="button" onClick={() => setStatus(s.v)}
                  className={clsx('badge cursor-pointer !text-[11px] !py-1.5 !px-3',
                    status === s.v ? 'bg-phthalo-500 text-milk' : 'bg-bone-100 text-ink-700 hover:bg-bone-200')}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const Icon = c === 'all' ? Package : CATEGORY_ICON[c as ResourceCategory];
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={clsx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition',
                    category === c
                      ? 'border-maximum-500 bg-maximum-50 text-maximum-700'
                      : 'border-bone-200 bg-milk text-ink-700 hover:border-maximum-300')}>
                  <Icon size={12}/>
                  {c === 'all' ? 'All categories' : CATEGORY_LABEL[c as ResourceCategory]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Results ─── */}
        <div>
          {resources.loading && (
            <div className="flex items-center gap-2 text-ink-500 py-6"><Loader2 className="animate-spin" size={16}/> Loading supplies…</div>
          )}
          {resources.error && <EmptyState title="Could not load resources" description={resources.error} />}
          {!resources.loading && !resources.error && items.length === 0 && (
            <EmptyState title="No matching supplies" description="Try clearing filters or pick a different visit." />
          )}
          {!resources.loading && !resources.error && items.length > 0 && (
            <>
              <div className="mb-3 text-xs text-ink-500">{items.length} of {totals.count} supplies shown</div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((r) => <ResourceCard key={r.id} r={r} eventId={effectiveId} />)}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/* ───────────── Resource card ───────────── */
function ResourceCard({ r, eventId }: { r: ResourceNeed; eventId: string }) {
  const Icon = CATEGORY_ICON[r.category];
  const remaining = Math.max(0, r.quantityNeeded - r.quantityReceived);
  const percent = pct(r.quantityReceived, r.quantityNeeded);
  const done = remaining === 0;
  const ratio = r.quantityNeeded ? remaining / r.quantityNeeded : 0;
  const badge =
    done                              ? { label: 'Fully pledged', cls: 'badge-green' }
    : r.quantityReceived === 0        ? { label: 'Not yet pledged', cls: 'badge-warn' }
    : ratio > 0.5                     ? { label: 'Most needed', cls: 'badge-danger' }
    : ratio < 0.25                    ? { label: 'Almost complete', cls: 'badge-info' }
    :                                   { label: 'In progress', cls: 'badge-bone' };

  return (
    <div className="card-tight flex flex-col gap-3 h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-maximum-50 text-maximum-700 shrink-0">
            <Icon size={18}/>
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-phthalo-500 leading-snug line-clamp-2">{r.itemName}</div>
            <div className="text-[11px] text-ink-500 mt-0.5">{CATEGORY_LABEL[r.category]}</div>
          </div>
        </div>
        <span className={clsx(badge.cls, '!text-[10px] shrink-0')}>{badge.label}</span>
      </div>

      <div className="space-y-1.5 mt-auto">
        <div className="flex items-center justify-between text-[11px] text-ink-700">
          <span>{r.quantityReceived} / {r.quantityNeeded} {r.unit}</span>
          <span className="text-maximum-700 font-medium">{remaining} {r.unit} left</span>
        </div>
        <ProgressBar value={percent} tone={done ? 'phthalo' : 'maximum'} />
      </div>

      <div className="pt-1">
        {done ? (
          <span className="text-xs text-maximum-700 font-medium">Salamat — fully pledged!</span>
        ) : (
          <Link to={`/donate?event=${eventId}&need=${r.id}`} className="btn-outline btn-sm w-full justify-center">
            <HeartHandshake size={14}/> Pledge this
          </Link>
        )}
      </div>
    </div>
  );
}
