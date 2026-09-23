-- ==============================================================================
-- CitiSent Production Database: Full Parity & Row Level Security (RLS) Fix
-- Target: Supabase Project (uxdiqljmtxtknsqnpzbu)
-- Description: 
--   1. Installs missing pg_trgm extension for similarity search & RPC parity.
--   2. Adds SECURITY DEFINER helper functions to prevent infinite recursion in RLS.
--   3. Restores missing report ticket counter trigger (e.g. bfp-0001, cto-0002).
--   4. Configures complete, production-grade Row Level Security (RLS) policies
--      across all 15 tables so citizens, admins, and background workers can
--      read/write without encountering code 42501 RLS violations.
--   5. Fixes Storage RLS policies for 'attachments' to allow citizen image uploads.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==============================================================================
-- 2. SECURITY DEFINER HELPER FUNCTIONS (Prevents Infinite RLS Recursion)
-- ==============================================================================

-- Helper: Check if the current authenticated caller is an Admin or Superadmin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND (
        role IN ('Superadmin', 'Office Admin')
        OR app_role IN ('admin', 'superadmin')
        OR account_type IN ('admin', 'superadmin')
      )
  );
$$;

-- Helper: Get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Helper: Check if current user has a specific role / department
CREATE OR REPLACE FUNCTION public.current_user_has_role(p_role_code TEXT, p_department_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_department_id IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND (role = p_role_code OR app_role = p_role_code)
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
        AND (role = p_role_code OR app_role = p_role_code)
        AND department_id = p_department_id::TEXT
    );
  END IF;
END;
$$;

-- Helper: Check if current user is Superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
      AND (role = 'Superadmin' OR app_role = 'superadmin')
  );
$$;

-- ==============================================================================
-- 3. SEQUENTIAL REPORT TICKET NUMBER GENERATOR (Parity with Old DB)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.report_number_sequences (
    agency_slug TEXT PRIMARY KEY,
    last_number INTEGER DEFAULT 0 NOT NULL
);

CREATE OR REPLACE FUNCTION public.trigger_set_report_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_slug TEXT;
    v_next_num INTEGER;
    v_agency_id UUID;
    v_issue_type_id UUID;
BEGIN
    -- Only generate ticket number if not explicitly supplied
    IF NEW.report_number IS NULL OR NEW.report_number = '' THEN
        v_slug := LOWER(TRIM(COALESCE(NEW.issue_type, 'gen')));
        
        -- Atomically increment counter for this agency category
        INSERT INTO public.report_number_sequences (agency_slug, last_number)
        VALUES (v_slug, 1)
        ON CONFLICT (agency_slug)
        DO UPDATE SET last_number = public.report_number_sequences.last_number + 1
        RETURNING last_number INTO v_next_num;
        
        NEW.report_number := v_slug || '-' || LPAD(v_next_num::TEXT, 4, '0');
    END IF;

    -- Automatically resolve agency_id if missing
    IF NEW.agency_id IS NULL AND NEW.issue_type IS NOT NULL THEN
        SELECT id INTO v_agency_id FROM public.agencies WHERE slug = LOWER(TRIM(NEW.issue_type)) LIMIT 1;
        IF v_agency_id IS NOT NULL THEN
            NEW.agency_id := v_agency_id;
        END IF;
    END IF;

    -- Automatically resolve issue_type_id if missing
    IF NEW.issue_type_id IS NULL AND NEW.agency_id IS NOT NULL THEN
        SELECT id INTO v_issue_type_id FROM public.issue_types WHERE agency_id = NEW.agency_id LIMIT 1;
        IF v_issue_type_id IS NOT NULL THEN
            NEW.issue_type_id := v_issue_type_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reports_set_report_number ON public.reports;
CREATE TRIGGER trg_reports_set_report_number
    BEFORE INSERT ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_report_number();

-- ==============================================================================
-- 4. STORAGE RLS POLICIES (Fixes "Upload failed: new row violates row-level security policy")
-- ==============================================================================

-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('attachments', 'attachments', true),
    ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing restrictive storage policies
DROP POLICY IF EXISTS "Public Read Attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload Attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow Update Attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow Delete Attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Agency Logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow Admin Agency Logos" ON storage.objects;

-- Attachments: Read access for everyone
CREATE POLICY "Public Read Attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

-- Attachments: Insert access for authenticated citizens & anon clients
CREATE POLICY "Allow Upload Attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attachments');

-- Attachments: Update access
CREATE POLICY "Allow Update Attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Attachments: Delete access
CREATE POLICY "Allow Delete Attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'attachments');

-- Agency Logos: Public Read
CREATE POLICY "Public Read Agency Logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'agency-logos');

