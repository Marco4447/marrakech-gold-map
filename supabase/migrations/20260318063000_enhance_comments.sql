-- Add parent_id for threaded replies
ALTER TABLE public.vibe_comments
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.vibe_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_vibe_comments_parent ON public.vibe_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_vibe_comments_vibe ON public.vibe_comments(vibe_id, created_at);
