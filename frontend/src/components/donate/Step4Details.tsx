import { HeartHandshake, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import type { DonorDetails } from '../../pages/DonatePage';

interface Props {
  details: DonorDetails;
  onChange: (patch: Partial<DonorDetails>) => void;
  nameError: string;
  contactError: string;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function Step4Details({ details, onChange, nameError, contactError, onSubmit, onBack }: Props) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* Donor identity */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Your name</label>
          <input
            className={clsx('input', nameError && 'border-red-400 focus:ring-red-300')}
            required={!details.anonymous}
            disabled={details.anonymous}
            placeholder={details.anonymous ? 'Anonymous donor' : 'Juana Dela Cruz'}
            value={details.anonymous ? '' : details.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
        </div>
        <div>
          <label className="label">Contact (email or mobile)</label>
          <input
            className={clsx('input', contactError && 'border-red-400 focus:ring-red-300')}
            required
            type="text"
            placeholder="you@example.com  ·  09xx xxx xxxx"
            value={details.contact}
            onChange={(e) => onChange({ contact: e.target.value })}
          />
          {contactError && <p className="mt-1 text-xs text-red-600">{contactError}</p>}
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-ink-700 leading-snug">
        <input
          type="checkbox"
          className="checkbox mt-0.5 shrink-0"
          checked={details.anonymous}
          onChange={(e) => onChange({ anonymous: e.target.checked })}
        />
        <span>Show me as <strong>Anonymous donor</strong> publicly (organizers still need your contact for receipt).</span>
      </label>

      {/* Drop-off preference */}
      <div>
        <label className="label">How will you fulfil the pledge?</label>
        <div className="grid sm:grid-cols-3 gap-3">
          {([
            { v: 'self',   t: 'I will drop off',    d: 'At UPLB CSS office, weekday afternoons.' },
            { v: 'pickup', t: 'Please pick up',      d: 'Within Los Baños only. Coordinate via call.' },
            { v: 'onsite', t: 'Bring on visit day',  d: 'Hand over directly at Sitio Villegas court.' },
          ] as const).map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange({ dropoff: o.v })}
              className={clsx(
                'text-left rounded-xl border p-4 transition',
                details.dropoff === o.v
                  ? 'border-maximum-500 bg-maximum-50'
                  : 'border-bone-200 bg-milk hover:border-maximum-300',
              )}
            >
              <div className="text-sm font-semibold text-phthalo-500 leading-tight">{o.t}</div>
              <div className="text-[11px] text-ink-500 mt-1.5 leading-relaxed">{o.d}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Optional message */}
      <div>
        <label className="label">
          Message to organizers <span className="text-ink-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          className="textarea block w-full"
          placeholder="e.g. I can drop off Saturday morning. Brand of rice is Sinandomeng."
          value={details.message}
          onChange={(e) => onChange({ message: e.target.value.slice(0, 280) })}
        />
        <div className="mt-1 flex justify-end text-[11px] text-ink-400">{details.message.length}/280</div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-bone-100">
        <button type="button" onClick={onBack} className="btn-outline btn-sm flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back
        </button>
        <button type="submit" className="btn-primary flex items-center gap-2">
          <HeartHandshake size={16} /> Review & confirm pledge
        </button>
      </div>
    </form>
  );
}
