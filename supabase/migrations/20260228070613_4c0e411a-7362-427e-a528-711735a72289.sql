-- Allow anyone to insert vibes (public upload)
CREATE POLICY "Anyone can insert vibes"
ON public.vibes
FOR INSERT
WITH CHECK (true);

-- Enable realtime for instant moderation
ALTER PUBLICATION supabase_realtime ADD TABLE public.vibes;

-- Allow admin deletes (anyone for now, restrict later)
CREATE POLICY "Anyone can delete vibes"
ON public.vibes
FOR DELETE
USING (true);
