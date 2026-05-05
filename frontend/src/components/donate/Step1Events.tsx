import { Calendar, MapPin, Sparkles, Loader2, Utensils, Stethoscope, BookOpen, Leaf, Briefcase, Palette, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { EventItem, ResourceNeed, Program } from '../../lib/types';
import { PROGRAM_LABELS } from '../../lib/types';
import { formatDate } from '../../lib/format';

const PROGRAM_ICON: Record<Program, typeof Utensils> = {
  feeding: Utensils, health: Stethoscope, learning: BookOpen,
  environment: Leaf, livelihood: Briefcase, youth: Palette,
};

interface Props {
  events: EventItem[];
  allResources: ResourceNeed[];
  loading: boolean;
  onSelect: (event: EventItem) => void;
}

export function Step1Events({ events, allResources, loading, onSelect }: Props) {
  const eventsWithOpenNeeds = events.filter((ev) =>
    allResources.some((r) => r.eventId === ev.id && r.quantityReceived < r.quantityNeeded),
  );

  if (loading) {
    return (
      <div className="text-ink-500 flex items-center gap-2 text-sm py-4">
        <Loader2 className="animate-spin" size={14} /> Loading visits…
      </div>
    );
  }

  if (eventsWithOpenNeeds.length === 0) {
    return (
      <p className="text-sm text-ink-500 py-4">
        All supplies for upcoming visits are fully pledged. Please check back soon.
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {eventsWithOpenNeeds.map((ev) => {
        const Icon = ev.program ? PROGRAM_ICON[ev.program] : Sparkles;
        const openCount = allResources.filter(
          (r) => r.eventId === ev.id && r.quantityReceived < r.quantityNeeded,
        ).length;
        const totalCount = allResources.filter((r) => r.eventId === ev.id).length;

        return (
          <button
            type="button"
            key={ev.id}
            onClick={() => onSelect(ev)}
            className="text-left rounded-2xl border border-bone-200 bg-milk p-4 transition hover:border-maximum-300 hover:shadow-soft focus:outline-none focus-visible:ring-4 focus-visible:ring-maximum-100 group"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 grid place-items-center rounded-xl shrink-0 bg-phthalo-50 text-phthalo-500 group-hover:bg-maximum-100 group-hover:text-maximum-700 transition-colors">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-maximum-600">
                  {ev.program ? PROGRAM_LABELS[ev.program] : 'Visit'}
                </div>
                <div className="text-sm font-semibold text-phthalo-500 leading-snug line-clamp-2">{ev.title}</div>
                <div className="mt-1 text-[11px] text-ink-500 flex items-center gap-1.5">
                  <Calendar size={11} />{formatDate(ev.eventDate)} · {ev.startTime}
                </div>
                <div className="text-[11px] text-ink-500 flex items-center gap-1.5">
                  <MapPin size={11} />{ev.sitio || ev.location}
                </div>
                <div className="mt-2 text-[11px] font-medium text-maximum-700">
                  {openCount} of {totalCount} {totalCount === 1 ? 'supply' : 'supplies'} still needed
                </div>
              </div>
              <ChevronRight size={16} className="mt-1 shrink-0 text-ink-400 group-hover:text-maximum-500 transition-colors" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
