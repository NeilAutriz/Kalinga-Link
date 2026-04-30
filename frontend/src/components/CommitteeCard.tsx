import { Lock } from 'lucide-react';
import type { Committee } from '../lib/types';
import { ProgressBar } from './ProgressBar';
import { pct } from '../lib/format';

type Props = {
  committee: Committee;
  onSignup?: () => void;
  /** When false, the sign-up button is replaced with a role-aware notice. */
  canSignup?: boolean;
  /** When true, shows "You're signed up" state. */
  alreadySignedUp?: boolean;
  /** Reason text shown when canSignup === false. */
  noSignupReason?: string;
};

export function CommitteeCard({
  committee, onSignup,
  canSignup = true, alreadySignedUp = false, noSignupReason,
}: Props) {
  const remaining = committee.slotCount - committee.filled;
  const full = remaining <= 0;

  return (
    <div className="card-tight flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-phthalo-500">{committee.name}</h4>
          <p className="text-xs text-ink-500 mt-0.5">{committee.description}</p>
        </div>
        <span className="badge-bone whitespace-nowrap">{committee.filled}/{committee.slotCount}</span>
      </div>

      <ProgressBar value={pct(committee.filled, committee.slotCount)} tone={full ? 'phthalo' : 'maximum'} />

      {alreadySignedUp ? (
        <div className="text-xs text-maximum-700 bg-maximum-50 border border-maximum-200 rounded-lg px-3 py-2">
          You're signed up to this committee.
        </div>
      ) : !canSignup ? (
        <div className="text-xs text-ink-500 bg-bone-100 border border-bone-200 rounded-lg px-3 py-2 inline-flex items-start gap-2">
          <Lock size={13} className="mt-0.5 shrink-0"/>
          <span>{noSignupReason ?? 'Sign-up is not available for your role.'}</span>
        </div>
      ) : (
        <button
          onClick={onSignup}
          disabled={full}
          className={full ? 'btn bg-bone-200 text-ink-500 cursor-not-allowed' : 'btn-accent'}
        >
          {full ? 'Slot full' : 'Sign up'}
        </button>
      )}
    </div>
  );
}