-- Agency Logos: Admin manage
CREATE POLICY "Allow Admin Agency Logos"
ON storage.objects FOR ALL
USING (bucket_id = 'agency-logos' AND (public.is_admin() OR auth.role() = 'service_role'))
WITH CHECK (bucket_id = 'agency-logos');

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES ON ALL APPLICATION TABLES
-- ==============================================================================

-- Enable RLS across application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_number_sequences ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. TABLE: profiles
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;

CREATE POLICY "Profiles select policy"
ON public.profiles FOR SELECT
USING (
    auth.uid() = user_id 
    OR public.is_admin()
    OR auth.role() = 'service_role'
);

CREATE POLICY "Profiles insert policy"
ON public.profiles FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    OR public.is_admin()
    OR auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
);

CREATE POLICY "Profiles update policy"
ON public.profiles FOR UPDATE
USING (
    auth.uid() = user_id 
    OR public.is_admin()
    OR auth.role() = 'service_role'
)
WITH CHECK (
    auth.uid() = user_id 
    OR public.is_admin()
    OR auth.role() = 'service_role'
);

CREATE POLICY "Profiles delete policy"
ON public.profiles FOR DELETE
USING (
    public.is_admin() 
    OR auth.role() = 'service_role'
);

-- ------------------------------------------------------------------------------
-- B. TABLE: reports (Citizens, Admins, Public Feeds)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Reports select policy" ON public.reports;
DROP POLICY IF EXISTS "Reports insert policy" ON public.reports;
DROP POLICY IF EXISTS "Reports update policy" ON public.reports;
DROP POLICY IF EXISTS "Reports delete policy" ON public.reports;

-- Select: Citizens see own, Authenticated / Public see active community feed, Admins see all
CREATE POLICY "Reports select policy"
ON public.reports FOR SELECT
USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR auth.role() = 'authenticated'
    OR auth.role() = 'anon'
    OR auth.role() = 'service_role'
);

-- Insert: Authenticated citizens can submit civic reports
CREATE POLICY "Reports insert policy"
ON public.reports FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    OR auth.role() = 'authenticated'
    OR public.is_admin()
    OR auth.role() = 'service_role'
);

-- Update: Citizens can edit their own report; Admins can update status, triage, notes
CREATE POLICY "Reports update policy"
ON public.reports FOR UPDATE
USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
)
WITH CHECK (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

-- Delete: Report author or Admin can delete
CREATE POLICY "Reports delete policy"
ON public.reports FOR DELETE
USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

-- ------------------------------------------------------------------------------
-- C. TABLE: report_messages (Live Citizen-to-Admin Messaging)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Messages select policy" ON public.report_messages;
DROP POLICY IF EXISTS "Messages insert policy" ON public.report_messages;
DROP POLICY IF EXISTS "Messages update policy" ON public.report_messages;
DROP POLICY IF EXISTS "Messages delete policy" ON public.report_messages;

CREATE POLICY "Messages select policy"
ON public.report_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.reports 
        WHERE reports.id = report_messages.report_id 
          AND (reports.user_id = auth.uid() OR public.is_admin())
    )
    OR auth.role() = 'service_role'
);

CREATE POLICY "Messages insert policy"
ON public.report_messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

