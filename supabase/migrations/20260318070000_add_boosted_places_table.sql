-- Database-driven boosted places (replaces hardcoded BOOSTED_PLACES array)
CREATE TABLE public.boosted_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 0,  -- lower = higher priority
  boost_type text NOT NULL DEFAULT 'manual' CHECK (boost_type IN ('manual', 'featured_plan', 'sponsored')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,  -- null = never expires
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(place_id)
);

ALTER TABLE public.boosted_places ENABLE ROW LEVEL SECURITY;

-- Everyone can see active boosts (needed for map/feed)
CREATE POLICY "Anyone can view active boosts"
ON public.boosted_places FOR SELECT
USING (true);

-- Only admins can manage boosts
CREATE POLICY "Admins can manage boosts"
ON public.boosted_places FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_boosted_places_active ON public.boosted_places(place_id) WHERE (expires_at IS NULL OR expires_at > now());

-- Auto-boost places on featured plan
CREATE OR REPLACE FUNCTION public.auto_boost_featured_partners()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.plan_type = 'featured' AND NEW.status = 'active' THEN
    INSERT INTO boosted_places (place_id, priority, boost_type)
    VALUES (NEW.place_id, 10, 'featured_plan')
    ON CONFLICT (place_id) DO UPDATE SET priority = LEAST(EXCLUDED.priority, boosted_places.priority), boost_type = 'featured_plan';
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_boost_featured
  AFTER INSERT OR UPDATE ON public.partner_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.auto_boost_featured_partners();
