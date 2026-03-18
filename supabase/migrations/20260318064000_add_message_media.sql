-- Add media support to messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image', 'video') OR media_type IS NULL);
