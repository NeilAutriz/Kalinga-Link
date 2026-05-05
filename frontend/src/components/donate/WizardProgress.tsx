import { Fragment } from 'react';
import { Check } from 'lucide-react';
import clsx from 'clsx';

const STEPS = [
  { n: 1 as const, label: 'Choose a visit' },
  { n: 2 as const, label: 'Browse supplies' },
  { n: 3 as const, label: 'Your pledge' },
  { n: 4 as const, label: 'Your details' },
];

interface Props {
  step: 1 | 2 | 3 | 4;
}

export function WizardProgress({ step }: Props) {
  return (
    <div className="flex items-start mb-6">
      {STEPS.map((s, i) => (
        <Fragment key={s.n}>
          <div className="flex flex-col items-center shrink-0">
            <div
              className={clsx(
                'h-8 w-8 grid place-items-center rounded-full text-sm font-semibold transition-colors',
                step > s.n
                  ? 'bg-maximum-500 text-milk'
                  : step === s.n
                    ? 'bg-phthalo-500 text-milk'
                    : 'bg-bone-200 text-ink-500',
              )}
            >
              {step > s.n ? <Check size={14} /> : s.n}
            </div>
            <div
              className={clsx(
                'mt-1.5 text-[10px] text-center leading-tight w-16 hidden sm:block',
                step === s.n ? 'text-phthalo-500 font-semibold' : 'text-ink-400',
              )}
            >
              {s.label}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={clsx(
                'flex-1 h-0.5 mt-4 mx-1 transition-colors',
                step > s.n ? 'bg-maximum-400' : 'bg-bone-200',
              )}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
