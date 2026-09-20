-- ==============================================================================
-- Migration: 001_add_display_id_to_profiles.sql
-- Description: Adds a user-friendly, unique, non-duplicating random 6-digit User ID
--              (range: 100000 to 999999) to the profiles table.
-- Author: CitiSent Architectural Engineering
-- Standards: backend-architect, database-optimizer
-- ==============================================================================

-- 1. Add display_id column if it doesn't already exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_id VARCHAR(6);

-- 2. Add comment for schema documentation
COMMENT ON COLUMN public.profiles.display_id IS 'Public user-friendly 6-digit unique identifier (100000-999999)';

-- 3. Add constraint to enforce exactly 6 numeric digits without leading zero
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

-- 4. Create Unique Index to guarantee zero duplication across all users
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_display_id
ON public.profiles (display_id)
WHERE display_id IS NOT NULL;

-- 5. Stored function to generate a guaranteed unique random 6-digit ID
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

        -- Generate a cryptographically uniform random integer between 100000 and 999999
        candidate := (FLOOR(100000 + RANDOM() * 900000))::TEXT;

        -- Verify uniqueness against existing profiles
        SELECT EXISTS (
            SELECT 1 FROM public.profiles WHERE display_id = candidate
        ) INTO collision;

        IF NOT collision THEN
            RETURN candidate;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- 6. Trigger function to automatically assign display_id on INSERT if not provided
CREATE OR REPLACE FUNCTION public.trigger_set_profiles_display_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_id IS NULL OR NEW.display_id = '' THEN
        NEW.display_id := public.generate_unique_display_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Attach BEFORE INSERT trigger to profiles table
DROP TRIGGER IF EXISTS trg_profiles_set_display_id ON public.profiles;
CREATE TRIGGER trg_profiles_set_display_id
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_profiles_display_id();

-- ==============================================================================
-- ROLLBACK SCRIPT (Execute in Supabase SQL Editor if reversal is ever required):
-- ==============================================================================
-- DROP TRIGGER IF EXISTS trg_profiles_set_display_id ON public.profiles;
-- DROP FUNCTION IF EXISTS public.trigger_set_profiles_display_id();
-- DROP FUNCTION IF EXISTS public.generate_unique_display_id();
-- DROP INDEX IF EXISTS public.idx_profiles_display_id;
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_display_id;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_id;
-- ==============================================================================
