import { useMemo, useState } from 'react';
import { Loader2, Plus, Pencil, ClipboardPlus, History } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Stat } from '../components/Stat';
import { ChildFormModal } from '../components/ChildFormModal';
import { MeasurementFormModal } from '../components/MeasurementFormModal';
import { ChildHistoryModal } from '../components/ChildHistoryModal';
import { useApi } from '../lib/useApi';
import type { ChildRecord, Measurement } from '../lib/types';
import { norm } from '../lib/types';
import { formatDate } from '../lib/format';

const STATUS_STYLE: Record<string, string> = {
  improved:   'badge-green',
  no_change:  'badge-bone',
  declined:   'badge-danger',
  monitored:  'badge-info',
  baseline:   'badge-deep',
};

type MeasurementMode =
  | { kind: 'create'; child: ChildRecord }
  | { kind: 'edit'; child: ChildRecord; measurement: Measurement };

const latestAsMeasurement = (c: ChildRecord): Measurement | null => {
  if (!c.lastMeasurementId) return null;
  return {
    id: c.lastMeasurementId,
    childId: c.id,
    eventId: c.lastEventId ?? '',
    heightCm: c.lastHeightCm ?? null,
    weightKg: c.lastWeightKg ?? null,
    status: c.lastStatus,
    recordedAt: c.lastMeasuredAt ?? new Date().toISOString(),
  };
};

export default function ChildMonitoringPage() {
  const { data, loading, error, reload } = useApi<ChildRecord[]>('/children');
  const children = (data ?? []).map(norm);
  const [q, setQ] = useState('');
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode | null>(null);
  const [historyChild, setHistoryChild] = useState<ChildRecord | null>(null);
  const [returnToHistory, setReturnToHistory] = useState<ChildRecord | null>(null);

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

  const openMeasurementFromHistory = (mode: MeasurementMode) => {
    setReturnToHistory(historyChild);
    setHistoryChild(null);
    setMeasurementMode(mode);
  };

  const closeMeasurement = () => {
    setMeasurementMode(null);
    if (returnToHistory) {
      const child = returnToHistory;
      setReturnToHistory(null);
      setHistoryChild(child);
    }
  };

  const onMeasurementSaved = () => {
    reload();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Child monitoring · authorized staff only"
        title="Anonymized growth records"
        description="Tracks consented children’s measurements across Sitio Villegas feeding cycles. Only organizer/health roles can view."
      />

      <section className="container-page grid sm:grid-cols-4 gap-3">
        <Stat label="Children on roster" value={counts.total} />
        <Stat label="Improved" value={counts.improved} tone="phthalo" />
        <Stat label="Monitored" value={counts.monitored} />
        <Stat label="Declined" value={counts.declined} tone="bone" />
      </section>

      <section className="container-page mt-8">
        <div className="card-tight flex flex-wrap items-center gap-3">
          <input
            className="input flex-1 min-w-[220px]"
            placeholder="Search by name, code or guardian…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-primary" onClick={() => setChildModalOpen(true)}>
            <Plus size={14}/> Add child
          </button>
        </div>

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
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bone-200">
                  {filtered.map((c) => {
                    const latest = latestAsMeasurement(c);
                    return (
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
                        <td className="py-2 pr-4">
                          <div
                            role="group"
                            aria-label="Row actions"
                            className="inline-flex items-center rounded-full border border-bone-200 bg-bone-50/80 p-0.5 ml-auto float-right"
                          >
                            <button
                              type="button"
                              aria-label="View all readings"
                              title="View all readings"
                              onClick={() => setHistoryChild(c)}
                              className="p-1.5 rounded-full text-phthalo-500 hover:bg-milk hover:text-phthalo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-maximum-200 transition"
                            >
                              <History size={14}/>
                            </button>
                            <button
                              type="button"
                              aria-label="Add reading"
                              title="Add reading"
                              onClick={() => setMeasurementMode({ kind: 'create', child: c })}
                              className="p-1.5 rounded-full text-phthalo-500 hover:bg-milk hover:text-phthalo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-maximum-200 transition"
                            >
                              <ClipboardPlus size={14}/>
                            </button>
                            <button
                              type="button"
                              aria-label={latest ? 'Edit latest reading' : 'No reading to edit yet'}
                              title={latest ? 'Edit latest reading' : 'No reading to edit yet'}
                              disabled={!latest}
                              onClick={() => latest && setMeasurementMode({
                                kind: 'edit',
                                child: c,
                                measurement: latest,
                              })}
                              className="p-1.5 rounded-full text-phthalo-500 hover:bg-milk hover:text-phthalo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-maximum-200 transition disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-phthalo-500 disabled:cursor-not-allowed"
                            >
                              <Pencil size={14}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <ChildFormModal
        open={childModalOpen}
        onClose={() => setChildModalOpen(false)}
        onCreated={reload}
      />

      <ChildHistoryModal
        open={!!historyChild}
        child={historyChild}
        onClose={() => setHistoryChild(null)}
        onAddReading={() => historyChild && openMeasurementFromHistory({ kind: 'create', child: historyChild })}
        onEdit={(m) => historyChild && openMeasurementFromHistory({ kind: 'edit', child: historyChild, measurement: m })}
      />

      <MeasurementFormModal
        open={!!measurementMode}
        mode={measurementMode}
        onClose={closeMeasurement}
        onSaved={onMeasurementSaved}
      />
    </div>
  );
}
