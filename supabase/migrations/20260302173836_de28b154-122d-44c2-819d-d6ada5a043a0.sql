-- Add neighborhood column to places table
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS neighborhood text;