
-- Phase 1: Add slug + venue details to places
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS opening_hours text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS price_range text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS music_style text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS dress_code text;

-- Slug generation function
CREATE OR REPLACE FUNCTION public.generate_place_slug(place_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT lower(regexp_replace(regexp_replace(trim(place_name), '[^a-zA-Z0-9 -]', '', 'g'), '\s+', '-', 'g'));
$$;

-- Auto-slug trigger
CREATE OR REPLACE FUNCTION public.set_place_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  base_slug text;
  new_slug text;
  counter int := 1;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_place_slug(NEW.name);
    new_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.places WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      new_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    NEW.slug := new_slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_place_slug_trigger ON public.places;
CREATE TRIGGER set_place_slug_trigger
  BEFORE INSERT OR UPDATE ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.set_place_slug();

-- Backfill existing slugs
DO $$
DECLARE
  r RECORD;
  base_slug text;
  new_slug text;
  counter int;
BEGIN
  FOR r IN SELECT id, name FROM public.places WHERE slug IS NULL ORDER BY created_at LOOP
    base_slug := public.generate_place_slug(r.name);
    new_slug := base_slug;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM public.places WHERE slug = new_slug AND id != r.id) LOOP
      new_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    UPDATE public.places SET slug = new_slug WHERE id = r.id;
  END LOOP;
END $$;

-- Unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS places_slug_unique ON public.places(slug) WHERE slug IS NOT NULL;

-- Phase 2: Checkins table
CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '3 hours')
);
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view checkins" ON public.checkins FOR SELECT USING (true);
CREATE POLICY "Auth users insert own checkins" ON public.checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own checkins" ON public.checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Phase 3: QR Scans tracking
CREATE TABLE IF NOT EXISTS public.qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert qr_scans" ON public.qr_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Partners admins view qr_scans" ON public.qr_scans FOR SELECT TO authenticated USING (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Phase 4: VIP Offers
CREATE TABLE IF NOT EXISTS public.vip_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  perk_type text NOT NULL DEFAULT 'drink',
  start_time timestamptz,
  end_time timestamptz,
  max_redemptions integer,
  limit_per_user integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vip_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view vip_offers" ON public.vip_offers FOR SELECT USING (true);
CREATE POLICY "Partners insert vip_offers" ON public.vip_offers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Creators update vip_offers" ON public.vip_offers FOR UPDATE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Creators delete vip_offers" ON public.vip_offers FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Phase 5: VIP Passes
CREATE TABLE IF NOT EXISTS public.vip_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  offer_id uuid NOT NULL REFERENCES public.vip_offers(id) ON DELETE CASCADE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active'
);
ALTER TABLE public.vip_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users and partners view passes" ON public.vip_passes FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own passes" ON public.vip_passes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Phase 6: VIP Redemptions
CREATE TABLE IF NOT EXISTS public.vip_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES public.vip_offers(id) ON DELETE CASCADE,
  pass_id uuid NOT NULL REFERENCES public.vip_passes(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vip_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners view redemptions" ON public.vip_redemptions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users view own redemptions" ON public.vip_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System insert redemptions" ON public.vip_redemptions FOR INSERT WITH CHECK (true);

-- Enable realtime for checkins
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkins;
