import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, HeartHandshake, CheckCircle2, Calendar, MapPin,
  Truck, Info, ShieldCheck, Send, Lock, Package,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { WizardProgress } from '../components/donate/WizardProgress';
import { Step1Events } from '../components/donate/Step1Events';
import { Step2Supplies } from '../components/donate/Step2Supplies';
import { Step3Cart } from '../components/donate/Step3Cart';
import { Step4Details } from '../components/donate/Step4Details';
import { useApi } from '../lib/useApi';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { CAN_DONATE, ROLE_INFO } from '../lib/nav';
import type { EventItem, ResourceNeed } from '../lib/types';
import { norm } from '../lib/types';
import { formatDate, pct } from '../lib/format';
import clsx from 'clsx';

export type CartItem = { resourceNeed: ResourceNeed; quantity: number };

export type DonorDetails = {
  name: string;
  contact: string;
  anonymous: boolean;
  dropoff: 'self' | 'pickup' | 'onsite';
  message: string;
};

export default function DonatePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const blockedByRole = !!user && !CAN_DONATE.includes(user.role);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const eventsRaw    = useApi<EventItem[]>('/events?status=published');
  const allResRaw    = useApi<ResourceNeed[]>('/resources');
  const events       = useMemo(() => (eventsRaw.data ?? []).map(norm).sort((a, b) => +new Date(a.eventDate) - +new Date(b.eventDate)), [eventsRaw.data]);
  const allResources = useMemo(() => (allResRaw.data ?? []).map(norm), [allResRaw.data]);

  // ── Wizard state ───────────────────────────────────────────────────────────
  const [step,          setStep]          = useState<1 | 2 | 3 | 4>(1);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [cart,          setCart]          = useState<CartItem[]>([]);
  const [details,       setDetails]       = useState<DonorDetails>({
    name: user?.fullName ?? '',
    contact: user?.email ?? '',
    anonymous: false,
    dropoff: 'self',
    message: '',
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [thanksOpen,  setThanksOpen]  = useState(false);
  const [nameError,   setNameError]   = useState('');
  const [contactError,setContactError]= useState('');

  useEffect(() => {
    if (user) setDetails((d) => ({ ...d, name: user.fullName, contact: user.email }));
  }, [user]);

  // ── Per-event resource data ────────────────────────────────────────────────
  const eventResRaw = useApi<ResourceNeed[]>(selectedEvent ? `/resources?eventId=${selectedEvent.id}` : null);
  const eventResources = useMemo(() => (eventResRaw.data ?? []).map(norm), [eventResRaw.data]);

  // ── Sidebar helpers ────────────────────────────────────────────────────────
  const openResources = useMemo(
    () => eventResources.filter((r) => r.quantityReceived < r.quantityNeeded),
    [eventResources],
  );
  const eventProgress = useMemo(() => {
    if (eventResources.length === 0) return { received: 0, needed: 0, percent: 0 };
    const received = eventResources.reduce((s, r) => s + r.quantityReceived, 0);
    const needed   = eventResources.reduce((s, r) => s + r.quantityNeeded, 0);
    return { received, needed, percent: pct(received, needed) };
  }, [eventResources]);

  // ── Cart handlers ──────────────────────────────────────────────────────────
  const addToCart = (need: ResourceNeed) => {
    setCart((prev) => {
      if (prev.some((c) => c.resourceNeed.id === need.id)) return prev;
      const remaining = need.quantityNeeded - need.quantityReceived;
      return [...prev, { resourceNeed: need, quantity: Math.max(1, Math.min(1, remaining)) }];
    });
  };

  const removeFromCart = (needId: string) => setCart((prev) => prev.filter((c) => c.resourceNeed.id !== needId));

  const updateQuantity = (needId: string, qty: number) =>
    setCart((prev) => prev.map((c) => c.resourceNeed.id === needId ? { ...c, quantity: qty } : c));

  // ── Step navigation ────────────────────────────────────────────────────────
  const goToStep2 = (ev: EventItem) => { setSelectedEvent(ev); setCart([]); setStep(2); };
  const goBack    = () => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4);

  // ── Submission ─────────────────────────────────────────────────────────────
  const askConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (!details.anonymous && !details.name.trim()) {
      setNameError('Please enter your name, or toggle anonymous donation.');
      valid = false;
    } else {
      setNameError('');
    }

    if (!details.contact.trim()) {
      setContactError('Contact is required so we can confirm receipt.');
      valid = false;
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.contact.trim());
      const isPhone = /^(\+63|0)9\d{9}$/.test(details.contact.trim());
      if (!isEmail && !isPhone) {
        setContactError('Enter a valid email or PH mobile number (09XXXXXXXXX or +639XXXXXXXXX).');
        valid = false;
      } else {
        setContactError('');
      }
    }

    if (!valid) return;
    setConfirmOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    const donorName = details.anonymous ? 'Anonymous donor' : details.name;
    let anyFailed = false;

    for (const item of cart) {
      try {
        await api.post('/resources/pledges', {
          resourceNeedId: item.resourceNeed.id,
          donorName,
          donorContact: details.contact,
          quantity: item.quantity,
          ...(details.message.trim() ? { message: details.message.trim() } : {}),
          ...(details.dropoff !== 'self' ? { dropoff: details.dropoff } : {}),
        });
      } catch (e: any) {
        anyFailed = true;
        toast.error(
          `Could not pledge ${item.resourceNeed.itemName}`,
          e?.response?.data?.error ?? 'Please try again.',
        );
      }
    }

    setSubmitting(false);

    if (!anyFailed) {
      setConfirmOpen(false);
      setThanksOpen(true);
      setCart([]);
      setDetails((d) => ({ ...d, message: '' }));
      eventResRaw.reload();
      allResRaw.reload();
    }
  };

  // ── Role gate ──────────────────────────────────────────────────────────────
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
                  <Link to="/resources" className="btn-outline btn-sm"><Package size={14} /> Browse open needs</Link>
                  {user.role === 'organizer' && (
                    <Link to="/organizer" className="btn-primary btn-sm">Back to organizer console</Link>
                  )}
                  {user.role === 'health' && (
                    <Link to="/children" className="btn-primary btn-sm">Open child monitoring</Link>
                  )}
                </div>
                <div className="mt-4 flex items-start gap-2 text-[11px] text-ink-500">
                  <Lock size={12} className="mt-0.5 shrink-0" />
                  <span>Backend also enforces this — <code>POST /api/v1/resources/pledges</code> rejects {info.label.toLowerCase()} accounts with HTTP 403.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── Step titles ────────────────────────────────────────────────────────────
  const STEP_META = [
    { title: 'Choose a visit', subtitle: 'Only showing visits that still need supplies.' },
    { title: 'Browse supplies', subtitle: selectedEvent ? `Open needs for "${selectedEvent.title}"` : '' },
    { title: 'Your pledge', subtitle: 'Adjust how much of each item you want to pledge.' },
    { title: 'Your details', subtitle: 'How should we reach you to coordinate drop-off?' },
  ] as const;
  const meta = STEP_META[step - 1];

  return (
    <div>
      <PageHeader
        eyebrow="Pledge supplies"
        title="Donate to the next Sitio Villegas visit"
        description="Four steps: pick the visit, choose supplies, set quantities, then share your contact."
      />

      <section className="container-page grid lg:grid-cols-3 gap-6 pb-16 lg:items-start">
        {/* ═══════════════════ LEFT COLUMN ═══════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Progress tracker */}
          <WizardProgress step={step} />

          {/* Step card */}
          <div className="card">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-8 w-8 grid place-items-center rounded-full bg-phthalo-500 text-milk text-sm font-semibold shrink-0">
                {step}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-phthalo-500 leading-tight">{meta.title}</h2>
                {meta.subtitle && <p className="text-xs text-ink-500 mt-0.5">{meta.subtitle}</p>}
              </div>
            </div>

            <div>
              {step === 1 && (
                <Step1Events
                  events={events}
                  allResources={allResources}
                  loading={eventsRaw.loading || allResRaw.loading}
                  onSelect={goToStep2}
                />
              )}
              {step === 2 && (
                <Step2Supplies
                  resources={eventResources}
                  loading={eventResRaw.loading}
                  cart={cart}
                  onAddToCart={addToCart}
                  onRemoveFromCart={removeFromCart}
                  onNext={() => setStep(3)}
                  onBack={goBack}
                />
              )}
              {step === 3 && (
                <Step3Cart
                  cart={cart}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                  onNext={() => setStep(4)}
                  onBack={goBack}
                />
              )}
              {step === 4 && (
                <Step4Details
                  details={details}
                  onChange={(patch) => setDetails((d) => ({ ...d, ...patch }))}
                  nameError={nameError}
                  contactError={contactError}
                  onSubmit={askConfirm}
                  onBack={goBack}
                />
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════ SIDEBAR ════════════════════ */}
        <aside className="space-y-4">
          {selectedEvent && (
            <div className="card-tight">
              <div className="eyebrow">Selected visit</div>
              <h3 className="mt-1 font-semibold text-phthalo-500 leading-snug">{selectedEvent.title}</h3>
              <ul className="mt-3 space-y-1.5 text-xs text-ink-700">
                <li className="flex gap-1.5"><Calendar size={12} className="mt-0.5 text-maximum-600" />{formatDate(selectedEvent.eventDate)} · {selectedEvent.startTime}–{selectedEvent.endTime}</li>
                <li className="flex gap-1.5"><MapPin   size={12} className="mt-0.5 text-maximum-600" />{selectedEvent.sitio || selectedEvent.location}</li>
                {selectedEvent.partnerOrg && <li className="flex gap-1.5"><HeartHandshake size={12} className="mt-0.5 text-maximum-600" />{selectedEvent.partnerOrg}</li>}
              </ul>
              <div className="mt-3 pt-3 border-t border-bone-200">
                <div className="flex items-center justify-between text-[11px] text-ink-700">
                  <span>Total supplies covered</span>
                  <span className="font-medium">{eventProgress.received} / {eventProgress.needed} ({eventProgress.percent}%)</span>
                </div>
                <ProgressBar value={eventProgress.percent} tone="maximum" />
                <p className="mt-2 text-[11px] text-ink-500">{openResources.length} of {eventResources.length} supply types still need pledges.</p>
              </div>
            </div>
          )}

          <div className="card-tight">
            <div className="flex items-center gap-2 text-phthalo-500"><Truck size={16} /><h3 className="font-semibold">Drop-off & pickup</h3></div>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              <li className="flex gap-2"><MapPin size={14} className="mt-0.5 text-maximum-600 shrink-0" /> KalingaLink desk · UPLB CSS Office, ground floor.</li>
              <li className="flex gap-2"><Calendar size={14} className="mt-0.5 text-maximum-600 shrink-0" /> Mon–Fri, 1:00–5:00 PM. Closed on UPLB holidays.</li>
              <li className="flex gap-2"><Send size={14} className="mt-0.5 text-maximum-600 shrink-0" /> Coordinate large pledges first: <span className="font-medium">(049) 536-LINK</span></li>
              <li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 text-maximum-600 shrink-0" /> You'll get a receipt confirmation when items are received on-site.</li>
            </ul>
          </div>

          <div className="card-tight bg-phthalo-500 text-milk border-phthalo-700">
            <div className="flex items-center gap-2 text-maximum-200"><ShieldCheck size={16} /><h3 className="font-semibold">Where your pledge goes</h3></div>
            <p className="mt-2 text-sm text-bone-200/90 leading-relaxed">
              Every item is logged against a specific Sitio Villegas visit and reconciled by an organizer.
              Nothing is collected for general use — pledges are tied to one supply for one visit.
            </p>
          </div>

          <div className="card-tight">
            <div className="flex items-center gap-2 text-phthalo-500"><Info size={16} /><h3 className="font-semibold">Tips for first-time donors</h3></div>
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
              {submitting ? <><Loader2 className="animate-spin" size={14} /> Recording…</> : <>Confirm pledge</>}
            </button>
          </>
        )}
      >
        <dl className="space-y-2 text-sm">
          <div className="grid grid-cols-3 gap-x-3">
            <dt className="text-ink-500">Visit</dt>
            <dd className="col-span-2 font-medium text-phthalo-500">{selectedEvent?.title ?? '—'}</dd>
          </div>
          <div className="grid grid-cols-3 gap-x-3">
            <dt className="text-ink-500">Date</dt>
            <dd className="col-span-2">{selectedEvent ? `${formatDate(selectedEvent.eventDate)} · ${selectedEvent.startTime}` : '—'}</dd>
          </div>
          <div className="grid grid-cols-3 gap-x-3">
            <dt className="text-ink-500">Donor</dt>
            <dd className="col-span-2">{details.anonymous ? 'Anonymous donor' : details.name} <span className="text-ink-500">· {details.contact}</span></dd>
          </div>
          <div className="grid grid-cols-3 gap-x-3">
            <dt className="text-ink-500">Fulfilment</dt>
            <dd className="col-span-2 capitalize">
              {details.dropoff === 'self' ? 'I will drop off' : details.dropoff === 'pickup' ? 'Please pick up' : 'Bring on visit day'}
            </dd>
          </div>
          <div className="pt-2 border-t border-bone-100">
            <dt className="text-ink-500 mb-1.5">Items pledged</dt>
            {cart.map((item) => (
              <div key={item.resourceNeed.id} className="flex justify-between text-sm py-0.5">
                <span className="text-ink-700">{item.resourceNeed.itemName}</span>
                <span className="font-medium text-phthalo-500">{item.quantity} {item.resourceNeed.unit}</span>
              </div>
            ))}
          </div>
          {details.message.trim() && (
            <div className="grid grid-cols-3 gap-x-3 pt-2 border-t border-bone-100">
              <dt className="text-ink-500">Note</dt>
              <dd className="col-span-2 italic text-ink-700">"{details.message.trim()}"</dd>
            </div>
          )}
        </dl>
      </Modal>

      {/* ─── Success modal ─── */}
      <Modal
        open={thanksOpen}
        onClose={() => { setThanksOpen(false); setStep(1); setSelectedEvent(null); }}
        title="Salamat sa iyong tulong!"
        size="sm"
        variant="success"
        footer={(
          <button className="btn-primary" onClick={() => { setThanksOpen(false); setStep(1); setSelectedEvent(null); }}>
            Done
          </button>
        )}
      >
        <div className="text-center py-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-maximum-100 grid place-items-center text-maximum-700">
            <CheckCircle2 size={24} />
          </div>
          <p className="mt-3 text-sm text-ink-700">
            Your pledge{cart.length > 1 ? 's' : ''} to <strong>{selectedEvent?.title}</strong> {cart.length > 1 ? 'are' : 'is'} recorded.
            An organizer will reach out via <strong>{details.contact}</strong> to coordinate drop-off.
          </p>
          <p className="mt-2 text-xs text-ink-500">
            You can track your pledges any time on your dashboard.
          </p>
        </div>
      </Modal>
    </div>
  );
}
