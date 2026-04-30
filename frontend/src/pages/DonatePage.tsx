import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Loader2, HeartHandshake, CheckCircle2, Calendar, MapPin, Sparkles,
  Utensils, Stethoscope, BookOpen, Leaf, Briefcase, Palette,
  Apple, Soup, Pill, Brush, Wrench, Truck, Package, Minus, Plus,
  Info, ShieldCheck, Send, Lock,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { CAN_DONATE, ROLE_INFO } from '../lib/nav';
import type { EventItem, ResourceCategory, ResourceNeed, Program } from '../lib/types';
import { norm, PROGRAM_LABELS } from '../lib/types';
import { formatDate, pct } from '../lib/format';
import clsx from 'clsx';

/* ───────────── icon maps ───────────── */
const PROGRAM_ICON: Record<Program, typeof Utensils> = {
  feeding: Utensils, health: Stethoscope, learning: BookOpen,
  environment: Leaf,  livelihood: Briefcase, youth: Palette,
};
const CATEGORY_ICON: Record<ResourceCategory, typeof Apple> = {
  food: Soup, utensils: Apple, art: Brush, hygiene: Pill,
  equipment: Wrench, transport: Truck, other: Package,
};
const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  food: 'Food', utensils: 'Utensils', art: 'Art / books', hygiene: 'Hygiene',
  equipment: 'Equipment', transport: 'Transport', other: 'Other',
};

/* ───────────── helpers ───────────── */
const urgencyFor = (r: ResourceNeed): { label: string; cls: string } => {
  const remaining = r.quantityNeeded - r.quantityReceived;
  if (remaining <= 0)                            return { label: 'Fully pledged', cls: 'badge-bone' };
  if (r.quantityReceived === 0)                  return { label: 'Not yet pledged', cls: 'badge-warn' };
  if (remaining / r.quantityNeeded < 0.25)       return { label: 'Almost complete', cls: 'badge-info' };
  if (remaining / r.quantityNeeded > 0.7)        return { label: 'Most needed', cls: 'badge-danger' };
  return { label: 'In progress', cls: 'badge-green' };
};

