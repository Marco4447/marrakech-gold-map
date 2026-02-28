
-- Create comments table for vibes
CREATE TABLE public.vibe_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vibe_id UUID NOT NULL REFERENCES public.vibes(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vibe_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view vibe_comments"
ON public.vibe_comments FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vibe_comments"
ON public.vibe_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete vibe_comments"
ON public.vibe_comments FOR DELETE USING (true);
