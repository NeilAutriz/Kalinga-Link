import type { ResourceNeed } from '../lib/types';
import { ProgressBar } from './ProgressBar';
import { pct } from '../lib/format';
import { Apple, Utensils, Palette, Sparkles, Wrench, Truck, Package } from 'lucide-react';

const iconMap = {
  food: Apple, utensils: Utensils, art: Palette, hygiene: Sparkles,
  equipment: Wrench, transport: Truck, other: Package,
} as const;

export function ResourceItem({ resource, onPledge }: { resource: ResourceNeed; onPledge?: () => void }) {
  const Icon = iconMap[resource.category];
  const percent = pct(resource.quantityReceived, resource.quantityNeeded);
  const done = percent >= 100;
  return (
    <div className="card-tight">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 grid place-items-center rounded-lg bg-maximum-50 text-maximum-600">
            <Icon size={18}/>
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-phthalo-500 truncate">{resource.itemName}</div>
            <div className="text-xs text-ink-500 capitalize">{resource.category}</div>
          </div>
        </div>
        <div className={done ? 'badge-green' : 'badge-bone'}>
          {resource.quantityReceived} / {resource.quantityNeeded} {resource.unit}
        </div>
      </div>
      <div className="mt-3"><ProgressBar value={percent} tone={done ? 'phthalo' : 'maximum'} /></div>
      <div className="mt-3 flex justify-end">
        {done ? (
          <span className="text-xs text-maximum-700 font-medium">Fully pledged · thank you!</span>
        ) : (
          <button onClick={onPledge} className="btn-outline btn-sm">Pledge</button>
        )}
      </div>
    </div>
  );
}
