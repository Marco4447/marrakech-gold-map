
-- Atomic increment/decrement RPCs for likes and super_vibes to prevent race conditions

CREATE OR REPLACE FUNCTION public.increment_vibe_likes(p_vibe_id uuid, p_delta integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE vibes
  SET likes = GREATEST(0, likes + p_delta)
  WHERE id = p_vibe_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_vibe_super_vibes(p_vibe_id uuid, p_delta integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE vibes
  SET super_vibes = GREATEST(0, super_vibes + p_delta)
  WHERE id = p_vibe_id;
END;
$$;

-- Processed events table for Stripe webhook idempotence
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-cleanup old events (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_stripe_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.processed_stripe_events
  WHERE processed_at < now() - interval '7 days';
$$;
