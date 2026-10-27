/*
# Simplify status & event types

1. Data migration
- posts.status: 'in_office' / 'out_of_office' / 'off_duty' → 'available'
  (keeps 'in_training', 'on_leave', 'vacant' as-is)
- events.event_type: 'in_office' / 'out_of_office' → 'available'
2. Defaults
- posts.status default → 'available'
- events.event_type default → 'available'
3. Security
- No policy or grant changes (RLS already open for the no-auth app).
*/

UPDATE posts SET status = 'available'
WHERE status IN ('in_office', 'out_of_office', 'off_duty');

UPDATE events SET event_type = 'available'
WHERE event_type IN ('in_office', 'out_of_office');

ALTER TABLE posts ALTER COLUMN status SET DEFAULT 'available';
ALTER TABLE events ALTER COLUMN event_type SET DEFAULT 'available';
