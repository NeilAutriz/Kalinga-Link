import { Loader2, Apple, Soup, Pill, Brush, Wrench, Truck, Package, HeartHandshake, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import type { ResourceCategory, ResourceNeed } from '../../lib/types';
import type { CartItem } from '../../pages/DonatePage';
import { ProgressBar } from '../ProgressBar';
import { pct } from '../../lib/format';

const CATEGORY_ICON: Record<ResourceCategory, typeof Apple> = {
  food: Soup, utensils: Apple, art: Brush, hygiene: Pill,
  equipment: Wrench, transport: Truck, other: Package,
};
const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  food: 'Food', utensils: 'Utensils', art: 'Art / books', hygiene: 'Hygiene',
  equipment: 'Equipment', transport: 'Transport', other: 'Other',
};

const urgencyFor = (r: ResourceNeed): { label: string; cls: string } => {
  const remaining = r.quantityNeeded - r.quantityReceived;
  if (remaining <= 0)                             return { label: 'Fully pledged', cls: 'badge-bone' };
  if (r.quantityReceived === 0)                   return { label: 'Not yet pledged', cls: 'badge-warn' };
  if (remaining / r.quantityNeeded < 0.25)        return { label: 'Almost complete', cls: 'badge-info' };
  if (remaining / r.quantityNeeded > 0.7)         return { label: 'Most needed', cls: 'badge-danger' };
  return { label: 'In progress', cls: 'badge-green' };
};

interface Props {
  resources: ResourceNeed[];
  loading: boolean;
  cart: CartItem[];
  onAddToCart: (need: ResourceNeed) => void;
  onRemoveFromCart: (needId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Supplies({ resources, loading, cart, onAddToCart, onRemoveFromCart, onNext, onBack }: Props) {
  const openResources = resources.filter((r) => r.quantityReceived < r.quantityNeeded);
  const pledgeIds = new Set(cart.map((c) => c.resourceNeed.id));

  if (loading) {
    return (
      <div className="text-ink-500 flex items-center gap-2 text-sm py-4">
        <Loader2 className="animate-spin" size={14} /> Loading supplies…
      </div>
    );
  }

  if (openResources.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-500 py-2">
          All supplies for this visit are fully pledged. Go back to choose another visit.
        </p>
        <button type="button" onClick={onBack} className="btn-outline btn-sm flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {openResources.map((r) => {
          const Icon = CATEGORY_ICON[r.category];
          const u = urgencyFor(r);
          const left = r.quantityNeeded - r.quantityReceived;
          const inPledge = pledgeIds.has(r.id);

          return (
            <div
              key={r.id}
              className={clsx(
                'rounded-2xl border p-4 transition',
                inPledge ? 'border-maximum-500 bg-maximum-50' : 'border-bone-200 bg-milk',
              )}
            >
              <div className="flex items-start gap-3">
                <div className={clsx(
                  'h-9 w-9 grid place-items-center rounded-xl shrink-0',
                  inPledge ? 'bg-maximum-100 text-maximum-700' : 'bg-bone-100 text-ink-700',
                )}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-phthalo-500 leading-snug">{r.itemName}</div>
                    <span className={clsx(u.cls, '!text-[10px] !py-0.5 shrink-0')}>{u.label}</span>
                  </div>
                  <div className="text-[11px] text-ink-500 mt-0.5">{CATEGORY_LABEL[r.category]}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-700">
                    <span>{r.quantityReceived} / {r.quantityNeeded} {r.unit}</span>
                    <span className="text-maximum-700 font-medium">{left} {r.unit} left</span>
                  </div>
                  <ProgressBar value={pct(r.quantityReceived, r.quantityNeeded)} tone="maximum" />
                  <div className="mt-3">
                    {inPledge ? (
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(r.id)}
                        className="flex items-center gap-1.5 text-[11px] text-maximum-700 font-medium hover:text-red-600 transition-colors"
                      >
                        <CheckCircle2 size={13} /> In pledge — remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddToCart(r)}
                        className="flex items-center gap-1.5 text-[11px] btn-outline btn-sm !py-1 !px-2.5"
                      >
                        <HeartHandshake size={12} /> Add to pledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-bone-100">
        <button type="button" onClick={onBack} className="btn-outline btn-sm flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={cart.length === 0}
          className="btn-primary btn-sm flex items-center gap-1.5"
        >
          {cart.length === 0
            ? 'Add items to continue'
            : `Review pledge (${cart.length} item${cart.length > 1 ? 's' : ''})`}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
