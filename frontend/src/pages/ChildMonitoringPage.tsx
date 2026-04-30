import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Stat } from '../components/Stat';
import { useApi } from '../lib/useApi';
import type { ChildRecord } from '../lib/types';
import { norm } from '../lib/types';
import { formatDate } from '../lib/format';

const STATUS_STYLE: Record<string, string> = {
  improved:   'badge-green',
  no_change:  'badge-bone',
  declined:   'badge-danger',
  monitored:  'badge-info',
  baseline:   'badge-deep',
};

export default function ChildMonitoringPage() {
  const { data, loading, error } = useApi<ChildRecord[]>('/children');
  const children = (data ?? []).map(norm);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return children;
    return children.filter((c) => (c.firstName + ' ' + c.anonCode + ' ' + c.guardianName).toLowerCase().includes(needle));
  }, [q, children]);

  const counts = useMemo(() => ({
    total: children.length,
    improved: children.filter((c) => c.lastStatus === 'improved').length,
    monitored: children.filter((c) => c.lastStatus === 'monitored').length,
    declined: children.filter((c) => c.lastStatus === 'declined').length,
  }), [children]);

  return (
    <div>
      <PageHeader
        eyebrow="Child monitoring · authorized staff only"
        title="Anonymized growth records"
        description="Tracks consented children's measurements across Los Baños feeding cycles. Only organizer/health roles can view."
      />

      <section className="container-page grid sm:grid-cols-4 gap-3">
        <Stat label="Children on roster" value={counts.total} />
        <Stat label="Improved" value={counts.improved} tone="phthalo" />
        <Stat label="Monitored" value={counts.monitored} />
        <Stat label="Declined" value={counts.declined} tone="bone" />
      </section>

      <section className="container-page mt-8">
        <div className="card-tight"><input className="input" placeholder="Search by name, code or guardian…" value={q} onChange={(e) => setQ(e.target.value)} /></div>

        <div className="mt-6">
          {loading && <div className="text-ink-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Loading records…</div>}
          {error && <EmptyState title="Could not load child records" description={error} />}
          {!loading && !error && filtered.length === 0 && <EmptyState title="No matching records" />}
          {!loading && !error && filtered.length > 0 && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-ink-500">
                  <tr className="text-left">
                    <th className="py-2 pr-4">Code</th><th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Age</th><th className="py-2 pr-4">Sex</th>
                    <th className="py-2 pr-4">Guardian</th>
                    <th className="py-2 pr-4">Last height</th><th className="py-2 pr-4">Last weight</th>
                    <th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Measured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bone-200">
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 pr-4 font-mono text-xs">{c.anonCode}</td>
                      <td className="py-2 pr-4">{c.firstName}</td>
                      <td className="py-2 pr-4">{c.age}</td>
                      <td className="py-2 pr-4">{c.sex}</td>
                      <td className="py-2 pr-4">{c.guardianName}</td>
                      <td className="py-2 pr-4">{c.lastHeightCm ? `${c.lastHeightCm} cm` : '—'}</td>
                      <td className="py-2 pr-4">{c.lastWeightKg ? `${c.lastWeightKg} kg` : '—'}</td>
                      <td className="py-2 pr-4"><span className={STATUS_STYLE[c.lastStatus] ?? 'badge-bone'}>{c.lastStatus.replace('_',' ')}</span></td>
                      <td className="py-2 pr-4 text-xs text-ink-500">{c.lastMeasuredAt ? formatDate(c.lastMeasuredAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
