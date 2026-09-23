-- ==============================================================================
-- CitiSent Complete Production Database Schema
-- Version: 2.0.0 (Full Parity Edition)
-- Target: Fresh Supabase Project (PostgreSQL 15+)
-- Contains: All 15 original tables + platform_audit_logs (16 tables total)
-- Instructions: Run this script directly in the Supabase SQL Editor.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ==============================================================================
-- 2. CUSTOM TYPES / ENUMS
-- ==============================================================================
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
-- 3. TABLE: agencies (Municipal Departments)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    logo_path TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agencies_slug ON public.agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_is_active ON public.agencies(is_active);

-- ==============================================================================
-- 4. TABLE: issue_types (Agency Specific Issue Categories)
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
-- 5. TABLE: profiles (Users, Citizens, Admins & Superadmins)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    phone_number VARCHAR(32),
    fname VARCHAR(100),
    mname VARCHAR(100),
    lname VARCHAR(100),
    age INTEGER,
    gender VARCHAR(20),
    client_type VARCHAR(50) DEFAULT 'citizen',
    app_role VARCHAR(50) DEFAULT 'citizen',
    account_type VARCHAR(50) DEFAULT 'citizen',
    role VARCHAR(50), -- 'Superadmin', 'Office Admin', or NULL for citizens
    department_id VARCHAR(64),
    department_label VARCHAR(160),
    barangay VARCHAR(100),
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Philippines',
    avatar_url TEXT,
    account_status VARCHAR(50) DEFAULT 'active',
    activation_status VARCHAR(50) DEFAULT 'active',
    invitation_token_hash VARCHAR(255),
    invitation_sent_at TIMESTAMPTZ,
    invitation_activated_at TIMESTAMPTZ,
    invitation_created_by_user_id UUID,
    display_id VARCHAR(6),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

-- 6-Digit Display ID Constraint & Trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_profiles_display_id'
          AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT chk_profiles_display_id
        CHECK (display_id IS NULL OR display_id ~ '^[1-9][0-9]{5}$');
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_display_id
ON public.profiles (display_id)
WHERE display_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_unique_display_id()
RETURNS VARCHAR(6) AS $$
DECLARE
    candidate VARCHAR(6);
    collision BOOLEAN;
    attempt_count INTEGER := 0;
    max_attempts CONSTANT INTEGER := 1000;
BEGIN
    LOOP
        attempt_count := attempt_count + 1;
        IF attempt_count > max_attempts THEN
            RAISE EXCEPTION 'Exceeded maximum attempts (%s) generating a unique 6-digit display ID', max_attempts;
        END IF;

        candidate := (FLOOR(100000 + RANDOM() * 900000))::TEXT;

        SELECT EXISTS (
            SELECT 1 FROM public.profiles WHERE display_id = candidate
        ) INTO collision;

        IF NOT collision THEN
            RETURN candidate;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_set_profiles_display_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_id IS NULL OR NEW.display_id = '' THEN
        NEW.display_id := public.generate_unique_display_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_set_display_id ON public.profiles;
CREATE TRIGGER trg_profiles_set_display_id
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_profiles_display_id();

-- ==============================================================================
-- 6. TABLE: agency_staff_users (Agency Staff Assignments)
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
-- 7. TABLE: reports (Citizen Civic Reports)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_number TEXT,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    issue_type_id UUID REFERENCES public.issue_types(id) ON DELETE SET NULL,
    issue_type VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(240) NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    status public.report_status DEFAULT 'pending' NOT NULL,
    sentiment_label VARCHAR(32),
    emotion_level TEXT DEFAULT 'Neutral',
    ai_summary TEXT,
    attachment_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_agency_id ON public.reports(agency_id);
CREATE INDEX IF NOT EXISTS idx_reports_issue_type_id ON public.reports(issue_type_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- ==============================================================================
-- 8. TABLE: report_number_sequences (Per-Agency Sequential Ticket Numbers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_number_sequences (
    agency_slug TEXT PRIMARY KEY,
    last_number INTEGER DEFAULT 0 NOT NULL
);

-- ==============================================================================
-- 9. TABLE: report_attachments (Multimedia Evidence for Reports)
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
-- 10. TABLE: report_comments (Internal & Public Discussion on Reports)
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
-- 11. TABLE: report_messages (Live Chat between Citizens & Responders)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_messages_report_id ON public.report_messages(report_id);
CREATE INDEX IF NOT EXISTS idx_report_messages_created_at ON public.report_messages(created_at ASC);

-- ==============================================================================
-- 12. TABLE: report_message_reads (Message Read Receipts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_message_reads (
    message_id UUID REFERENCES public.report_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (message_id, user_id)
);

-- ==============================================================================
-- 13. TABLE: report_status_history (Audit Trail of Report Lifecycle Changes)
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
-- 14. TABLE: notifications (System & Report Updates)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    type public.notification_type DEFAULT 'system' NOT NULL,
    title VARCHAR(140) NOT NULL,
    message TEXT NOT NULL,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ==============================================================================
-- 15. TABLE: banned_users (Citizen Moderation)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.banned_users (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    banned_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    banned_by_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    unbanned_at TIMESTAMPTZ,
    unbanned_by_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 16. TABLE: transfer_requests (Office Admin Department Transfers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    admin_name TEXT,
    current_department_id TEXT,
    current_department_label TEXT,
    requested_department_id TEXT NOT NULL,
    requested_department_label TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    reviewed_at TIMESTAMPTZ,
    reviewed_by_user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    reviewed_by_name TEXT,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON public.transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_admin ON public.transfer_requests(admin_user_id);

-- ==============================================================================
-- 17. TABLE: admin_activity_logs (Office Admin & Staff Activity Logs)
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
-- 18. TABLE: platform_audit_logs (Developer & Platform Ops Control Plane Audit Trail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_email VARCHAR(255) NOT NULL,
    actor_ip VARCHAR(64) NOT NULL,
    user_agent TEXT,
    action_type VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100),
    target_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_actor ON public.platform_audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_platform_audit_created_at ON public.platform_audit_logs(created_at DESC);

-- ==============================================================================
-- 19. SUPABASE STORAGE BUCKETS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('attachments', 'attachments', true),
    ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies: Public Read Access
CREATE POLICY "Public Read Attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

CREATE POLICY "Public Read Agency Logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'agency-logos');

-- ==============================================================================
-- 20. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public can view active agencies"
ON public.agencies FOR SELECT
USING (is_active = true);

CREATE POLICY "Public can view active issue types"
ON public.issue_types FOR SELECT
USING (is_active = true);
