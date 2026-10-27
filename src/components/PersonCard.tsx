import { ArrowUpRight, CalendarDays, Circle } from 'lucide-react';
import { Event, Post } from '@/types';
import {
  CATEGORY_BAR,
  CATEGORY_COLORS,
  STATUS_CONFIG,
  computeStatus,
  formatDateRange,
  formatTimeSlot,
  isOngoing,
  isPast,
} from '@/lib/utils';

interface PersonCardProps {
  post: Post;
  events: Event[];
  onClick: () => void;
}

const MAX_VISIBLE = 4;

export default function PersonCard({ post, events, onClick }: PersonCardProps) {
  // Derive live status from active events; fall back to stored status
  const liveStatus = computeStatus(events, post.status);
  const isVacant = liveStatus === 'vacant';
  const cfg = STATUS_CONFIG[liveStatus];

  const upcoming = [...events]
    .filter(e => !isPast(e.date_end))
    .sort((a, b) => a.date_start.localeCompare(b.date_start));
  const visible  = upcoming.slice(0, MAX_VISIBLE);
  const overflow = upcoming.length - visible.length;

  return (
    <article
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[22px] border border-[#d8e4ed] bg-white p-4 shadow-[0_8px_24px_rgba(31,62,89,.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#9bcfc8] hover:shadow-[0_14px_34px_rgba(31,62,89,.12)] cursor-pointer ${isVacant ? 'opacity-65' : ''}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 transition-colors duration-300" style={{ backgroundColor: cfg.color }} />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#7790a6]">
            <span>{post.post_id}</span>
            {post.nickname && <span className="truncate normal-case tracking-normal text-[#123b5d]">· {post.nickname}</span>}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#8aa0b3]">
            <Circle className="h-2.5 w-2.5 fill-current transition-colors duration-300" style={{ color: cfg.color }} />
            {cfg.label}
          </div>
        </div>
        <button
          aria-label={`Open ${post.post_id}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#f1f6f9] text-[#7890a5] opacity-0 transition group-hover:opacity-100"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2 border-b border-[#edf2f6] pb-3 text-[11px] text-[#8aa0b3]">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>
          {upcoming.length === 0
            ? 'No upcoming entries'
            : `${upcoming.length} upcoming ${upcoming.length === 1 ? 'entry' : 'entries'}`}
        </span>
      </div>

      <div className="flex min-h-[108px] flex-col gap-1.5">
        {visible.map(event => {
          const ongoing = isOngoing(event.date_start, event.date_end);
          return (
            <div
              key={event.id}
              className={`flex min-w-0 items-center overflow-hidden rounded-lg border ${CATEGORY_COLORS[event.category]} ${ongoing ? 'ring-2 ring-[#b5eee0]/60' : ''}`}
            >
              <div className={`self-stretch w-1 shrink-0 ${CATEGORY_BAR[event.category]}`} />
              <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1.5 text-[11px]">
                <span className={`shrink-0 font-bold ${ongoing ? 'text-[#123b5d]' : ''}`}>
                  {formatDateRange(event.date_start, event.date_end)}
                </span>
                {event.time_slot !== 'full_day' && (
                  <span className="shrink-0 text-[#6f879c]">
                    {formatTimeSlot(event.time_slot, event.time_from, event.time_to)}
                  </span>
                )}
                <span className="truncate font-medium">{event.name}</span>
              </div>
            </div>
          );
        })}
        {overflow > 0 && (
          <div className="pl-2 text-[11px] font-semibold text-[#6f879c]">+{overflow} more in schedule</div>
        )}
      </div>
    </article>
  );
}
