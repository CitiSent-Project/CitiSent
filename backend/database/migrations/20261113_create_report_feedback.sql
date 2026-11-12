-- Migration: Create report_feedback table for Resident Feedback on Government Solutions
-- Date: 2026-11-13
-- Purpose: Allow residents to rate (1-5 stars) and submit feedback on resolved reports,
--          with strict foreign keys, uniqueness constraints (1 feedback per report),
--          and Row Level Security (RLS) policies for citizens and government admins.

-- 1. Create the report_feedback table
CREATE TABLE IF NOT EXISTS public.report_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL UNIQUE REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_satisfied BOOLEAN NULL,
  comment TEXT NULL CHECK (comment IS NULL OR char_length(comment) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.report_feedback IS 'Stores resident feedback and 1-5 star ratings evaluating government solutions for resolved reports';
COMMENT ON COLUMN public.report_feedback.report_id IS 'Foreign key to public.reports(id); UNIQUE constraint enforces at most one feedback submission per report';
COMMENT ON COLUMN public.report_feedback.user_id IS 'Foreign key to auth.users(id); the resident who originally submitted the report';
COMMENT ON COLUMN public.report_feedback.rating IS 'Resident star rating from 1 (Poor) to 5 (Excellent)';
COMMENT ON COLUMN public.report_feedback.is_satisfied IS 'Optional resident response indicating whether they are satisfied with the solution provided';
COMMENT ON COLUMN public.report_feedback.comment IS 'Written resident feedback explaining their experience with the government resolution';

-- 2. Create indexes for fast lookups and analytics aggregation
CREATE INDEX IF NOT EXISTS idx_report_feedback_report_id ON public.report_feedback (report_id);
CREATE INDEX IF NOT EXISTS idx_report_feedback_user_id ON public.report_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_report_feedback_rating ON public.report_feedback (rating);
CREATE INDEX IF NOT EXISTS idx_report_feedback_created_at ON public.report_feedback (created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.report_feedback ENABLE ROW LEVEL SECURITY;

-- Policy 1: Residents can view their own submitted feedback
DROP POLICY IF EXISTS "report_feedback_select_own" ON public.report_feedback;
CREATE POLICY "report_feedback_select_own"
  ON public.report_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Residents can insert feedback only for their own resolved reports
DROP POLICY IF EXISTS "report_feedback_insert_own_resolved" ON public.report_feedback;
CREATE POLICY "report_feedback_insert_own_resolved"
  ON public.report_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.reports r
      WHERE r.id = report_feedback.report_id
        AND r.user_id = auth.uid()
        AND r.status = 'resolved'
    )
  );

-- Policy 3: Authorized government employees (Office Admin & Superadmin) can view feedback
DROP POLICY IF EXISTS "report_feedback_select_admin" ON public.report_feedback;
CREATE POLICY "report_feedback_select_admin"
  ON public.report_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND (
          lower(coalesce(p.account_type, '')) = 'admin'
          OR lower(coalesce(p.role, '')) IN (
            'superadmin',
            'super admin',
            'administrator',
            'admin',
            'office admin',
            'office-admin'
          )
        )
    )
  );

-- 4. Backfill any existing structured feedback stored in public.report_comments (if applicable)
INSERT INTO public.report_feedback (id, report_id, user_id, rating, is_satisfied, comment, created_at, updated_at)
SELECT
  rc.id,
  rc.report_id,
  rc.author_user_id,
  ((rc.body::jsonb) ->> 'rating')::smallint,
  CASE
    WHEN (rc.body::jsonb) ->> 'isSatisfied' = 'true' THEN TRUE
    WHEN (rc.body::jsonb) ->> 'isSatisfied' = 'false' THEN FALSE
    ELSE NULL
  END,
  NULLIF((rc.body::jsonb) ->> 'comment', ''),
  rc.created_at,
  rc.updated_at
FROM public.report_comments rc
WHERE rc.is_internal = FALSE
  AND rc.body LIKE '{"__type":"resident_feedback"%'
ON CONFLICT (report_id) DO NOTHING;

-- Down Migration (Rollback):
-- DROP POLICY IF EXISTS "report_feedback_select_admin" ON public.report_feedback;
-- DROP POLICY IF EXISTS "report_feedback_insert_own_resolved" ON public.report_feedback;
-- DROP POLICY IF EXISTS "report_feedback_select_own" ON public.report_feedback;
-- DROP INDEX IF EXISTS public.idx_report_feedback_created_at;
-- DROP INDEX IF EXISTS public.idx_report_feedback_rating;
-- DROP INDEX IF EXISTS public.idx_report_feedback_user_id;
-- DROP INDEX IF EXISTS public.idx_report_feedback_report_id;
-- DROP TABLE IF EXISTS public.report_feedback;

