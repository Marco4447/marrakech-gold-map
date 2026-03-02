
-- Add media_type column to vibes table to distinguish photos from videos
ALTER TABLE public.vibes ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'photo';

-- Add comment to clarify allowed values
COMMENT ON COLUMN public.vibes.media_type IS 'Type of media: photo or video';
