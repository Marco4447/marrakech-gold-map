
-- Add super_vibes count to vibes table
ALTER TABLE public.vibes ADD COLUMN super_vibes INTEGER NOT NULL DEFAULT 0;

-- Create tracking table for super vibe votes
CREATE TABLE public.vibe_super_vibes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vibe_id UUID NOT NULL REFERENCES public.vibes(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vibe_super_vibes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vibe_super_vibes"
ON public.vibe_super_vibes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vibe_super_vibes"
ON public.vibe_super_vibes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete vibe_super_vibes"
ON public.vibe_super_vibes FOR DELETE USING (true);
