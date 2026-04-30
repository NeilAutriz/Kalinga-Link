import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { RoleBadge } from '../components/RoleBadge';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div>
      <PageHeader eyebrow="Account" title="Your profile" description="Details on file. Contact an organizer to update your role or affiliation." />
      <section className="container-page max-w-xl">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-ink-500 uppercase tracking-wider">Full name</div>
              <div className="font-semibold text-phthalo-500">{user.fullName}</div>
            </div>
            <RoleBadge role={user.role} />
          </div>
          <div>
            <div className="text-xs text-ink-500 uppercase tracking-wider">Email</div>
            <div className="text-ink-700">{user.email}</div>
          </div>
          {user.affiliation && (
            <div>
              <div className="text-xs text-ink-500 uppercase tracking-wider">Affiliation</div>
              <div className="text-ink-700">{user.affiliation}</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
