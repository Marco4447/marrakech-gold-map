
-- Create vibe_views table for tracking vibe impressions
CREATE TABLE IF NOT EXISTS public.vibe_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vibe_id uuid NOT NULL REFERENCES public.vibes(id) ON DELETE CASCADE,
  user_id uuid,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vibe_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert vibe views" ON public.vibe_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Partners and admins view vibe_views" ON public.vibe_views FOR SELECT
  USING (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Index for fast weekly aggregation
CREATE INDEX IF NOT EXISTS idx_vibe_views_vibe_viewed ON public.vibe_views (vibe_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_venue_analytics_place_created ON public.venue_analytics (place_id, created_at);

-- Function: weekly place views
CREATE OR REPLACE FUNCTION public.weekly_place_views(p_place_id uuid)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*) FROM venue_analytics
  WHERE place_id = p_place_id
    AND event_type = 'page_view'
    AND created_at > now() - interval '7 days';
$$;

-- Function: weekly checkins
CREATE OR REPLACE FUNCTION public.weekly_checkins(p_place_id uuid)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*) FROM checkins
  WHERE place_id = p_place_id
    AND created_at > now() - interval '7 days';
$$;

-- Function: weekly vibe views (for official vibes of a place)
CREATE OR REPLACE FUNCTION public.weekly_vibe_views(p_place_id uuid)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*) FROM vibe_views vv
  JOIN vibes v ON v.id = vv.vibe_id
  WHERE v.is_official = true
    AND v.location IN (SELECT name FROM places WHERE id = p_place_id)
    AND vv.viewed_at > now() - interval '7 days';
$$;

-- Function: weekly QR redemptions
CREATE OR REPLACE FUNCTION public.weekly_qr_redemptions(p_place_id uuid)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*) FROM vip_redemptions
  WHERE place_id = p_place_id
    AND redeemed_at > now() - interval '7 days';
$$;
