import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, UserPlus } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import type { Role } from '../lib/types';

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
      <PageHeader eyebrow="Join KalingaLink" title="Create your account" description="Volunteers, donors, organizers, and health partners are welcome." />
      <section className="container-page max-w-xl">
        <form onSubmit={submit} className="card space-y-4">
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
            <label className="label">Role</label>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="volunteer">Volunteer — sign up to event committees</option>
              <option value="donor">Donor — pledge supplies for events</option>
              <option value="health">Health partner — child monitoring access</option>
              <option value="organizer">Organizer — operations console</option>
            </select>
            <p className="mt-1 text-[11px] text-ink-500">Organizer and health roles are reviewed by an admin before sensitive features unlock.</p>
          </div>
          <div>
            <label className="label">Affiliation (UPLB college, IRRI unit, parish, brgy, etc.)</label>
            <input className="input" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} placeholder="e.g. UPLB CHE BS Community Nutrition" />
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
            {busy ? <><Loader2 className="animate-spin" size={16}/> Creating account…</> : <><UserPlus size={16}/> Create account</>}
          </button>
          <p className="text-sm text-ink-500">Already have one? <Link to="/login" className="text-maximum-700 hover:underline">Sign in</Link></p>
        </form>
      </section>
    </div>
  );
}
