-- Table to track likes per device (no auth, use device_id)
CREATE TABLE public.vibe_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vibe_id UUID NOT NULL REFERENCES public.vibes(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vibe_id, device_id)
);

ALTER TABLE public.vibe_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vibe_likes"
ON public.vibe_likes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vibe_likes"
ON public.vibe_likes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete vibe_likes"
ON public.vibe_likes FOR DELETE USING (true);