CREATE POLICY "Messages update policy"
ON public.report_messages FOR UPDATE
USING (
    auth.uid() = sender_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

CREATE POLICY "Messages delete policy"
ON public.report_messages FOR DELETE
USING (
    auth.uid() = sender_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

-- ------------------------------------------------------------------------------
-- D. TABLE: report_message_reads
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Message reads all policy" ON public.report_message_reads;

CREATE POLICY "Message reads all policy"
ON public.report_message_reads FOR ALL
USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
)
WITH CHECK (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

-- ------------------------------------------------------------------------------
-- E. TABLE: report_attachments
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Report attachments select policy" ON public.report_attachments;
DROP POLICY IF EXISTS "Report attachments insert policy" ON public.report_attachments;

CREATE POLICY "Report attachments select policy"
ON public.report_attachments FOR SELECT
USING (true);

CREATE POLICY "Report attachments insert policy"
ON public.report_attachments FOR INSERT
WITH CHECK (
    auth.uid() = uploaded_by 
    OR auth.role() = 'authenticated' 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

-- ------------------------------------------------------------------------------
-- F. TABLE: report_comments
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Report comments select policy" ON public.report_comments;
DROP POLICY IF EXISTS "Report comments insert policy" ON public.report_comments;

CREATE POLICY "Report comments select policy"
ON public.report_comments FOR SELECT
USING (
    is_internal = false 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

CREATE POLICY "Report comments insert policy"
ON public.report_comments FOR INSERT
WITH CHECK (
    auth.uid() = author_user_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

-- ------------------------------------------------------------------------------
-- G. TABLE: report_status_history
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Status history select policy" ON public.report_status_history;
DROP POLICY IF EXISTS "Status history insert policy" ON public.report_status_history;

CREATE POLICY "Status history select policy"
ON public.report_status_history FOR SELECT
USING (true);

CREATE POLICY "Status history insert policy"
ON public.report_status_history FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

-- ------------------------------------------------------------------------------
-- H. TABLE: notifications
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Notifications select policy" ON public.notifications;
DROP POLICY IF EXISTS "Notifications insert policy" ON public.notifications;
DROP POLICY IF EXISTS "Notifications update policy" ON public.notifications;
DROP POLICY IF EXISTS "Notifications delete policy" ON public.notifications;

CREATE POLICY "Notifications select policy"
ON public.notifications FOR SELECT
USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

CREATE POLICY "Notifications insert policy"
ON public.notifications FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

CREATE POLICY "Notifications update policy"
ON public.notifications FOR UPDATE
USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
)
WITH CHECK (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

CREATE POLICY "Notifications delete policy"
ON public.notifications FOR DELETE
USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR auth.role() = 'service_role'
);

-- ------------------------------------------------------------------------------
-- I. TABLE: agencies & issue_types (Departments and Categories)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active agencies" ON public.agencies;
DROP POLICY IF EXISTS "Agencies admin manage" ON public.agencies;
DROP POLICY IF EXISTS "Public can view active issue types" ON public.issue_types;
DROP POLICY IF EXISTS "Issue types admin manage" ON public.issue_types;

CREATE POLICY "Public can view active agencies"
ON public.agencies FOR SELECT
USING (is_active = true OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Agencies admin manage"
ON public.agencies FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Public can view active issue types"
ON public.issue_types FOR SELECT
USING (is_active = true OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Issue types admin manage"
ON public.issue_types FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- J. TABLE: banned_users
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Banned users select policy" ON public.banned_users;
DROP POLICY IF EXISTS "Banned users manage policy" ON public.banned_users;

CREATE POLICY "Banned users select policy"
ON public.banned_users FOR SELECT
USING (auth.uid() = user_id OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Banned users manage policy"
ON public.banned_users FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- K. TABLE: transfer_requests
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Transfer requests select policy" ON public.transfer_requests;
DROP POLICY IF EXISTS "Transfer requests insert policy" ON public.transfer_requests;
DROP POLICY IF EXISTS "Transfer requests update policy" ON public.transfer_requests;

CREATE POLICY "Transfer requests select policy"
ON public.transfer_requests FOR SELECT
USING (auth.uid() = admin_user_id OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Transfer requests insert policy"
ON public.transfer_requests FOR INSERT
WITH CHECK (auth.uid() = admin_user_id OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Transfer requests update policy"
ON public.transfer_requests FOR UPDATE
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- L. TABLE: admin_activity_logs
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Activity logs select policy" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "Activity logs insert policy" ON public.admin_activity_logs;

CREATE POLICY "Activity logs select policy"
ON public.admin_activity_logs FOR SELECT
USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Activity logs insert policy"
ON public.admin_activity_logs FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR public.is_admin() OR auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- M. TABLE: agency_staff_users
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Agency staff select policy" ON public.agency_staff_users;
DROP POLICY IF EXISTS "Agency staff manage policy" ON public.agency_staff_users;

CREATE POLICY "Agency staff select policy"
ON public.agency_staff_users FOR SELECT
USING (auth.uid() = user_id OR public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Agency staff manage policy"
ON public.agency_staff_users FOR ALL
USING (public.is_admin() OR auth.role() = 'service_role')
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ------------------------------------------------------------------------------
-- N. TABLE: report_number_sequences
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Report number sequences read policy" ON public.report_number_sequences;
CREATE POLICY "Report number sequences read policy"
ON public.report_number_sequences FOR SELECT
USING (true);

-- ------------------------------------------------------------------------------
-- O. TABLE: platform_audit_logs (Ops Control Plane)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_audit_logs') THEN
        ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Platform audit logs select policy" ON public.platform_audit_logs;
        DROP POLICY IF EXISTS "Platform audit logs insert policy" ON public.platform_audit_logs;
        CREATE POLICY "Platform audit logs select policy" ON public.platform_audit_logs FOR SELECT USING (public.is_admin() OR auth.role() = 'service_role');
        CREATE POLICY "Platform audit logs insert policy" ON public.platform_audit_logs FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- ==============================================================================
-- 6. VERIFICATION QUERY
-- ==============================================================================
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE schemaname IN ('public', 'storage')
ORDER BY tablename, cmd;
