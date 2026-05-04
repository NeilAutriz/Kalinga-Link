import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { HOME_FOR_ROLE } from '../lib/nav';

const SEEDED = [
  { email: 'organizer@kalingalink.local', label: 'Organizer (Kristine)' },
  { email: 'health@kalingalink.local',    label: 'Health (Dr. Maria)' },
  { email: 'volunteer@kalingalink.local', label: 'Volunteer (Sofia)' },
  { email: 'donor@kalingalink.local',     label: 'Donor (Sample)' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from: string | undefined = location.state?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await login(email, password);
      // We don't yet know the user's role here synchronously; the next render of AuthProvider has it.
      // Use the seeded mapping by re-reading from cookie via auth/me on next route.
      toast.success('Welcome back!', 'You are signed in.');
      navigate(from ?? '/dashboard', { replace: true });
    } catch (e: any) {
      toast.error('Login failed', e?.response?.data?.error ?? 'Check your email and password.');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="Welcome back" title="Sign in" description="Use your KalingaLink account to manage events, sign-ups, and pledges." />
      <section className="container-page grid md:grid-cols-2 gap-6 max-w-4xl">
        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input className="input pr-10" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(p => !p)} className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 hover:text-ink-600 transition">
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
            {busy ? <><Loader2 className="animate-spin" size={16}/> Signing in…</> : <><LogIn size={16}/> Sign in</>}
          </button>
          <p className="text-sm text-ink-500">No account yet? <Link to="/register" className="text-maximum-700 hover:underline">Register</Link></p>
        </form>

        <aside className="card-tight">
          <h3 className="font-semibold text-phthalo-500">Seeded demo logins</h3>
          <p className="text-xs text-ink-500 mt-1">All passwords: <code>password123</code></p>
          <ul className="mt-3 space-y-2 text-sm">
            {SEEDED.map((s) => (
              <li key={s.email}>
                <button type="button" onClick={() => { setEmail(s.email); setPassword('password123'); }} className="text-left w-full hover:bg-bone-100 rounded px-2 py-1">
                  <div className="font-medium text-phthalo-500">{s.label}</div>
                  <div className="text-xs text-ink-500">{s.email}</div>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-ink-500">After login you'll land on your role's home: organizers → console, health → child monitoring, volunteers/donors → dashboard.</p>
          <p className="hidden">{Object.keys(HOME_FOR_ROLE).join(',')}</p>
        </aside>
      </section>
    </div>
  );
}
