-- Multi-venue support: allow partners to manage multiple places
-- Currently partner_subscriptions has a single place_id. We add a junction table.
CREATE TABLE public.partner_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partner_user_id, place_id)
);

ALTER TABLE public.partner_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own places"
ON public.partner_places FOR SELECT
TO authenticated
USING (auth.uid() = partner_user_id);

CREATE POLICY "Admins can manage partner places"
ON public.partner_places FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_partner_places_user ON public.partner_places(partner_user_id);
CREATE INDEX idx_partner_places_place ON public.partner_places(place_id);

-- Migrate existing partner_subscriptions into partner_places
INSERT INTO public.partner_places (partner_user_id, place_id, role)
SELECT partner_id, place_id, 'owner'
FROM public.partner_subscriptions
WHERE place_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Homepage featured places (for Featured plan placement)
CREATE TABLE public.homepage_featured (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,  -- display order
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_featured ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view homepage featured"
ON public.homepage_featured FOR SELECT
USING (true);

CREATE POLICY "Admins can manage homepage featured"
ON public.homepage_featured FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_homepage_featured_active ON public.homepage_featured(position) WHERE (expires_at IS NULL OR expires_at > now());
