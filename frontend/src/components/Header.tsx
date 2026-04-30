import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from './Logo';
import { RoleBadge } from './RoleBadge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { visibleNav, HOME_FOR_ROLE } from '../lib/nav';

export function Header() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const publicLinks = visibleNav('public', user?.role);
  const accountLinks = user ? visibleNav('account', user.role) : [];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'px-3 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-1.5',
      isActive
        ? 'bg-phthalo-50 text-phthalo-500'
        : 'text-ink-700 hover:text-phthalo-500 hover:bg-bone-100',
    );

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out', 'Come back soon!');
    setMenuOpen(false); setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 bg-milk/85 backdrop-blur border-b border-bone-200">
      <div className="container-page flex items-center justify-between h-16 gap-3">
        <Link to="/" className="flex items-center shrink-0" aria-label="KalingaLink home">
          <Logo size={36} />
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {publicLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          {user && accountLinks.length > 0 && (
            <span className="mx-2 h-5 w-px bg-bone-200" aria-hidden />
          )}
          {accountLinks.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                <Icon size={14} /> {l.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          {!user ? (
            <>
              <Link to="/login" className="btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn-accent btn-sm">Volunteer with us</Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full hover:bg-bone-100"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="h-8 w-8 rounded-full bg-phthalo-500 text-milk grid place-items-center text-xs font-semibold">
                  {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </span>
                <ChevronDown size={14} className="text-ink-500" />
              </button>
              {menuOpen && (
                <>
                  <button className="fixed inset-0 z-10" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
                  <div role="menu" className="absolute right-0 mt-2 w-64 bg-milk border border-bone-200 rounded-2xl shadow-soft p-2 z-20">
                    <div className="px-3 py-2.5 border-b border-bone-200">
                      <div className="text-sm font-semibold text-phthalo-500 truncate">{user.fullName}</div>
                      <div className="text-xs text-ink-500 truncate">{user.email}</div>
                      <div className="mt-2"><RoleBadge role={user.role} /></div>
                    </div>
                    <Link to="/me"        onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-bone-100">Profile</Link>
                    <Link to={HOME_FOR_ROLE[user.role]} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-bone-100">My workspace</Link>
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-bone-100 text-rose-700 inline-flex items-center gap-2">
                      <LogOut size={14}/> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <button className="md:hidden p-2 rounded-lg hover:bg-bone-100" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-bone-200 bg-milk">
          <div className="container-page py-3 grid gap-1">
            {publicLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
            {user && accountLinks.length > 0 && (
              <>
                <div className="mt-2 px-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-500">Account</div>
                {accountLinks.map((l) => {
                  const Icon = l.icon;
                  return (
                    <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={linkClass}>
                      <Icon size={14}/> {l.label}
                    </NavLink>
                  );
                })}
              </>
            )}
            <div className="h-px bg-bone-200 my-2" />
            {!user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login"    onClick={() => setOpen(false)} className="btn-outline">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-accent">Volunteer</Link>
              </div>
            ) : (
              <div className="grid gap-1">
                <div className="px-3 py-2 flex items-center justify-between rounded-lg bg-bone-100">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-phthalo-500 truncate">{user.fullName}</div>
                    <div className="text-xs text-ink-500 truncate">{user.email}</div>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
                <Link to="/me" onClick={() => setOpen(false)} className="btn-ghost justify-start">Profile</Link>
                <button onClick={handleLogout} className="btn-ghost justify-start text-rose-700"><LogOut size={16}/>Sign out</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
