export type Status = 'available' | 'in_training' | 'on_leave' | 'meeting' | 'other_engagement' | 'vacant';
export type TimeSlot = 'full_day' | 'am' | 'pm' | 'time';
export type EventType = 'available';
export type EventCategory = 'leave' | 'training' | 'meeting' | 'other';
export type DateMode = 'single' | 'range' | 'multi';

export interface Post {
  id: string;
  post_id: string;
  nickname: string | null;
  work_hours: string | null;
  status: Status;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  post_id: string;
  name: string;
  event_type: EventType;
  category: EventCategory;
  date_start: string;
  date_end: string;
  time_slot: TimeSlot;
  time_from: string | null;
  time_to: string | null;
  remarks: string | null;
  repeat_rule: string | null;
  created_at: string;
}

export interface PostWithEvents extends Post {
  events: Event[];
}
