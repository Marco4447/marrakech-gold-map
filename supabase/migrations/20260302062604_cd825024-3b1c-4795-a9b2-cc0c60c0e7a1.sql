
-- Drop all vibes policies and recreate as PERMISSIVE (default)
DROP POLICY IF EXISTS "Users see recent vibes only" ON public.vibes;
DROP POLICY IF EXISTS "Anyone can insert vibes" ON public.vibes;
DROP POLICY IF EXISTS "Users can update their own vibes" ON public.vibes;
DROP POLICY IF EXISTS "Users can delete their own vibes" ON public.vibes;

CREATE POLICY "Users see recent vibes only"
  ON public.vibes FOR SELECT
  USING (created_at > (now() - interval '6 hours') OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert vibes"
  ON public.vibes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own vibes"
  ON public.vibes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vibes"
  ON public.vibes FOR DELETE
  USING (auth.uid() = user_id);
