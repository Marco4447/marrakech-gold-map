
-- Add instagram_handle to places table
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS instagram_handle text DEFAULT NULL;

-- Create scrape log to avoid duplicate imports
CREATE TABLE IF NOT EXISTS public.instagram_scrape_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid REFERENCES public.places(id) ON DELETE CASCADE NOT NULL,
  instagram_handle text NOT NULL,
  post_url text NOT NULL,
  image_url text NOT NULL,
  caption text,
  scraped_at timestamp with time zone NOT NULL DEFAULT now(),
  vibe_id uuid REFERENCES public.vibes(id) ON DELETE SET NULL,
  UNIQUE(post_url)
);

ALTER TABLE public.instagram_scrape_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scrape log" ON public.instagram_scrape_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
