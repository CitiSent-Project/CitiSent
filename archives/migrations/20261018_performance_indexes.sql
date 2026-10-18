-- 20261018_performance_indexes.sql
-- Non-destructive performance and indexing migration for CitiSent PostgreSQL / Supabase

-- 1. Enable pg_trgm extension for fast wildcard/ilike text searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN Trigram index for composite search across profiles (email, username, fname, lname, display_id)
CREATE INDEX IF NOT EXISTS idx_profiles_trgm_search ON profiles USING gin (
  (
    COALESCE(email, '') || ' ' ||
    COALESCE(username, '') || ' ' ||
    COALESCE(fname, '') || ' ' ||
    COALESCE(lname, '') || ' ' ||
    COALESCE(display_id, '') || ' ' ||
    COALESCE(phone_number, '')
  ) gin_trgm_ops
);

-- 3. Composite B-Tree index for active ban lookups by user ID
CREATE INDEX IF NOT EXISTS idx_banned_users_user_active ON banned_users (user_id, is_active);

-- 4. Composite B-Tree index for report message read state lookups
CREATE INDEX IF NOT EXISTS idx_report_message_reads_lookup ON report_message_reads (message_id, user_id, is_read);

-- 5. Index on report status and issue type for filtered admin queries
CREATE INDEX IF NOT EXISTS idx_reports_status_issue_type ON reports (status, issue_type);
