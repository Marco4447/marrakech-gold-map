
CREATE TABLE public.acquisition_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,  -- 'page_view', 'signup_email', 'signup_google'
  source text NOT NULL DEFAULT 'direct',
  campaign text DEFAULT 'unknown',
  referrer text,
  is_inapp boolean DEFAULT false,
  is_tiktok boolean DEFAULT false,
  user_id uuid,
  device_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast date + source queries
CREATE INDEX idx_acquisition_events_created ON public.acquisition_events (created_at DESC);
CREATE INDEX idx_acquisition_events_source ON public.acquisition_events (source, event_type);

-- Public insert (anonymous visitors can log page views), admin select
ALTER TABLE public.acquisition_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert acquisition events"
  ON public.acquisition_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read acquisition events"
  ON public.acquisition_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
