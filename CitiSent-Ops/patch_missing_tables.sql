-- ==============================================================================
-- CitiSent Production Database Patch: Missing Tables
-- Purpose: Safely adds the 7 missing tables and required enums to bring the new
--          database to 100% parity with the existing CitySent database (15 tables + audit log).
-- Instructions: Run this script directly in the Supabase SQL Editor on your new project.
-- ==============================================================================

-- 1. EXTENSIONS & CUSTOM ENUM TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attachment_kind') THEN
        CREATE TYPE public.attachment_kind AS ENUM ('image', 'video', 'document');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE public.report_status AS ENUM ('pending', 'in_review', 'resolved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE public.notification_type AS ENUM ('status', 'report', 'account', 'alert', 'system');
    END IF;
END $$;

-- ==============================================================================
-- 2. TABLE: issue_types (Agency Specific Issue Categories)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.issue_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    code public.citext NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_issue_types_agency_id ON public.issue_types(agency_id);
CREATE INDEX IF NOT EXISTS idx_issue_types_code ON public.issue_types(code);
CREATE INDEX IF NOT EXISTS idx_issue_types_is_active ON public.issue_types(is_active);

-- ==============================================================================
-- 3. TABLE: agency_staff_users (Agency Staff Assignments)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.agency_staff_users (
    user_id UUID NOT NULL,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'agency_staff' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, agency_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_staff_users_agency_id ON public.agency_staff_users(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_staff_users_user_id ON public.agency_staff_users(user_id);

-- ==============================================================================
-- 4. TABLE: report_number_sequences (Per-Agency Sequential Ticket Numbers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_number_sequences (
    agency_slug TEXT PRIMARY KEY,
    last_number INTEGER DEFAULT 0 NOT NULL
);

-- ==============================================================================
-- 5. TABLE: report_attachments (Multimedia Evidence for Reports)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    kind public.attachment_kind DEFAULT 'image' NOT NULL,
    storage_bucket TEXT,
    storage_path TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    public_url TEXT,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_attachments_report_id ON public.report_attachments(report_id);
CREATE INDEX IF NOT EXISTS idx_report_attachments_kind ON public.report_attachments(kind);

-- ==============================================================================
-- 6. TABLE: report_comments (Internal & Public Discussion on Reports)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    author_user_id UUID NOT NULL,
    body TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_comments_report_id ON public.report_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_report_comments_author ON public.report_comments(author_user_id);

-- ==============================================================================
-- 7. TABLE: report_status_history (Audit Trail of Report Lifecycle Changes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    from_status public.report_status,
    to_status public.report_status NOT NULL,
    changed_by UUID,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_status_history_report_id ON public.report_status_history(report_id);
CREATE INDEX IF NOT EXISTS idx_report_status_history_created_at ON public.report_status_history(created_at DESC);

-- ==============================================================================
-- 8. TABLE: admin_activity_logs (Office Admin & Staff Activity Logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID,
    action VARCHAR(160) NOT NULL,
    detail TEXT DEFAULT '' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_user_id ON public.admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);

-- ==============================================================================
-- 9. LINK reports.issue_type_id TO issue_types (Optional / Idempotent)
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_reports_issue_type'
    ) THEN
        -- Safely cast issue_type_id to UUID if needed, or link constraint
        BEGIN
            ALTER TABLE public.reports 
            ALTER COLUMN issue_type_id TYPE UUID USING (
                CASE WHEN issue_type_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                THEN issue_type_id::UUID 
                ELSE NULL END
            );
            ALTER TABLE public.reports 
            ADD CONSTRAINT fk_reports_issue_type 
            FOREIGN KEY (issue_type_id) REFERENCES public.issue_types(id) ON DELETE SET NULL;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Constraint fk_reports_issue_type already exists or skipped: %', SQLERRM;
        END;
    END IF;
END $$;
