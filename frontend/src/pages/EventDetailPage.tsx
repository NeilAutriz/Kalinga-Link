import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users, Building2, Loader2, ArrowLeft, UserPlus, Share2, Copy, Lock, HeartHandshake, XCircle } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { CommitteeCard } from '../components/CommitteeCard';
import { ResourceItem } from '../components/ResourceItem';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal, ConfirmModal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { Committee, EventItem, ResourceNeed } from '../lib/types';
import { norm, PROGRAM_LABELS, PROGRAM_TONES } from '../lib/types';
import { CAN_VOLUNTEER, CAN_DONATE } from '../lib/nav';
import { formatDate } from '../lib/format';

type MySignup = {
  _id: string;
  status: string;
  committee?: { _id: string };
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: ev, loading: eLoading, error: eError } = useApi<EventItem>(id ? `/events/${id}` : null);
  const committees = useApi<Committee[]>(id ? `/committees?eventId=${id}` : null);
  const resources  = useApi<ResourceNeed[]>(id ? `/resources?eventId=${id}` : null);
  const mySignups  = useApi<MySignup[]>(user ? '/me/signups' : null);

  const [confirm, setConfirm] = useState<Committee | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ signupId: string; committeeName: string } | null>(null);
  const [busy, setBusy] = useState(false);

  /** Map of committeeId → my active signup row (so we can show "you're in" + cancel). */
  const myByCommittee = useMemo(() => {
    const m = new Map<string, MySignup>();
    (mySignups.data ?? []).forEach((s) => {
      const cid = s.committee?._id;
      if (cid && s.status !== 'cancelled') m.set(String(cid), s);
    });
    return m;
  }, [mySignups.data]);

  if (eLoading) return <div className="container-page py-20 flex items-center gap-2 text-ink-500"><Loader2 className="animate-spin" size={16}/> Loading event…</div>;
  if (eError || !ev) return (
    <div className="container-page py-20">
      <EmptyState
        title="Event not found"
        description={eError ?? 'It may have been removed.'}
        action={<Link to="/events" className="btn-outline"><ArrowLeft size={14}/> Back to events</Link>}
      />
    </div>
  );

  const event = norm(ev);
  const programLabel = event.program ? PROGRAM_LABELS[event.program] : 'Program';
  const programTone  = event.program ? PROGRAM_TONES[event.program] : 'bg-bone-100 text-ink-700';

  const userCanVolunteer = !!user && CAN_VOLUNTEER.includes(user.role);
  const userCanDonate    = !user || CAN_DONATE.includes(user.role);
  const noSignupReason =
    !user ? 'Sign in as a volunteer to join a committee.'
    : user.role === 'donor' ? 'Donors pledge supplies — see the supplies needed panel.'
    : user.role === 'health' ? 'Health partners are recorded as event partners, not committee volunteers.'
    : undefined;

  const doSignup = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await api.post(`/committees/${confirm.id}/signup`);
      toast.success('You are signed up!', `See you at ${event.title} — ${confirm.name}.`);
      setConfirm(null);
      committees.reload();
      mySignups.reload();
    } catch (e: any) {
      toast.error('Could not sign up', e?.response?.data?.error ?? 'Please try again.');
    } finally { setBusy(false); }
  };

  const doCancel = async () => {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      await api.delete(`/committees/signups/${cancelTarget.signupId}`);
      toast.success('Sign-up cancelled', `Your slot in ${cancelTarget.committeeName} is open again.`);
      setCancelTarget(null);
      committees.reload();
      mySignups.reload();
    } catch (e: any) {
      toast.error('Could not cancel', e?.response?.data?.error ?? 'Please try again.');
    } finally { setBusy(false); }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.description, url });
        toast.success('Shared');
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied', url);
      }
    } catch {/* user cancelled */}
  };

  return (
    <div>
      <PageHeader
        eyebrow={(<span className={`text-[10px] uppercase tracking-[0.14em] font-semibold px-2 py-1 rounded-full ${programTone}`}>{programLabel}</span>) as any}
        title={event.title}
        description={event.description}
        actions={(
          <>
            <button onClick={share} className="btn-ghost btn-sm" aria-label="Share event"><Share2 size={14}/> Share</button>
            <StatusBadge status={event.status} />
            <Link to="/events" className="btn-outline btn-sm"><ArrowLeft size={14}/> All events</Link>
          </>
        )}
      />

      <section className="container-page grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-tight">
            <h3 className="font-semibold text-phthalo-500">Logistics</h3>
            <dl className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-ink-700">
              <div className="flex items-center gap-2"><CalendarDays size={16} className="text-maximum-600"/>{formatDate(event.eventDate)} · {event.startTime}–{event.endTime}</div>
              <div className="flex items-center gap-2"><MapPin size={16} className="text-maximum-600"/>{event.location}</div>
              {event.barangay && <div className="flex items-center gap-2"><MapPin size={16} className="text-maximum-600"/>Brgy. {event.barangay}{event.sitio ? ` · ${event.sitio}` : ''}</div>}
              {event.targetChildren > 0 && <div className="flex items-center gap-2"><Users size={16} className="text-maximum-600"/>Target: {event.targetChildren} children</div>}
              {event.partnerOrg && <div className="flex items-center gap-2"><Building2 size={16} className="text-maximum-600"/>Partner: {event.partnerOrg}</div>}
            </dl>
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <h3 className="section-title">Committees &amp; volunteer slots</h3>
              {!userCanVolunteer && (
                <span className="text-xs text-ink-500 inline-flex items-center gap-1"><Lock size={12}/> View-only for your role</span>
              )}
            </div>
            {committees.loading && <div className="text-ink-500 flex items-center gap-2 mt-3"><Loader2 className="animate-spin" size={14}/> Loading committees…</div>}
            {committees.error && <EmptyState title="Could not load committees" description={committees.error} />}
            {!committees.loading && !committees.error && (committees.data ?? []).length === 0 && <EmptyState title="No committees yet" description="Organizers will publish slots soon." />}
            {!committees.loading && !committees.error && (
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                {(committees.data ?? []).map(norm).map((c) => {
                  const mine = myByCommittee.get(c.id);
                  return (
                    <div key={c.id} className="space-y-1">
                      <CommitteeCard
                        committee={c}
                        canSignup={userCanVolunteer}
                        alreadySignedUp={!!mine}
                        noSignupReason={noSignupReason}
                        onSignup={() => setConfirm(c)}
                      />
                      {mine && (
                        <button
                          onClick={() => setCancelTarget({ signupId: mine._id, committeeName: c.name })}
                          className="text-xs text-rose-600 hover:underline ml-1"
                        >
                          Cancel my sign-up
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div>
            <h3 className="section-title">Supplies needed</h3>
            {resources.loading && <div className="text-ink-500 flex items-center gap-2 mt-3"><Loader2 className="animate-spin" size={14}/> Loading resources…</div>}
            {resources.error && <EmptyState title="Could not load resources" description={resources.error} />}
            {!resources.loading && !resources.error && (resources.data ?? []).length === 0 && <EmptyState title="No supplies listed" />}
            {!resources.loading && !resources.error && (
              <div className="space-y-3 mt-3">
                {(resources.data ?? []).map(norm).map((r) => (
                  <ResourceItem
                    key={r.id}
                    resource={r}
                    onPledge={userCanDonate ? () => location.assign(`/donate?event=${event.id}&need=${r.id}`) : undefined}
                  />
                ))}
              </div>
            )}
            {userCanDonate ? (
              <Link to={`/donate?event=${event.id}`} className="btn-accent w-full justify-center mt-4"><HeartHandshake size={14}/> Pledge supplies for this event</Link>
            ) : (
              <div className="mt-4 text-xs text-ink-500 bg-bone-100 border border-bone-200 rounded-lg px-3 py-2 inline-flex items-start gap-2">
                <Lock size={13} className="mt-0.5"/> Pledging is not part of your role.
              </div>
            )}
            <button onClick={share} className="btn-ghost w-full justify-center mt-2"><Copy size={14}/> Share this event</button>
          </div>
        </aside>
      </section>

      {/* ─── Confirm sign-up modal ─── */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Confirm sign-up"
        description={confirm ? `${event.title} · ${formatDate(event.eventDate)}` : undefined}
        size="sm"
        variant="info"
        busy={busy}
        footer={(
          <>
            <button className="btn-ghost" onClick={() => setConfirm(null)} disabled={busy}>Cancel</button>
            <button className="btn-primary" onClick={doSignup} disabled={busy}>
              {busy ? <><Loader2 className="animate-spin" size={14}/> Signing up…</> : <><UserPlus size={14}/> Confirm sign-up</>}
            </button>
          </>
        )}
      >
        {confirm && (
          <div className="space-y-3">
            <div className="card-tight">
              <div className="font-semibold text-phthalo-500">{confirm.name}</div>
              <p className="text-sm text-ink-700 mt-1">{confirm.description}</p>
              <div className="mt-2 text-xs text-ink-500">{confirm.filled}/{confirm.slotCount} slots filled</div>
            </div>
            <p className="text-xs text-ink-500">
              Signing in as <strong>{user?.fullName}</strong> ({user?.email}). You can cancel from your dashboard later.
            </p>
          </div>
        )}
      </Modal>

      {/* ─── Cancel signup modal ─── */}
      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={doCancel}
        title="Cancel this sign-up?"
        description={cancelTarget ? `Free up your slot in "${cancelTarget.committeeName}".` : undefined}
        variant="danger"
        confirmLabel={(<><XCircle size={14}/> Yes, cancel</>) as any}
        busy={busy}
      >
        <p className="text-sm text-ink-700">
          Your slot will become available again so another volunteer can join. You can sign up again later if there's still space.
        </p>
      </ConfirmModal>
    </div>
  );
}
