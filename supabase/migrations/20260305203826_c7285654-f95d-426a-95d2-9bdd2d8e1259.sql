
-- Vibe Boosts table
CREATE TABLE public.vibe_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vibe_id uuid NOT NULL REFERENCES public.vibes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  boost_type text NOT NULL,
  boost_expires_at timestamp with time zone NOT NULL,
  stripe_session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vibe_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own boosts" ON public.vibe_boosts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view boosts" ON public.vibe_boosts
  FOR SELECT USING (true);

CREATE POLICY "Inserts allowed" ON public.vibe_boosts
  FOR INSERT WITH CHECK (true);

-- Partner Offers table
CREATE TABLE public.partner_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  vip_only boolean NOT NULL DEFAULT true,
  expiration_date timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view offers" ON public.partner_offers
  FOR SELECT USING (true);

CREATE POLICY "Partners can insert offers" ON public.partner_offers
  FOR INSERT TO authenticated WITH CHECK (
    has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Partners can update offers" ON public.partner_offers
  FOR UPDATE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can delete offers" ON public.partner_offers
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Add columns to places
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS listing_tier text DEFAULT 'free';
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- Indexes
CREATE INDEX idx_vibe_boosts_lookup ON public.vibe_boosts (vibe_id, boost_expires_at);
CREATE INDEX idx_partner_offers_lookup ON public.partner_offers (place_id, is_active);
