-- Add email column to participants table if it doesn't exist
-- Run this in the Supabase SQL editor

ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_email
  ON public.participants(email);
