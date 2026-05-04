import type React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users, Building2 } from 'lucide-react';
import type { EventItem } from '../lib/types';
import { PROGRAM_LABELS, PROGRAM_TONES } from '../lib/types';
import { formatDate } from '../lib/format';
import { StatusBadge } from './StatusBadge';

export function EventCard({ event, actions }: { event: EventItem; actions?: React.ReactNode }) {
  const programLabel = event.program ? PROGRAM_LABELS[event.program] : 'Program';
  const programTone  = event.program ? PROGRAM_TONES[event.program] : 'bg-bone-100 text-ink-700';

  return (
    <article className="card flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] uppercase tracking-[0.14em] font-semibold px-2 py-1 rounded-full ${programTone}`}>
              {programLabel}
            </span>
            {event.barangay && (
              <span className="eyebrow !mb-0">Brgy. {event.barangay}{event.sitio ? ` · ${event.sitio}` : ''}</span>
            )}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-phthalo-500">{event.title}</h3>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <p className="mt-3 text-sm text-ink-700 leading-relaxed line-clamp-3">{event.description}</p>

      <dl className="mt-4 grid grid-cols-1 gap-2 text-sm text-ink-700">
        <div className="flex items-center gap-2"><CalendarDays size={16} className="text-maximum-600"/>{formatDate(event.eventDate)} · {event.startTime}–{event.endTime}</div>
        <div className="flex items-center gap-2"><MapPin size={16} className="text-maximum-600"/>{event.location}</div>
        {event.targetChildren > 0 && (
          <div className="flex items-center gap-2"><Users size={16} className="text-maximum-600"/>Target: {event.targetChildren} children</div>
        )}
        {event.partnerOrg && (
          <div className="flex items-center gap-2"><Building2 size={16} className="text-maximum-600"/>{event.partnerOrg}</div>
        )}
      </dl>

      <div className="mt-auto pt-5 flex items-center justify-end gap-2">
        {actions}
        <Link to={`/events/${event.id}`} className="btn-primary">View &amp; sign up</Link>
      </div>
    </article>
  );
}
