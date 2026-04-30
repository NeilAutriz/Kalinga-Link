import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../lib/types';
import { HOME_FOR_ROLE } from '../lib/nav';

type Props = {
  /** Allowed roles. Omit to allow all signed-in users. */
  roles?: Role[];
};

export function ProtectedRoute({ roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container-page py-20 text-center text-ink-500">
        <div className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-maximum-500 animate-pulse"/> Verifying your session…</div>
      </div>
    );
  }
  if (!user) {
    // Send to login with a return-to.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    // Wrong role for this route — bounce silently to where this role belongs.
    return <Navigate to={HOME_FOR_ROLE[user.role]} replace />;
  }
  return <Outlet />;
}
