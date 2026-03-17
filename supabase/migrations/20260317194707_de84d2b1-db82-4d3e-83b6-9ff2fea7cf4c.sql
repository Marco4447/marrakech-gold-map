
CREATE TABLE public.vibe_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vibe_id uuid NOT NULL REFERENCES public.vibes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'photo',
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vibe_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vibe replies" ON public.vibe_replies FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own replies" ON public.vibe_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies" ON public.vibe_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.vibe_replies;
