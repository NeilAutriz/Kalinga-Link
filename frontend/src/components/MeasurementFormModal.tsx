import { FormEvent, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { useApi } from '../lib/useApi';
import { createMeasurement, updateMeasurement } from '../services/api';
import type { ChildRecord, EventItem, Measurement, MeasurementStatus } from '../lib/types';
import { norm } from '../lib/types';

type Mode =
  | { kind: 'create'; child: ChildRecord }
  | { kind: 'edit'; child: ChildRecord; measurement: Measurement };

type Props = {
  open: boolean;
  mode: Mode | null;
  onClose: () => void;
  onSaved: () => void;
};

const STATUS_OPTIONS: { value: MeasurementStatus; label: string }[] = [
  { value: 'baseline', label: 'Baseline' },
  { value: 'monitored', label: 'Monitored' },
  { value: 'improved', label: 'Improved' },
  { value: 'no_change', label: 'No change' },
  { value: 'declined', label: 'Declined' },
];

type FormState = {
  eventId: string;
  heightCm: string;
  weightKg: string;
  status: MeasurementStatus;
  recordedAt: string;
  notes: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const initialFor = (mode: Mode | null): FormState => {
  if (mode?.kind === 'edit') {
    const m = mode.measurement;
    return {
      eventId: m.eventId ?? '',
      heightCm: m.heightCm != null ? String(m.heightCm) : '',
      weightKg: m.weightKg != null ? String(m.weightKg) : '',
      status: m.status,
      recordedAt: m.recordedAt ? m.recordedAt.slice(0, 10) : todayIso(),
      notes: m.notes ?? '',
    };
  }
  return {
    eventId: '',
    heightCm: '',
    weightKg: '',
    status: 'monitored',
    recordedAt: todayIso(),
    notes: '',
  };
};

export function MeasurementFormModal({ open, mode, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const eventsState = useApi<EventItem[]>(open ? '/events' : null);
  const events = (eventsState.data ?? []).map(norm);

  const [form, setForm] = useState<FormState>(initialFor(mode));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm(initialFor(mode));
  }, [open, mode]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const close = () => {
    if (busy) return;
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!mode) return;

    if (mode.kind === 'create' && !form.eventId) {
      toast.error('Select an event', 'Choose which event this reading is for.');
      return;
    }

    const heightNum = form.heightCm.trim() === '' ? undefined : Number(form.heightCm);
    const weightNum = form.weightKg.trim() === '' ? undefined : Number(form.weightKg);
    if (heightNum !== undefined && (!Number.isFinite(heightNum) || heightNum < 0)) {
      toast.error('Invalid height', 'Height must be a non-negative number.');
      return;
    }
    if (weightNum !== undefined && (!Number.isFinite(weightNum) || weightNum < 0)) {
      toast.error('Invalid weight', 'Weight must be a non-negative number.');
      return;
    }

    setBusy(true);
    try {
      const recordedAtIso = form.recordedAt ? new Date(form.recordedAt).toISOString() : undefined;

      if (mode.kind === 'create') {
        await createMeasurement(mode.child.id, {
          eventId: form.eventId,
          heightCm: heightNum,
          weightKg: weightNum,
          status: form.status,
          recordedAt: recordedAtIso,
          notes: form.notes.trim() || undefined,
        });
        toast.success('Reading recorded', `Saved for ${mode.child.anonCode}.`);
      } else {
        await updateMeasurement(mode.child.id, mode.measurement.id, {
          heightCm: heightNum,
          weightKg: weightNum,
          status: form.status,
          recordedAt: recordedAtIso,
        });
        toast.success('Reading updated', `Reading for ${mode.child.anonCode} was edited.`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(
        mode.kind === 'create' ? 'Could not save reading' : 'Could not update reading',
        err?.response?.data?.error ?? 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const isEdit = mode?.kind === 'edit';
  const title = isEdit ? 'Edit reading' : 'Record a measurement';
  const description = mode
    ? isEdit
      ? `Updating the latest reading for ${mode.child.anonCode} · ${mode.child.firstName}.`
      : `New reading for ${mode.child.anonCode} · ${mode.child.firstName}.`
    : '';

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={description}
      size="md"
      busy={busy}
      footer={(
        <>
          <button type="button" disabled={busy} onClick={close} className="btn-ghost">Cancel</button>
          <button type="submit" form="measurement-form" disabled={busy} className="btn-primary">
            {busy ? (<><Loader2 className="animate-spin" size={14}/> Saving…</>) : (isEdit ? 'Save changes' : 'Save reading')}
          </button>
        </>
      )}
    >
      {mode && (
        <form id="measurement-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Event</label>
            {isEdit ? (
              <input
                className="input bg-bone-100"
                disabled
                value={
                  events.find((ev) => ev.id === form.eventId)?.title
                  ?? 'Event linked to this reading (locked)'
                }
              />
            ) : (
              <select
                className="select"
                required
                value={form.eventId}
                onChange={(e) => update('eventId', e.target.value)}
                disabled={eventsState.loading}
              >
                <option value="">{eventsState.loading ? 'Loading events…' : 'Select an event…'}</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} {ev.eventDate ? `· ${ev.eventDate.slice(0, 10)}` : ''}
                  </option>
                ))}
              </select>
            )}
            {isEdit && (
              <p className="mt-1 text-xs text-ink-500">Event association is fixed for an existing reading.</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Height (cm)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                min={0}
                value={form.heightCm}
                onChange={(e) => update('heightCm', e.target.value)}
                placeholder="e.g. 102.5"
              />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                min={0}
                value={form.weightKg}
                onChange={(e) => update('weightKg', e.target.value)}
                placeholder="e.g. 18.4"
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="select"
                value={form.status}
                onChange={(e) => update('status', e.target.value as MeasurementStatus)}
              >
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Measured on</label>
              <input
                className="input"
                type="date"
                value={form.recordedAt}
                onChange={(e) => update('recordedAt', e.target.value)}
              />
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="label">Notes <span className="text-ink-400 font-normal">(optional)</span></label>
              <textarea
                className="input min-h-[70px]"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Anything observed during the measurement."
              />
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
