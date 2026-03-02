-- Fix: Change vibes SELECT policy from RESTRICTIVE to PERMISSIVE
-- RESTRICTIVE without a PERMISSIVE policy blocks all access

DROP POLICY "Users see recent vibes or official" ON public.vibes;

CREATE POLICY "Users see recent vibes or official"
ON public.vibes
FOR SELECT
USING (
  (is_official = true)
  OR (created_at > (now() - interval '6 hours'))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Also fix vibes INSERT policy
DROP POLICY "Anyone can insert vibes" ON public.vibes;
CREATE POLICY "Anyone can insert vibes"
ON public.vibes
FOR INSERT
WITH CHECK (true);

-- Fix vibes UPDATE policy
DROP POLICY "Users can update their own vibes" ON public.vibes;
CREATE POLICY "Users can update their own vibes"
ON public.vibes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix vibes DELETE policy
DROP POLICY "Users can delete their own vibes" ON public.vibes;
CREATE POLICY "Users can delete their own vibes"
ON public.vibes
FOR DELETE
USING (auth.uid() = user_id);