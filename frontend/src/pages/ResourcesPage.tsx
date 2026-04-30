import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ResourceItem } from '../components/ResourceItem';
import { EmptyState } from '../components/EmptyState';
import { useApi } from '../lib/useApi';
import type { EventItem, ResourceNeed } from '../lib/types';
import { norm, PROGRAM_LABELS } from '../lib/types';

export default function ResourcesPage() {
  const events = useApi<EventItem[]>('/events?status=published');
  const [eventId, setEventId] = useState<string>('');

  const eventOptions = useMemo(() => (events.data ?? []).map(norm), [events.data]);
  const effectiveId = eventId || eventOptions[0]?.id || '';
  const path = effectiveId ? `/resources?eventId=${effectiveId}` : null;
  const resources = useApi<ResourceNeed[]>(path);
  const items = (resources.data ?? []).map(norm);

  return (
    <div>
      <PageHeader
        eyebrow="Open resource needs"
        title="Help us prepare each cycle"
        description="Donations of food, supplies, books, art materials and equipment go directly to scheduled Los Baños events."
        actions={<Link to="/donate" className="btn-primary">Make a pledge</Link>}
      />

      <section className="container-page">
        <div className="card-tight grid md:grid-cols-[1fr_auto] gap-3">
          <select className="select" value={effectiveId} onChange={(e) => setEventId(e.target.value)}>
            {eventOptions.length === 0 && <option value="">No published events</option>}
            {eventOptions.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} {ev.program ? `· ${PROGRAM_LABELS[ev.program]}` : ''} {ev.barangay ? `· Brgy. ${ev.barangay}` : ''}
              </option>
            ))}
          </select>
          <Link to={effectiveId ? `/events/${effectiveId}` : '/events'} className="btn-outline">View event</Link>
        </div>

        <div className="mt-6">
          {resources.loading && <div className="flex items-center gap-2 text-ink-500"><Loader2 className="animate-spin" size={16}/> Loading resources…</div>}
          {resources.error && <EmptyState title="Could not load resources" description={resources.error} />}
          {!resources.loading && !resources.error && items.length === 0 && <EmptyState title="No resource needs listed yet" />}
          {!resources.loading && !resources.error && items.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((r) => (
                <ResourceItem key={r.id} resource={r} onPledge={() => location.assign(`/donate?event=${effectiveId}&need=${r.id}`)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
