-- Fix all vibes policies: drop restrictive ones and recreate as permissive

DROP POLICY IF EXISTS "Anyone can insert vibes" ON public.vibes;
DROP POLICY IF EXISTS "Users can update their own vibes" ON public.vibes;
DROP POLICY IF EXISTS "Users can delete their own vibes" ON public.vibes;

CREATE POLICY "Anyone can insert vibes"
ON public.vibes
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can update their own vibes"
ON public.vibes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vibes"
ON public.vibes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);