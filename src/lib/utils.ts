import { Status, EventCategory, TimeSlot, Event } from '@/types';

export const STATUS_CONFIG: Record<Status, { label: string; color: string; dotClass: string }> = {
  available:         { label: 'Available',         color: '#22c55e', dotClass: 'bg-green-500' },
  in_training:       { label: 'In Training',       color: '#a855f7', dotClass: 'bg-purple-500' },
  on_leave:          { label: 'On Leave',          color: '#60a5fa', dotClass: 'bg-blue-400' },
  meeting:           { label: 'Meeting',           color: '#f59e0b', dotClass: 'bg-amber-400' },
  other_engagement:  { label: 'Other Engagement',  color: '#ef4444', dotClass: 'bg-red-500' },
  vacant:            { label: 'Vacant',            color: '#d1d5db', dotClass: 'bg-gray-200' },
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  leave:    'bg-blue-100 border-blue-300 text-blue-800',
  training: 'bg-purple-100 border-purple-300 text-purple-800',
  meeting:  'bg-amber-100 border-amber-300 text-amber-800',
  other:    'bg-gray-100 border-gray-300 text-gray-700',
};

export const CATEGORY_BAR: Record<EventCategory, string> = {
  leave:    'bg-blue-400',
  training: 'bg-purple-400',
  meeting:  'bg-amber-400',
  other:    'bg-gray-400',
};

export const CATEGORY_CAL: Record<EventCategory, string> = {
  leave:    'bg-blue-200 text-blue-900',
  training: 'bg-purple-200 text-purple-900',
  meeting:  'bg-amber-200 text-amber-900',
  other:    'bg-gray-200 text-gray-900',
};

export const CATEGORY_KEYWORDS: Record<EventCategory, string[]> = {
  leave:    ['AL', 'VL', 'SL', 'leave', 'annual', 'vacation', 'holiday', 'off'],
  training: ['training', 'train', 'course', 'seminar', 'workshop'],
  meeting:  ['meeting', 'meet', 'briefing', 'presentation', 'conference', 'discussion'],
  other:    ['medical', 'appointment', 'site visit', 'offsite', 'WFH', '(anything else)'],
};

export function inferCategory(name: string): EventCategory {
  const n = name.toLowerCase().trim();
  const words = n.split(/[\s,/-]+/);

  // Exact word match for short abbreviations
  if (words.some(w => ['al', 'vl', 'sl'].includes(w))) return 'leave';

  // Substring matches for longer terms
  if (
    n.includes('leave') || n.includes('annual') || n.includes('vacation') ||
    n.includes('holiday') || n.includes('time off') || n.includes('time-off')
  ) return 'leave';

  if (
    n.includes('train') || n.includes('course') ||
    n.includes('seminar') || n.includes('workshop')
  ) return 'training';

  if (
    n.includes('meet') || n.includes('briefing') ||
    n.includes('presentation') || n.includes('conference') || n.includes('discussion')
  ) return 'meeting';

  return 'other';
}

/** Derive the live status for a person from their active events today. */
export function computeStatus(events: Event[], baseStatus: Status): Status {
  const todayStr = toDateString(new Date());
  const active = events.filter(e => e.date_start <= todayStr && todayStr <= e.date_end);
  if (active.length === 0) return baseStatus;

  // Priority: leave > training > meeting > other
  if (active.some(e => e.category === 'leave'))    return 'on_leave';
  if (active.some(e => e.category === 'training')) return 'in_training';
  if (active.some(e => e.category === 'meeting'))  return 'meeting';
  if (active.some(e => e.category === 'other'))    return 'other_engagement';

  return baseStatus;
}

export type RepeatFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

/** Expand a single base-event date range into repeated occurrences up to untilDate. */
export function expandRepeat(
  baseStart: string,
  baseEnd: string,
  frequency: Exclude<RepeatFrequency, 'none'>,
  untilDate: string,
): { start: string; end: string }[] {
  const pairs: { start: string; end: string }[] = [];
  const s = new Date(baseStart + 'T00:00:00');
  const e = new Date(baseEnd + 'T00:00:00');
  const until = new Date(untilDate + 'T00:00:00');
  const durationMs = e.getTime() - s.getTime();
  const cur = new Date(s);
  const MAX = 52;

  while (cur <= until && pairs.length < MAX) {
    pairs.push({
      start: toDateString(cur),
      end: toDateString(new Date(cur.getTime() + durationMs)),
    });
    if (frequency === 'daily')    cur.setDate(cur.getDate() + 1);
    else if (frequency === 'weekly')   cur.setDate(cur.getDate() + 7);
    else if (frequency === 'biweekly') cur.setDate(cur.getDate() + 14);
    else if (frequency === 'monthly')  cur.setMonth(cur.getMonth() + 1);
  }

  return pairs;
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  if (start === end) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    if (s.getTime() === today.getTime())    return 'Today';
    if (s.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return `${s.getDate()} ${months[s.getMonth()]}`;
  }

  const sy = s.getFullYear(); const ey = e.getFullYear();
  const shortYear = (y: number) => `'${String(y).slice(2)}`;
  if (sy === ey) {
    if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ${months[s.getMonth()]}`;
    return `${s.getDate()} ${months[s.getMonth()]} – ${e.getDate()} ${months[e.getMonth()]}`;
  }
  return `${s.getDate()} ${months[s.getMonth()]} – ${e.getDate()} ${months[e.getMonth()]} ${shortYear(ey)}`;
}

export function formatTimeSlot(slot: TimeSlot, from?: string | null, to?: string | null): string {
  if (slot === 'am') return 'AM';
  if (slot === 'pm') return 'PM';
  if (slot === 'time' && from && to) return `${from}–${to}`;
  return '';
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime();
}

export function isPast(end: string): boolean {
  const e = new Date(end + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return e < today;
}

export function isOngoing(start: string, end: string): boolean {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return s <= today && today <= e;
}

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
