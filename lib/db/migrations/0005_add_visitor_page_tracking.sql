-- Add currentPage and lastSeenAt to visitors table for accurate page tracking
ALTER TABLE mawashi_visitors ADD COLUMN IF NOT EXISTS current_page TEXT;
ALTER TABLE mawashi_visitors ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
