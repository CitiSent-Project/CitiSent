-- Migration: Add phone_verified and phone_verified_at to profiles
-- Date: 2026-10-21
-- Purpose: Support SMS OTP phone verification during citizen registration

-- Up Migration:
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.phone_verified IS 'Indicates whether the citizen phone number has been verified via SMS OTP';
COMMENT ON COLUMN public.profiles.phone_verified_at IS 'Timestamp when the phone number was verified via SMS OTP';

-- Create an index to quickly filter or query verified citizen accounts if needed
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified ON public.profiles (phone_verified);

-- Down Migration (Rollback):
-- DROP INDEX IF EXISTS public.idx_profiles_phone_verified;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_verified_at;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_verified;
