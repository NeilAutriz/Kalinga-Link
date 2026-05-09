import { Loader2, Pencil, ClipboardPlus } from 'lucide-react';
import { Modal } from './Modal';
import { useApi } from '../lib/useApi';
import type { ChildRecord, Measurement } from '../lib/types';
import { norm } from '../lib/types';
import { formatDate } from '../lib/format';

type Props = {
  open: boolean;
  child: ChildRecord | null;
  onClose: () => void;
  onAddReading: () => void;
  onEdit: (measurement: Measurement) => void;
};

const STATUS_STYLE: Record<string, string> = {
  improved:   'badge-green',
  no_change:  'badge-bone',
  declined:   'badge-danger',
  monitored:  'badge-info',
  baseline:   'badge-deep',
};

export function ChildHistoryModal({ open, child, onClose, onAddReading, onEdit }: Props) {
  const path = open && child ? `/children/${child.id}/measurements` : null;
  const { data, loading, error } = useApi<Measurement[]>(path);
  const measurements = (data ?? []).map(norm);

  const title = child ? `History · ${child.anonCode}` : 'History';
  const description = child
    ? `${measurements.length} reading${measurements.length === 1 ? '' : 's'} for ${child.firstName}. Newest first.`
    : '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="xl"
      footer={(
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
          <button type="button" className="btn-primary" onClick={onAddReading} disabled={!child}>
            <ClipboardPlus size={14}/> Add reading
          </button>
        </>
      )}
    >
      {loading && (
        <div className="text-ink-500 flex items-center gap-2">
          <Loader2 className="animate-spin" size={16}/> Loading history…
        </div>
      )}
      {error && <div className="text-rose-600 text-sm">{error}</div>}
      {!loading && !error && measurements.length === 0 && (
        <div className="rounded-xl border border-dashed border-bone-300 bg-bone-50 px-4 py-8 text-center text-sm text-ink-500">
          No readings recorded yet. Click <strong>Add reading</strong> to record the first one.
        </div>
      )}
      {!loading && !error && measurements.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-500">
              <tr className="text-left">
                <th className="py-2 pr-4">Measured</th>
                <th className="py-2 pr-4">Event</th>
                <th className="py-2 pr-4">Height</th>
                <th className="py-2 pr-4">Weight</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bone-200">
              {measurements.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatDate(m.recordedAt)}</td>
                  <td className="py-2 pr-4">
                    <span className="text-ink-700">{m.event?.title ?? '—'}</span>
                    {m.event?.eventDate && (
                      <div className="text-xs text-ink-500">{formatDate(m.event.eventDate)}</div>
                    )}
                  </td>
                  <td className="py-2 pr-4">{m.heightCm != null ? `${m.heightCm} cm` : '—'}</td>
                  <td className="py-2 pr-4">{m.weightKg != null ? `${m.weightKg} kg` : '—'}</td>
                  <td className="py-2 pr-4">
                    <span className={STATUS_STYLE[m.status] ?? 'badge-bone'}>{m.status.replace('_', ' ')}</span>
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <button
                      className="btn-ghost px-2 py-1 text-xs"
                      onClick={() => onEdit(m)}
                      title="Edit this reading"
                    >
                      <Pencil size={14}/> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
