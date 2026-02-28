-- Allow anyone to update vibes (for like counter)
CREATE POLICY "Anyone can update vibes"
ON public.vibes
FOR UPDATE
USING (true)
WITH CHECK (true);
