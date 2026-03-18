-- Fix missing boosted_places table causing 404 requests during app startup
CREATE TABLE IF NOT EXISTS public.boosted_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 0,
  boost_type text NOT NULL DEFAULT 'manual',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT boosted_places_boost_type_check CHECK (boost_type IN ('manual', 'featured_plan', 'sponsored')),
  CONSTRAINT boosted_places_place_id_key UNIQUE (place_id)
);

ALTER TABLE public.boosted_places ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'boosted_places'
      AND policyname = 'Anyone can view active boosts'
  ) THEN
    CREATE POLICY "Anyone can view active boosts"
    ON public.boosted_places
    FOR SELECT
    USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'boosted_places'
      AND policyname = 'Admins can manage boosts'
  ) THEN
    CREATE POLICY "Admins can manage boosts"
    ON public.boosted_places
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_boosted_places_place_id ON public.boosted_places(place_id);
CREATE INDEX IF NOT EXISTS idx_boosted_places_expires_at ON public.boosted_places(expires_at);
CREATE INDEX IF NOT EXISTS idx_boosted_places_priority ON public.boosted_places(priority);