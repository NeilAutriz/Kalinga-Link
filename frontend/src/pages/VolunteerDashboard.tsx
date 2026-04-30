import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, XCircle, Calendar, HeartHandshake, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Stat } from '../components/Stat';
import { StatusBadge } from '../components/StatusBadge';
import { RoleBadge } from '../components/RoleBadge';
import { ConfirmModal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../lib/useApi';
import { api } from '../services/api';
import { formatDate } from '../lib/format';
import { PROGRAM_LABELS } from '../lib/types';

type SignupRow = {
  _id: string;
  status: string; // 'signed_up' | 'attended' | 'cancelled' | 'no_show'
  hoursLogged?: number;
  committee?: { _id: string; name: string; description?: string };
  event?: { _id: string; title: string; eventDate: string; startTime: string; endTime: string; status: string; location: string; barangay?: string; sitio?: string; program?: keyof typeof PROGRAM_LABELS };
};

type PledgeRow = {
  _id: string;
  donorName: string;
  quantity: number;
  status: 'pledged' | 'received' | 'cancelled';
  createdAt: string;
  resource?: { _id: string; itemName: string; unit: string; eventId: string };
  event?: { _id: string; title: string; eventDate: string; barangay?: string };
};

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isDonor     = user?.role === 'donor';
  const isHealth    = user?.role === 'health';
  const isOrganizer = user?.role === 'organizer';
  /** Roles that can be on committees (volunteer + organizer). Donor & health hide the signups panel. */
  const showSignups = !isDonor && !isHealth;
  /** Roles that pledge supplies. Health partners don't. */
  const showPledges = !isHealth;

  const signups = useApi<SignupRow[]>(showSignups ? '/me/signups' : null);
  const pledges = useApi<PledgeRow[]>(showPledges ? '/me/pledges' : null);

  const today = new Date(new Date().toDateString());
  const allSignups = (signups.data ?? []).filter((r) => r.event && r.status !== 'cancelled');
  const upcoming   = allSignups.filter((r) => new Date(r.event!.eventDate) >= today);
  const past       = allSignups.filter((r) => new Date(r.event!.eventDate) <  today);
  const totalHours = allSignups.reduce((s, r) => s + (r.hoursLogged ?? 0), 0);

  const pledgeRows = (pledges.data ?? []).filter((p) => p.status !== 'cancelled');
  const totalPledged = pledgeRows.reduce((s, p) => s + (p.quantity ?? 0), 0);

  /* ── Cancel state ── */
  const [cancelSignup, setCancelSignup] = useState<SignupRow | null>(null);
  const [cancelPledge, setCancelPledge] = useState<PledgeRow | null>(null);
  const [busy, setBusy] = useState(false);

  const doCancelSignup = async () => {
    if (!cancelSignup) return;
    setBusy(true);
    try {
      await api.delete(`/committees/signups/${cancelSignup._id}`);
      toast.success('Sign-up cancelled', cancelSignup.committee?.name);
      setCancelSignup(null);
      signups.reload();
    } catch (e: any) {
      toast.error('Could not cancel', e?.response?.data?.error ?? 'Please try again.');
    } finally { setBusy(false); }
  };
  const doCancelPledge = async () => {
    if (!cancelPledge) return;
    setBusy(true);
    try {
      await api.delete(`/resources/pledges/${cancelPledge._id}`);
      toast.success('Pledge cancelled', cancelPledge.resource?.itemName);
      setCancelPledge(null);
      pledges.reload();
    } catch (e: any) {
      toast.error('Could not cancel', e?.response?.data?.error ?? 'Please try again.');
    } finally { setBusy(false); }
  };

  const headlineByRole =
    isDonor     ? 'Your pledges & history' :
    isHealth    ? 'Your account' :
    isOrganizer ? 'Personal dashboard' :
                  'Your sign-ups & pledges';

  const descByRole =
    isDonor     ? 'Track every supply pledge you have made for KalingaLink events.' :
    isHealth    ? 'Health partners coordinate child monitoring from the Children page.' :
    isOrganizer ? 'Personal sign-ups and pledges. Use the Organizer console for event management.' :
                  'Track your sign-ups, pledges, and volunteer hours — all live from the database.';

  return (
    <div>
      <PageHeader
        eyebrow={(<span className="inline-flex items-center gap-2">Hello, {user?.fullName.split(' ')[0] ?? 'kapwa'} {user && <RoleBadge role={user.role} />}</span>) as any}
        title={headlineByRole}
        description={descByRole}
        actions={(
          <>
            <Link to="/events" className="btn-primary"><Calendar size={14}/> Find an event</Link>
            {showPledges && <Link to="/donate" className="btn-outline"><HeartHandshake size={14}/> Donate</Link>}
            {isOrganizer && <Link to="/organizer" className="btn-ghost">Open organizer console <ChevronRight size={14}/></Link>}
            {isHealth    && <Link to="/children"  className="btn-ghost">Open child monitoring <ChevronRight size={14}/></Link>}
          </>
        )}
      />

      {/* ── stat grid (role-aware) ── */}
      <section className="container-page grid sm:grid-cols-3 gap-3">
        {showSignups && <Stat label="Upcoming sign-ups" value={upcoming.length} />}
        {showSignups && <Stat label="Past events joined" value={past.length} tone="phthalo" />}
        {showSignups && <Stat label="Hours volunteered" value={totalHours} tone="bone" />}
        {!showSignups && showPledges && <Stat label="Active pledges" value={pledgeRows.length} />}
        {!showSignups && showPledges && <Stat label="Items pledged" value={totalPledged} tone="phthalo" />}
        {!showSignups && showPledges && <Stat label="Programs supported" value={new Set(pledgeRows.map((p) => p.event?.title)).size} tone="bone" />}
        {isHealth && <Stat label="Open Children page" value="→" />}
      </section>

      {/* ── Signups (volunteers + organizers) ── */}
      {showSignups && (
        <section className="container-page mt-8">
          <h2 className="section-title">Upcoming sign-ups</h2>
          {signups.loading && <div className="text-ink-500 flex items-center gap-2 mt-2"><Loader2 className="animate-spin" size={14}/> Loading from MongoDB Atlas…</div>}
          {signups.error && <EmptyState title="Could not load sign-ups" description={signups.error} />}
          {!signups.loading && !signups.error && upcoming.length === 0 && (
            <EmptyState title="No upcoming sign-ups" description="Browse events and pick a committee to volunteer." action={<Link to="/events" className="btn-accent">Browse events</Link>} />
          )}
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            {upcoming.map((r) => <SignupCard key={r._id} row={r} onCancel={() => setCancelSignup(r)} />)}
          </div>

          {past.length > 0 && (
            <>
              <h2 className="section-title mt-10">Past events</h2>
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                {past.map((r) => <SignupCard key={r._id} row={r} past />)}
              </div>
            </>
          )}
        </section>
      )}

      {/* ── Pledges (everyone except health) ── */}
      {showPledges && (
        <section className="container-page mt-10">
          <h2 className="section-title">Your pledges</h2>
          {pledges.loading && <div className="text-ink-500 flex items-center gap-2 mt-2"><Loader2 className="animate-spin" size={14}/> Loading pledges…</div>}
          {pledges.error && <EmptyState title="Could not load pledges" description={pledges.error} />}
          {!pledges.loading && !pledges.error && pledgeRows.length === 0 && (
            <EmptyState title="No pledges yet" description="Pledge supplies for an upcoming event." action={<Link to="/donate" className="btn-accent">Donate now</Link>} />
          )}
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            {pledgeRows.map((p) => (
              <div key={p._id} className="card-tight">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-phthalo-500">{p.resource?.itemName ?? 'Resource'}</div>
                    <div className="text-xs text-ink-500">{p.event?.title ?? 'Event'}{p.event?.barangay ? ` · Brgy. ${p.event.barangay}` : ''}</div>
                  </div>
                  <span className={p.status === 'received' ? 'badge-green' : 'badge-bone'}>{p.status}</span>
                </div>
                <p className="mt-2 text-sm text-ink-700">{p.quantity} {p.resource?.unit ?? 'units'} · pledged {new Date(p.createdAt).toLocaleDateString('en-PH')}</p>
                {p.status === 'pledged' && (
                  <button
                    onClick={() => setCancelPledge(p)}
                    className="mt-2 text-xs text-rose-600 hover:underline"
                  >
                    Cancel this pledge
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Health partner: directional helper ── */}
      {isHealth && (
        <section className="container-page mt-10">
          <div className="card">
            <h2 className="section-title">Child monitoring</h2>
            <p className="mt-2 text-sm text-ink-700">
              As a health partner you have access to the consented child registry and measurement
              records. Open the Children page to record growth, register new children with guardian
              consent, and review longitudinal trends.
            </p>
            <Link to="/children" className="btn-primary mt-4">Open child monitoring</Link>
          </div>
        </section>
      )}

      {/* ── Cancel signup confirm ── */}
      <ConfirmModal
        open={!!cancelSignup}
        onClose={() => setCancelSignup(null)}
        onConfirm={doCancelSignup}
        title="Cancel sign-up?"
        description={cancelSignup ? `${cancelSignup.event?.title} — ${cancelSignup.committee?.name}` : undefined}
        variant="danger"
        confirmLabel={(<><XCircle size={14}/> Yes, cancel</>) as any}
        busy={busy}
      >
        <p className="text-sm text-ink-700">Your slot will be released so another volunteer can take it. You can sign up again if there's still space.</p>
      </ConfirmModal>

      {/* ── Cancel pledge confirm ── */}
      <ConfirmModal
        open={!!cancelPledge}
        onClose={() => setCancelPledge(null)}
        onConfirm={doCancelPledge}
        title="Cancel pledge?"
        description={cancelPledge ? `${cancelPledge.quantity} ${cancelPledge.resource?.unit} of ${cancelPledge.resource?.itemName}` : undefined}
        variant="danger"
        confirmLabel={(<><XCircle size={14}/> Yes, cancel</>) as any}
        busy={busy}
      >
        <p className="text-sm text-ink-700">The supply will be removed from this event's "received" total. You can pledge again any time.</p>
      </ConfirmModal>
    </div>
  );
}

function SignupCard({ row, past = false, onCancel }: { row: SignupRow; past?: boolean; onCancel?: () => void }) {
  const ev = row.event!;
  const cancellable = !past && row.status !== 'cancelled' && row.status !== 'attended';
  return (
    <div className="card-tight">
      <Link to={`/events/${ev._id}`} className="block group">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-ink-500">
              {ev.program ? PROGRAM_LABELS[ev.program] : 'Event'}{ev.barangay ? ` · Brgy. ${ev.barangay}` : ''}{ev.sitio ? ` · ${ev.sitio}` : ''}
            </div>
            <div className="font-semibold text-phthalo-500 group-hover:text-maximum-700">{ev.title}</div>
            <div className="text-xs text-ink-500 mt-0.5">{formatDate(ev.eventDate)} · {ev.startTime}–{ev.endTime}</div>
          </div>
          <StatusBadge status={ev.status as any} />
        </div>
        {row.committee && (
          <div className="mt-2 text-sm text-ink-700"><span className="text-ink-500">Committee:</span> {row.committee.name}</div>
        )}
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <span className={row.status === 'attended' ? 'badge-green' : 'badge-bone'}>{row.status.replace('_',' ')}</span>
        <div className="flex items-center gap-3">
          {past && row.hoursLogged ? <span className="text-xs text-ink-500">{row.hoursLogged}h logged</span> : null}
          {cancellable && onCancel && (
            <button onClick={onCancel} className="text-xs text-rose-600 hover:underline">Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
}