export default function DonatePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();

  // Role gate: signed-in organizers and health partners cannot pledge.
  // Anonymous (signed-out) visitors are still welcome to donate.
  const blockedByRole = !!user && !CAN_DONATE.includes(user.role);

  const events = useApi<EventItem[]>('/events?status=published');
  const eventOptions = (events.data ?? [])
    .map(norm)
    .sort((a, b) => +new Date(a.eventDate) - +new Date(b.eventDate));

  const [eventId, setEventId] = useState<string>(params.get('event') ?? '');
  const effectiveEventId = eventId || eventOptions[0]?.id || '';
  const selectedEvent = eventOptions.find((e) => e.id === effectiveEventId);

  const resources = useApi<ResourceNeed[]>(effectiveEventId ? `/resources?eventId=${effectiveEventId}` : null);
  const allResources = useMemo(() => (resources.data ?? []).map(norm), [resources.data]);
  const openResources = useMemo(
    () => allResources.filter((r) => r.quantityReceived < r.quantityNeeded),
    [allResources],
  );

  const [needId, setNeedId] = useState<string>(params.get('need') ?? '');
  const effectiveNeedId = needId || openResources[0]?.id || '';
  const selectedNeed = allResources.find((r) => r.id === effectiveNeedId);
  const remaining = selectedNeed ? Math.max(0, selectedNeed.quantityNeeded - selectedNeed.quantityReceived) : 0;

  const [donorName,    setDonorName]    = useState(user?.fullName ?? '');
  const [donorContact, setDonorContact] = useState(user?.email ?? '');
  const [anonymous,    setAnonymous]    = useState(false);
  const [message,      setMessage]      = useState('');
  const [quantity,     setQuantity]     = useState<number>(1);
  const [dropoff,      setDropoff]      = useState<'self' | 'pickup' | 'onsite'>('self');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [thanksOpen,  setThanksOpen]  = useState(false);

  useEffect(() => { if (user) { setDonorName(user.fullName); setDonorContact(user.email); } }, [user]);
  // Reset supply choice & quantity whenever event changes
  useEffect(() => { setNeedId(''); setQuantity(1); }, [effectiveEventId]);
  // Clamp quantity to remaining
  useEffect(() => { if (remaining > 0 && quantity > remaining) setQuantity(remaining); }, [remaining, quantity]);

  const askConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveEventId)              return toast.error('Pick a visit', 'Choose an upcoming Sitio Villegas visit first.');
    if (!effectiveNeedId)               return toast.error('Pick a supply', 'Choose a resource to pledge.');
    if (quantity < 1)                   return toast.error('Quantity must be at least 1');
    if (!anonymous && !donorName.trim()) return toast.error('Add your name', 'Or toggle anonymous donation.');
    if (!donorContact.trim())            return toast.error('Add your contact info', 'So we can confirm receipt.');
    setConfirmOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/resources/pledges', {
        resourceNeedId: effectiveNeedId,
        donorName: anonymous ? 'Anonymous donor' : donorName,
        donorContact,
        quantity,
        ...(message.trim() ? { message: message.trim() } : {}),
        ...(dropoff !== 'self' ? { dropoff } : {}),
      });
      toast.success('Pledge recorded', `${quantity} ${selectedNeed?.unit ?? 'item'}(s) of ${selectedNeed?.itemName}.`);
      setConfirmOpen(false);
      setThanksOpen(true);
      setQuantity(1);
      setMessage('');
      resources.reload();
    } catch (e: any) {
      toast.error('Could not record pledge', e?.response?.data?.error ?? 'Please try again.');
    } finally { setSubmitting(false); }
  };

  const eventProgress = useMemo(() => {
    if (allResources.length === 0) return { received: 0, needed: 0, percent: 0 };
    const received = allResources.reduce((s, r) => s + r.quantityReceived, 0);
    const needed   = allResources.reduce((s, r) => s + r.quantityNeeded, 0);
    return { received, needed, percent: pct(received, needed) };
  }, [allResources]);

  // Role-gated explainer: shown to signed-in organizers / health partners
  // instead of the donate form. They can still browse needs via /resources.
  if (blockedByRole && user) {
    const info = ROLE_INFO[user.role];
    const Icon = info.icon;
    return (
      <div>
        <PageHeader
          eyebrow="Pledge supplies"
          title="This page is for donors and volunteers"
          description="Your role coordinates the program — pledging is reserved for donor (and volunteer) accounts so dashboards stay clean."
        />
        <section className="container-page max-w-2xl pb-16">
          <div className="card">
            <div className="flex items-start gap-3">
              <div className={clsx('h-11 w-11 grid place-items-center rounded-xl shrink-0', info.chipClass)}>
                <Icon size={20} aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-phthalo-500">You're signed in as a {info.label}</div>
                <div className="text-xs uppercase tracking-[0.12em] text-maximum-600 mt-0.5">{info.tagline}</div>
                <p className="mt-3 text-sm text-ink-700 leading-relaxed">
                  {user.role === 'organizer'
                    ? 'Organizers manage which supplies are needed and confirm receipt — they do not pledge through their organizer account. If you want to give personally, sign out and donate as a guest, or use a separate donor account.'
                    : 'Health partners are recorded as event partners and focus on child monitoring. Pledging supplies is handled by donor and volunteer accounts.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/resources" className="btn-outline btn-sm"><Package size={14}/> Browse open needs</Link>
                  {user.role === 'organizer' && (
                    <Link to="/organizer" className="btn-primary btn-sm">Back to organizer console</Link>
                  )}
                  {user.role === 'health' && (
                    <Link to="/children" className="btn-primary btn-sm">Open child monitoring</Link>
                  )}
                </div>
                <div className="mt-4 flex items-start gap-2 text-[11px] text-ink-500">
                  <Lock size={12} className="mt-0.5 shrink-0"/>
                  <span>Backend also enforces this — <code>POST /api/v1/resources/pledges</code> rejects {info.label.toLowerCase()} accounts with HTTP 403.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Pledge supplies"
        title="Donate to the next Sitio Villegas visit"
        description="Three quick steps: pick the visit, pick the supply, share your contact. Pledges are saved to the database and an organizer follows up to coordinate drop-off."
      />

      <section className="container-page grid lg:grid-cols-3 gap-6 pb-16">
        {/* ═══════════════════ FORM ═══════════════════ */}
        <form onSubmit={askConfirm} className="lg:col-span-2 space-y-6">
          {/* Step 1 — Visit */}
          <Step number={1} title="Choose a visit" subtitle={selectedEvent ? `${formatDate(selectedEvent.eventDate)} · ${selectedEvent.startTime}` : 'Pick from currently published Sitio Villegas visits.'}>
            {events.loading && <LoaderRow text="Loading visits…" />}
            {!events.loading && eventOptions.length === 0 && (
              <p className="text-sm text-ink-500 py-2">No published visits at the moment. Please check back soon.</p>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {eventOptions.map((ev) => {
                const Icon = ev.program ? PROGRAM_ICON[ev.program] : Sparkles;
                const active = ev.id === effectiveEventId;
                return (
                  <button
                    type="button"
                    key={ev.id}
                    onClick={() => setEventId(ev.id)}
                    className={clsx(
                      'text-left rounded-2xl border p-4 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-maximum-100',
                      active
                        ? 'border-maximum-500 bg-maximum-50 shadow-soft'
                        : 'border-bone-200 bg-milk hover:border-maximum-300',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={clsx('h-9 w-9 grid place-items-center rounded-xl shrink-0',
                        active ? 'bg-maximum-100 text-maximum-700' : 'bg-phthalo-50 text-phthalo-500')}>
                        <Icon size={18}/>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-maximum-600">
                          {ev.program ? PROGRAM_LABELS[ev.program] : 'Visit'}
                        </div>
                        <div className="text-sm font-semibold text-phthalo-500 leading-snug line-clamp-2">{ev.title}</div>
                        <div className="mt-1 text-[11px] text-ink-500 flex items-center gap-1.5"><Calendar size={11}/>{formatDate(ev.eventDate)}</div>
                        <div className="text-[11px] text-ink-500 flex items-center gap-1.5"><MapPin size={11}/>{ev.sitio || ev.location}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Step>

          {/* Step 2 — Supply */}
          <Step number={2} title="Choose a supply to pledge" subtitle={selectedEvent ? `Open needs for "${selectedEvent.title}"` : 'Pick a visit first.'}>
            {resources.loading && <LoaderRow text="Loading supplies…" />}
            {!resources.loading && openResources.length === 0 && (
              <p className="text-sm text-ink-500 py-2">All supplies for this visit are fully pledged. Pick another visit or check back later.</p>
            )}
            {!resources.loading && openResources.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {openResources.map((r) => {
                  const Icon = CATEGORY_ICON[r.category];
                  const active = r.id === effectiveNeedId;
                  const u = urgencyFor(r);
                  const left = r.quantityNeeded - r.quantityReceived;
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => { setNeedId(r.id); setQuantity(Math.min(quantity || 1, left)); }}
                      className={clsx(
                        'text-left rounded-2xl border p-4 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-maximum-100',
                        active
                          ? 'border-maximum-500 bg-maximum-50 shadow-soft'
                          : 'border-bone-200 bg-milk hover:border-maximum-300',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={clsx('h-9 w-9 grid place-items-center rounded-xl shrink-0',
                          active ? 'bg-maximum-100 text-maximum-700' : 'bg-bone-100 text-ink-700')}>
                          <Icon size={18}/>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-semibold text-phthalo-500 leading-snug">{r.itemName}</div>
                            <span className={clsx(u.cls, '!text-[10px] !py-0.5 shrink-0')}>{u.label}</span>
                          </div>
                          <div className="text-[11px] text-ink-500 mt-0.5">{CATEGORY_LABEL[r.category]}</div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-700">
                            <span>{r.quantityReceived} / {r.quantityNeeded} {r.unit}</span>
                            <span className="text-maximum-700 font-medium">{left} {r.unit} left</span>
                          </div>
                          <ProgressBar value={pct(r.quantityReceived, r.quantityNeeded)} tone="maximum" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Step>

          {/* Step 3 — Quantity & details */}
          <Step number={3} title="How much, and how should we reach you?" subtitle="Quantity, contact, and any note for the organizers.">
            <div className="space-y-6">
              {/* Quantity stepper */}
              <div>
                <label className="label">Quantity ({selectedNeed?.unit ?? 'units'})</label>
                <div className="flex flex-wrap items-stretch gap-2">
                  <button type="button" className="btn-outline !px-3" disabled={!selectedNeed || quantity <= 1}
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                    <Minus size={14}/>
                  </button>
                  <input
                    type="number" min={1} max={remaining || undefined}
                    className="input text-center !w-24"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(remaining || Infinity, Number(e.target.value) || 1)))}
                    disabled={!selectedNeed}
                  />
                  <button type="button" className="btn-outline !px-3" disabled={!selectedNeed || (remaining > 0 && quantity >= remaining)}
                          onClick={() => setQuantity((q) => Math.min(remaining || Infinity, q + 1))}>
                    <Plus size={14}/>
                  </button>
                  {selectedNeed && remaining > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 ml-1">
                      {[1, Math.ceil(remaining / 4), Math.ceil(remaining / 2), remaining]
                        .filter((v, i, a) => v >= 1 && a.indexOf(v) === i)
                        .map((v) => (
                          <button key={v} type="button"
                                  onClick={() => setQuantity(v)}
                                  className={clsx('badge cursor-pointer !text-[11px] !py-1',
                                    quantity === v ? 'bg-phthalo-500 text-milk' : 'bg-bone-100 text-ink-700 hover:bg-bone-200')}>
                            {v === remaining ? `All (${v})` : v}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                {selectedNeed && (
                  <p className="mt-2 text-xs text-ink-500">
                    You can pledge up to <strong>{remaining} {selectedNeed.unit}</strong>. We will record any partial fulfilment when items arrive.
                  </p>
                )}
              </div>

              {/* Donor identity */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Your name</label>
                  <input
                    className="input" required={!anonymous} disabled={anonymous}
                    placeholder={anonymous ? 'Anonymous donor' : 'Juana Dela Cruz'}
                    value={anonymous ? '' : donorName}
                    onChange={(e) => setDonorName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Contact (email or mobile)</label>
                  <input
                    className="input" required type="text"
                    placeholder="you@example.com  ·  09xx xxx xxxx"
                    value={donorContact}
                    onChange={(e) => setDonorContact(e.target.value)} />
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-ink-700 leading-snug">
                <input type="checkbox" className="checkbox mt-0.5 shrink-0" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
                <span>Show me as <strong>Anonymous donor</strong> publicly (organizers still need your contact for receipt).</span>
              </label>

              {/* Drop-off preference */}
              <div>
                <label className="label">How will you fulfil the pledge?</label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {([
                    { v: 'self',   t: 'I will drop off',   d: 'At UPLB CSS office, weekday afternoons.' },
                    { v: 'pickup', t: 'Please pick up',    d: 'Within Los Baños only. Coordinate via call.' },
                    { v: 'onsite', t: 'Bring on visit day', d: 'Hand over directly at Sitio Villegas court.' },
                  ] as const).map((o) => (
                    <button key={o.v} type="button" onClick={() => setDropoff(o.v)}
                      className={clsx('text-left rounded-xl border p-4 transition',
                        dropoff === o.v
                          ? 'border-maximum-500 bg-maximum-50'
                          : 'border-bone-200 bg-milk hover:border-maximum-300')}>
                      <div className="text-sm font-semibold text-phthalo-500 leading-tight">{o.t}</div>
                      <div className="text-[11px] text-ink-500 mt-1.5 leading-relaxed">{o.d}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional message */}
              <div>
                <label className="label">Message to organizers <span className="text-ink-400 font-normal">(optional)</span></label>
                <textarea
                  rows={3} cols={1}
                  className="textarea block w-full"
                  placeholder="e.g. I can drop off Saturday morning. Brand of rice is Sinandomeng."
                  value={message} onChange={(e) => setMessage(e.target.value.slice(0, 280))} />
                <div className="mt-1 flex justify-end text-[11px] text-ink-400">{message.length}/280</div>
              </div>

              <button type="submit" disabled={!effectiveNeedId || !selectedEvent} className="btn-primary w-full justify-center">
                <HeartHandshake size={16}/> Review & confirm pledge
              </button>
            </div>
          </Step>
        </form>

        {/* ════════════════════ SIDEBAR ════════════════════ */}
        <aside className="space-y-4">
          {/* Visit summary */}
          {selectedEvent && (
            <div className="card-tight">
              <div className="eyebrow">Selected visit</div>
              <h3 className="mt-1 font-semibold text-phthalo-500 leading-snug">{selectedEvent.title}</h3>
              <ul className="mt-3 space-y-1.5 text-xs text-ink-700">
                <li className="flex gap-1.5"><Calendar size={12} className="mt-0.5 text-maximum-600"/>{formatDate(selectedEvent.eventDate)} · {selectedEvent.startTime}–{selectedEvent.endTime}</li>
                <li className="flex gap-1.5"><MapPin   size={12} className="mt-0.5 text-maximum-600"/>{selectedEvent.sitio || selectedEvent.location}</li>
                {selectedEvent.partnerOrg && <li className="flex gap-1.5"><HeartHandshake size={12} className="mt-0.5 text-maximum-600"/>{selectedEvent.partnerOrg}</li>}
              </ul>

              <div className="mt-3 pt-3 border-t border-bone-200">
                <div className="flex items-center justify-between text-[11px] text-ink-700">
                  <span>Total supplies covered</span>
                  <span className="font-medium">{eventProgress.received} / {eventProgress.needed} ({eventProgress.percent}%)</span>
                </div>
                <ProgressBar value={eventProgress.percent} tone="maximum" />
                <p className="mt-2 text-[11px] text-ink-500">{openResources.length} of {allResources.length} supply types still need pledges.</p>
              </div>
            </div>
          )}

          {/* Drop-off info */}
          <div className="card-tight">
            <div className="flex items-center gap-2 text-phthalo-500"><Truck size={16}/><h3 className="font-semibold">Drop-off & pickup</h3></div>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              <li className="flex gap-2"><MapPin size={14} className="mt-0.5 text-maximum-600 shrink-0"/> KalingaLink desk · UPLB CSS Office, ground floor.</li>
              <li className="flex gap-2"><Calendar size={14} className="mt-0.5 text-maximum-600 shrink-0"/> Mon–Fri, 1:00–5:00 PM. Closed on UPLB holidays.</li>
              <li className="flex gap-2"><Send size={14} className="mt-0.5 text-maximum-600 shrink-0"/> Coordinate large pledges first: <span className="font-medium">(049) 536-LINK</span></li>
              <li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 text-maximum-600 shrink-0"/> You'll get a receipt confirmation when items are received on-site.</li>
            </ul>
          </div>

          {/* Trust note */}
          <div className="card-tight bg-phthalo-500 text-milk border-phthalo-700">
            <div className="flex items-center gap-2 text-maximum-200"><ShieldCheck size={16}/><h3 className="font-semibold">Where your pledge goes</h3></div>
            <p className="mt-2 text-sm text-bone-200/90 leading-relaxed">
              Every item is logged against a specific Sitio Villegas visit and reconciled by an organizer.
              Nothing is collected for general use — pledges are tied to one supply for one visit.
            </p>
          </div>

          {/* Tips */}
          <div className="card-tight">
            <div className="flex items-center gap-2 text-phthalo-500"><Info size={16}/><h3 className="font-semibold">Tips for first-time donors</h3></div>
            <ul className="mt-3 space-y-1.5 text-xs text-ink-700">
              <li>• Smaller, frequent pledges (1–3 kg of rice, 5 hygiene kits) are easier to combine than one large pledge.</li>
              <li>• Perishable food: please coordinate so we can prep cold storage.</li>
              <li>• Books & art supplies: gently used is welcome.</li>
            </ul>
          </div>
        </aside>
      </section>

      {/* ─── Confirm pledge modal ─── */}
      <Modal
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        title="Confirm your pledge"
        size="md"
        variant="info"
        footer={(
          <>
            <button className="btn-ghost" onClick={() => setConfirmOpen(false)} disabled={submitting}>Back to edit</button>
            <button className="btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? <><Loader2 className="animate-spin" size={14}/> Recording…</> : <>Confirm pledge</>}
            </button>
          </>
        )}
      >
        <dl className="grid grid-cols-3 gap-y-2 gap-x-3 text-sm">
          <dt className="text-ink-500">Visit</dt>
          <dd className="col-span-2 font-medium text-phthalo-500">{selectedEvent?.title ?? '—'}</dd>

          <dt className="text-ink-500">Date</dt>
          <dd className="col-span-2">{selectedEvent ? `${formatDate(selectedEvent.eventDate)} · ${selectedEvent.startTime}` : '—'}</dd>

          <dt className="text-ink-500">Supply</dt>
          <dd className="col-span-2">{selectedNeed?.itemName ?? '—'} <span className="text-ink-500">({CATEGORY_LABEL[selectedNeed?.category ?? 'other']})</span></dd>

          <dt className="text-ink-500">Quantity</dt>
          <dd className="col-span-2 font-medium">{quantity} {selectedNeed?.unit}</dd>

          <dt className="text-ink-500">Donor</dt>
          <dd className="col-span-2">{anonymous ? 'Anonymous donor' : donorName} <span className="text-ink-500">· {donorContact}</span></dd>

          <dt className="text-ink-500">Fulfilment</dt>
          <dd className="col-span-2 capitalize">{dropoff === 'self' ? 'I will drop off' : dropoff === 'pickup' ? 'Please pick up' : 'Bring on visit day'}</dd>

          {message.trim() && (<>
            <dt className="text-ink-500">Note</dt>
            <dd className="col-span-2 italic text-ink-700">"{message.trim()}"</dd>
          </>)}
        </dl>
      </Modal>

      {/* ─── Success modal ─── */}
      <Modal
        open={thanksOpen}
        onClose={() => setThanksOpen(false)}
        title="Salamat sa iyong tulong!"
        size="sm"
        variant="success"
        footer={<button className="btn-primary" onClick={() => setThanksOpen(false)}>Done</button>}
      >
        <div className="text-center py-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-maximum-100 grid place-items-center text-maximum-700">
            <CheckCircle2 size={24} />
          </div>
          <p className="mt-3 text-sm text-ink-700">
            Your pledge to <strong>{selectedEvent?.title}</strong> is recorded.
            An organizer will reach out via <strong>{donorContact}</strong> to coordinate drop-off.
          </p>
          <p className="mt-2 text-xs text-ink-500">
            You can track your pledges any time on your dashboard.
          </p>
        </div>
      </Modal>
    </div>
  );
}

/* ───────────── small helpers ───────────── */
function Step({ number, title, subtitle, children }: { number: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 grid place-items-center rounded-full bg-phthalo-500 text-milk text-sm font-semibold shrink-0">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-phthalo-500 leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function LoaderRow({ text }: { text: string }) {
  return <div className="text-ink-500 flex items-center gap-2 text-sm py-2"><Loader2 className="animate-spin" size={14}/> {text}</div>;
}
