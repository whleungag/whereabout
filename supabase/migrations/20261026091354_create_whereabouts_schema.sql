/*
# WhereAbouts Schema

## Purpose
Team schedule/whereabouts tracker. No authentication — all data is publicly readable and writable by anyone (no user accounts).

## Tables

### posts
Each "post" is a named slot (e.g. SE/TSG, E/TSG/1) that can optionally have a person assigned (nickname).
- id: primary key
- post_id: short identifier like "SE/TSG", "E/TSG/1"
- nickname: optional person name
- work_hours: optional text describing working hours
- status: current status (in_office, out_of_office, in_training, on_leave, off_duty, vacant)
- display_order: for ordering cards in the grid
- created_at, updated_at

### events
Each event belongs to a post and represents an out-of-office or notable occurrence.
- id: primary key
- post_id: FK to posts
- name: event title/name (e.g. "Training", "Annual Leave", "Medical appointment")
- event_type: 'out_of_office' | 'in_office'
- category: 'leave' | 'training' | 'meeting' | 'other' — drives color coding
- date_start: start date
- date_end: end date (same as start for single-day)
- time_slot: 'full_day' | 'am' | 'pm' | 'time'
- time_from, time_to: for time_slot='time'
- remarks: optional notes
- repeat_rule: optional repeat descriptor
- created_at

## Security
RLS enabled on both tables with open anon+authenticated policies (no-auth app, all data intentionally shared).
*/

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id text NOT NULL,
  nickname text,
  work_hours text,
  status text NOT NULL DEFAULT 'in_office',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  name text NOT NULL,
  event_type text NOT NULL DEFAULT 'out_of_office',
  category text NOT NULL DEFAULT 'other',
  date_start date NOT NULL,
  date_end date NOT NULL,
  time_slot text NOT NULL DEFAULT 'full_day',
  time_from text,
  time_to text,
  remarks text,
  repeat_rule text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_post_id_idx ON events(post_id);
CREATE INDEX IF NOT EXISTS events_date_start_idx ON events(date_start);
CREATE INDEX IF NOT EXISTS events_date_end_idx ON events(date_end);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON posts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_posts" ON posts;
CREATE POLICY "anon_select_posts" ON posts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_posts" ON posts;
CREATE POLICY "anon_insert_posts" ON posts FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_posts" ON posts;
CREATE POLICY "anon_update_posts" ON posts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_posts" ON posts;
CREATE POLICY "anon_delete_posts" ON posts FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE TO anon, authenticated USING (true);
