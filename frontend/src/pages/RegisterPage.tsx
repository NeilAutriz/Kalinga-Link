import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, UserPlus, Check, Lock } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import type { Role } from '../lib/types';
import { ROLE_INFO, ROLE_ORDER, ROLE_REVIEW_NOTE } from '../lib/nav';
import clsx from 'clsx';

/** Roles a person can pick on the public sign-up form. The other two
 *  (organizer, health) are admin-promoted only — backend enforces this too. */
const SELF_REGISTRABLE: Role[] = ['volunteer', 'donor'];

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('volunteer');
  const [affiliation, setAffiliation] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await register({ fullName, email, password, role, affiliation: affiliation || undefined });
      toast.success(`Welcome, ${fullName.split(' ')[0]}!`, 'Your KalingaLink account is ready.');
      navigate('/dashboard', { replace: true });
    } catch (e: any) {
      toast.error('Registration failed', e?.response?.data?.error ?? 'Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="Join KalingaLink" title="Create your account" description="Pick the role that matches how you'll help — each one unlocks the right tools for the job." />
      <section className="container-page max-w-3xl">
        <form onSubmit={submit} className="card space-y-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Full name</label>
              <input className="input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password (min 8 chars)</label>
              <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="label">Affiliation</label>
              <input className="input" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} placeholder="UPLB college · IRRI unit · parish · brgy · org" />
            </div>
          </div>

          <fieldset className="mt-2">
            <legend className="label mb-2">I'm joining as a…</legend>
            <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Role">
              {ROLE_ORDER.map((r) => {
                const info = ROLE_INFO[r];
                const Icon = info.icon;
                const selected = role === r;
                const locked = !SELF_REGISTRABLE.includes(r);
                return (
                  <label
                    key={r}
                    className={clsx(
                      'relative rounded-2xl border p-4 transition',
                      locked
                        ? 'cursor-not-allowed border-bone-200 bg-bone-50/60 opacity-70'
                        : selected
                          ? 'cursor-pointer border-maximum-500 bg-maximum-50/60 ring-2 ring-maximum-300'
                          : 'cursor-pointer border-bone-200 hover:border-maximum-300 hover:bg-bone-50',
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={selected}
                      disabled={locked}
                      onChange={() => !locked && setRole(r)}
                      className="sr-only"
                    />
                    {selected && !locked && (
                      <span className="absolute top-3 right-3 inline-flex items-center justify-center h-5 w-5 rounded-full bg-maximum-500 text-milk">
                        <Check size={12} aria-hidden />
                      </span>
                    )}
                    {locked && (
                      <span
                        className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-500 bg-bone-100 border border-bone-200 rounded-full px-2 py-0.5"
                        title="Admin-only role — request access from a program organizer."
                      >
                        <Lock size={10} aria-hidden /> Admin only
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={clsx('h-10 w-10 grid place-items-center rounded-xl shrink-0', info.chipClass)}>
                        <Icon size={18} aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-phthalo-500">{info.label}</div>
                        <div className="text-xs uppercase tracking-[0.12em] text-maximum-600 mt-0.5">{info.tagline}</div>
                        <p className="mt-2 text-sm text-ink-700 leading-relaxed">{info.summary}</p>
                        <ul className="mt-2 space-y-1 text-xs text-ink-700">
                          {info.can.slice(0, 3).map((c) => (
                            <li key={c} className="flex gap-1.5"><Check size={12} className="text-maximum-600 mt-0.5 shrink-0"/><span>{c}</span></li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-ink-500">{ROLE_REVIEW_NOTE}</p>
          </fieldset>

          <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
            {busy ? <><Loader2 className="animate-spin" size={16}/> Creating account…</> : <><UserPlus size={16}/> Create account</>}
          </button>
          <p className="text-sm text-ink-500">Already have one? <Link to="/login" className="text-maximum-700 hover:underline">Sign in</Link></p>
        </form>
      </section>
    </div>
  );
}
