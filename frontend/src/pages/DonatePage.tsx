import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { EventItem, ResourceNeed } from '../lib/types';
import { norm, PROGRAM_LABELS } from '../lib/types';
import { pct } from '../lib/format';

export default function DonatePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const events = useApi<EventItem[]>('/events?status=published');
  const eventOptions = (events.data ?? []).map(norm);

  const [eventId, setEventId] = useState<string>(params.get('event') ?? '');
  const effectiveEventId = eventId || eventOptions[0]?.id || '';
  const resources = useApi<ResourceNeed[]>(effectiveEventId ? `/resources?eventId=${effectiveEventId}` : null);
  const resourceOptions = useMemo(
    () => (resources.data ?? []).map(norm).filter((r) => r.quantityReceived < r.quantityNeeded),
    [resources.data],
  );

  const [needId, setNeedId] = useState<string>(params.get('need') ?? '');
  const effectiveNeedId = needId || resourceOptions[0]?.id || '';
  const selectedNeed = resourceOptions.find((r) => r.id === effectiveNeedId);
  const selectedEvent = eventOptions.find((e) => e.id === effectiveEventId);

  const [donorName, setDonorName] = useState(user?.fullName ?? '');
  const [donorContact, setDonorContact] = useState(user?.email ?? '');
  const [quantity, setQuantity] = useState<number>(1);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [thanksOpen, setThanksOpen]   = useState(false);

  useEffect(() => { if (user) { setDonorName(user.fullName); setDonorContact(user.email); } }, [user]);
  useEffect(() => { setNeedId(''); }, [effectiveEventId]);

  const askConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveNeedId) { toast.error('Pick a supply', 'Choose a resource to pledge first.'); return; }
    if (!donorName.trim() || !donorContact.trim()) { toast.error('Add your contact info'); return; }
    setConfirmOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/resources/pledges', {
        resourceNeedId: effectiveNeedId,
        donorName, donorContact, quantity,
      });
      toast.success('Pledge recorded', `${quantity} ${selectedNeed?.unit ?? 'item'}(s) of ${selectedNeed?.itemName}.`);
      setConfirmOpen(false);
      setThanksOpen(true);
      setQuantity(1);
      resources.reload();
    } catch (e: any) {
      toast.error('Could not record pledge', e?.response?.data?.error ?? 'Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Donate supplies"
        title="Pledge to a real, scheduled event"
        description="Choose an upcoming Los Baños event and the supply you would like to contribute. Pledges are saved live to the database."
      />

      <section className="container-page grid md:grid-cols-3 gap-6">
        <form onSubmit={askConfirm} className="card md:col-span-2 space-y-4">
          <div>
            <label className="label">Event</label>
            <select className="select" value={effectiveEventId} onChange={(e) => setEventId(e.target.value)}>
              {eventOptions.length === 0 && <option value="">No published events</option>}
              {eventOptions.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} {ev.program ? `· ${PROGRAM_LABELS[ev.program]}` : ''} {ev.barangay ? `· Brgy. ${ev.barangay}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Supply needed</label>
            {resources.loading ? (
              <div className="text-ink-500 flex items-center gap-2 text-sm py-2"><Loader2 className="animate-spin" size={14}/> Loading supplies…</div>
            ) : resourceOptions.length === 0 ? (
              <div className="text-sm text-ink-500 py-2">All supplies for this event are fully pledged. Pick another event.</div>
            ) : (
              <select className="select" value={effectiveNeedId} onChange={(e) => setNeedId(e.target.value)}>
                {resourceOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.itemName} — needs {r.quantityNeeded - r.quantityReceived} more {r.unit}
                  </option>
                ))}
              </select>
            )}
            {selectedNeed && (
              <div className="mt-2 card-tight !p-3">
                <div className="flex items-center justify-between text-xs text-ink-700">
                  <span>{selectedNeed.quantityReceived} / {selectedNeed.quantityNeeded} {selectedNeed.unit} pledged so far</span>
                  <span>{pct(selectedNeed.quantityReceived, selectedNeed.quantityNeeded)}%</span>
                </div>
                <ProgressBar value={pct(selectedNeed.quantityReceived, selectedNeed.quantityNeeded)} tone="maximum" />
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Your name</label>
              <input className="input" required value={donorName} onChange={(e) => setDonorName(e.target.value)} />
            </div>
            <div>
              <label className="label">Contact (email or phone)</label>
              <input className="input" required value={donorContact} onChange={(e) => setDonorContact(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Quantity ({selectedNeed?.unit ?? 'units'})</label>
            <input type="number" min={1} className="input" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
          </div>

          <button type="submit" disabled={!effectiveNeedId} className="btn-primary w-full justify-center">
            <HeartHandshake size={16}/> Review pledge
          </button>
        </form>

        <aside className="card-tight">
          <h3 className="font-semibold text-phthalo-500">Where pledges go</h3>
          <p className="mt-2 text-sm text-ink-700">
            Every pledge is tied to a scheduled feeding, health, learning, environment, livelihood or youth event in
            Los Baños — managed by KalingaLink organizers and tracked in our shared database.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            <li>• In-kind drop-offs welcome at UPLB CSS office</li>
            <li>• Coordinate large pledges with an organizer first</li>
            <li>• You will receive a confirmation when items are received</li>
          </ul>
        </aside>
      </section>

      {/* ─── Confirm pledge modal ─── */}
      <Modal
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        title="Confirm your pledge"
        size="sm"
        footer={(
          <>
            <button className="btn-ghost" onClick={() => setConfirmOpen(false)} disabled={submitting}>Cancel</button>
            <button className="btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? <><Loader2 className="animate-spin" size={14}/> Recording…</> : <>Confirm pledge</>}
            </button>
          </>
        )}
      >
        <dl className="grid grid-cols-3 gap-y-2 text-sm">
          <dt className="text-ink-500">Event</dt><dd className="col-span-2 font-medium text-phthalo-500">{selectedEvent?.title ?? '—'}</dd>
          <dt className="text-ink-500">Supply</dt><dd className="col-span-2">{selectedNeed?.itemName ?? '—'}</dd>
          <dt className="text-ink-500">Quantity</dt><dd className="col-span-2">{quantity} {selectedNeed?.unit}</dd>
          <dt className="text-ink-500">Donor</dt><dd className="col-span-2">{donorName} · <span className="text-ink-500">{donorContact}</span></dd>
        </dl>
      </Modal>

      {/* ─── Success modal ─── */}
      <Modal
        open={thanksOpen}
        onClose={() => setThanksOpen(false)}
        title="Salamat!"
        size="sm"
        footer={<button className="btn-primary" onClick={() => setThanksOpen(false)}>Done</button>}
      >
        <div className="text-center py-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-maximum-100 grid place-items-center text-maximum-700">
            <CheckCircle2 size={24} />
          </div>
          <p className="mt-3 text-sm text-ink-700">
            Your pledge to <strong>{selectedEvent?.title}</strong> is recorded. An organizer will reach out to coordinate drop-off.
          </p>
        </div>
      </Modal>
    </div>
  );
}
