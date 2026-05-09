import { FormEvent, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { createChild } from '../services/api';
import type { ChildCreateInput } from '../lib/types';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const SEX_OPTIONS: { value: 'M' | 'F' | 'X'; label: string }[] = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'X', label: 'Prefer not to say' },
];

const EMPTY: ChildCreateInput = {
  firstName: '',
  age: 0,
  sex: 'M',
  guardianName: '',
  guardianContact: '',
  consentGiven: false,
  notes: '',
};

export function ChildFormModal({ open, onClose, onCreated }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<ChildCreateInput>(EMPTY);
  const [busy, setBusy] = useState(false);

  const update = <K extends keyof ChildCreateInput>(key: K, value: ChildCreateInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => setForm(EMPTY);

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.consentGiven) {
      toast.error('Guardian consent required', 'Tick the consent box before saving.');
      return;
    }
    setBusy(true);
    try {
      await createChild({
        ...form,
        firstName: form.firstName.trim(),
        guardianName: form.guardianName.trim(),
        guardianContact: form.guardianContact?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      toast.success('Child added', 'A new anonymized record was created.');
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error('Could not save child', err?.response?.data?.error ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a child to the roster"
      description="An anonymized code is generated automatically. Guardian consent is required."
      size="lg"
      busy={busy}
      footer={(
        <>
          <button type="button" disabled={busy} onClick={close} className="btn-ghost">Cancel</button>
          <button type="submit" form="create-child-form" disabled={busy} className="btn-primary">
            {busy ? (<><Loader2 className="animate-spin" size={14}/> Saving…</>) : (<><Plus size={14}/> Save child</>)}
          </button>
        </>
      )}
    >
      <form id="create-child-form" onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <input
              className="input"
              required
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              placeholder="e.g. Liza"
            />
          </div>
          <div>
            <label className="label">Age</label>
            <input
              className="input"
              type="number"
              required
              min={0}
              max={18}
              value={Number.isFinite(form.age) ? form.age : 0}
              onChange={(e) => update('age', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Sex</label>
            <select
              className="select"
              value={form.sex}
              onChange={(e) => update('sex', e.target.value as 'M' | 'F' | 'X')}
            >
              {SEX_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Guardian name</label>
            <input
              className="input"
              required
              value={form.guardianName}
              onChange={(e) => update('guardianName', e.target.value)}
              placeholder="Parent or guardian's name"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Guardian contact <span className="text-ink-400 font-normal">(optional)</span></label>
            <input
              className="input"
              value={form.guardianContact ?? ''}
              onChange={(e) => update('guardianContact', e.target.value)}
              placeholder="Phone or other reachable contact"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes <span className="text-ink-400 font-normal">(optional)</span></label>
            <textarea
              className="input min-h-[80px]"
              value={form.notes ?? ''}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Allergies, conditions, or anything staff should know."
            />
          </div>
        </div>

        <label className="flex items-start gap-2 rounded-xl border border-bone-300 bg-bone-50 px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4"
            checked={form.consentGiven}
            onChange={(e) => update('consentGiven', e.target.checked)}
          />
          <span>
            <span className="font-medium text-phthalo-500">Guardian consent obtained</span>
            <span className="block text-xs text-ink-500">Required. The record will not be saved without it.</span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
