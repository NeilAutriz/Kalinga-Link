import { Minus, Plus, Trash2, ArrowLeft, ArrowRight, Apple, Soup, Pill, Brush, Wrench, Truck, Package, ClipboardList } from 'lucide-react';
import clsx from 'clsx';
import type { ResourceCategory } from '../../lib/types';
import type { CartItem } from '../../pages/DonatePage';

const CATEGORY_ICON: Record<ResourceCategory, typeof Apple> = {
  food: Soup, utensils: Apple, art: Brush, hygiene: Pill,
  equipment: Wrench, transport: Truck, other: Package,
};
const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  food: 'Food', utensils: 'Utensils', art: 'Art / books', hygiene: 'Hygiene',
  equipment: 'Equipment', transport: 'Transport', other: 'Other',
};

interface Props {
  cart: CartItem[];
  onUpdateQuantity: (needId: string, qty: number) => void;
  onRemove: (needId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Cart({ cart, onUpdateQuantity, onRemove, onNext, onBack }: Props) {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center py-10 text-center text-ink-500">
          <ClipboardList size={32} className="mb-3 text-bone-300" />
          <p className="text-sm">Your pledge is empty. Go back to add supplies.</p>
        </div>
        <div className="pt-4 border-t border-bone-100">
          <button type="button" onClick={onBack} className="btn-outline flex items-center gap-1.5">
            <ArrowLeft size={14} /> Back to supplies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pledge items — quantity controls */}
      <div className="divide-y divide-bone-100 rounded-2xl border border-bone-200 overflow-hidden">
        {cart.map((item) => {
          const { resourceNeed: r, quantity } = item;
          const remaining = r.quantityNeeded - r.quantityReceived;
          const Icon = CATEGORY_ICON[r.category];

          return (
            <div key={r.id} className="p-4 bg-milk flex items-start gap-3">
              <div className="h-9 w-9 grid place-items-center rounded-xl shrink-0 bg-bone-100 text-ink-700">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-phthalo-500 leading-snug">{r.itemName}</div>
                    <div className="text-[11px] text-ink-500">{CATEGORY_LABEL[r.category]}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(r.id)}
                    className="text-ink-400 hover:text-red-600 transition-colors p-0.5 shrink-0"
                    aria-label={`Remove ${r.itemName}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-outline !px-2.5 !py-1"
                    disabled={quantity <= 1}
                    onClick={() => onUpdateQuantity(r.id, Math.max(1, quantity - 1))}
                  >
                    <Minus size={12} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={remaining}
                    className="input text-center !w-20 !py-1 !text-sm"
                    value={quantity}
                    onChange={(e) =>
                      onUpdateQuantity(r.id, Math.max(1, Math.min(remaining, Number(e.target.value) || 1)))
                    }
                  />
                  <button
                    type="button"
                    className="btn-outline !px-2.5 !py-1"
                    disabled={quantity >= remaining}
                    onClick={() => onUpdateQuantity(r.id, Math.min(remaining, quantity + 1))}
                  >
                    <Plus size={12} />
                  </button>
                  <span className="text-[11px] text-ink-500">{r.unit}</span>
                  <span className="text-[11px] text-ink-400">(max {remaining})</span>
                </div>

                {remaining > 1 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[1, Math.ceil(remaining / 4), Math.ceil(remaining / 2), remaining]
                      .filter((v, i, a) => v >= 1 && a.indexOf(v) === i)
                      .map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => onUpdateQuantity(r.id, v)}
                          className={clsx(
                            'badge cursor-pointer !text-[10px] !py-0.5',
                            quantity === v ? 'bg-phthalo-500 text-milk' : 'bg-bone-100 text-ink-700 hover:bg-bone-200',
                          )}
                        >
                          {v === remaining ? `All (${v})` : v}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Receipt-style pledge summary */}
      <div className="rounded-2xl border border-bone-200 overflow-hidden">
        <div className="bg-bone-50 px-4 py-2.5 border-b border-bone-200">
          <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-ink-500">Pledge summary</span>
        </div>
        {cart.map((c, i) => (
          <div
            key={c.resourceNeed.id}
            className={clsx(
              'flex items-center justify-between px-4 py-2.5 bg-milk',
              i < cart.length - 1 && 'border-b border-bone-100',
            )}
          >
            <div className="min-w-0">
              <span className="text-sm text-ink-700">{c.resourceNeed.itemName}</span>
              <span className="ml-2 text-[11px] text-ink-400">{CATEGORY_LABEL[c.resourceNeed.category]}</span>
            </div>
            <span className="text-sm font-semibold text-phthalo-500 shrink-0 ml-4">
              {c.quantity} {c.resourceNeed.unit}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-2.5 bg-bone-50 border-t border-bone-200">
          <span className="text-sm font-semibold text-ink-700">
            {cart.length} item{cart.length > 1 ? 's' : ''} pledged
          </span>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-bone-100">
        <button type="button" onClick={onBack} className="btn-outline w-full sm:w-auto flex items-center justify-center gap-1.5">
          <ArrowLeft size={14} /> Back
        </button>
        <button type="button" onClick={onNext} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-1.5">
          Enter your details <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
