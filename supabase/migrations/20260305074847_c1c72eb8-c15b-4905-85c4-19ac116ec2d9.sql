
-- Add user_id column to vibe_likes (nullable for backward compat with existing data)
ALTER TABLE public.vibe_likes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to vibe_super_vibes
ALTER TABLE public.vibe_super_vibes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to vibe_comments
ALTER TABLE public.vibe_comments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for user_id lookups
CREATE INDEX IF NOT EXISTS idx_vibe_likes_user_id ON public.vibe_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_super_vibes_user_id ON public.vibe_super_vibes(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_comments_user_id ON public.vibe_comments(user_id);

-- Add unique constraint: one like per user per vibe
ALTER TABLE public.vibe_likes ADD CONSTRAINT unique_user_vibe_like UNIQUE (user_id, vibe_id);

-- Add unique constraint: one super vibe per user per vibe  
ALTER TABLE public.vibe_super_vibes ADD CONSTRAINT unique_user_vibe_super UNIQUE (user_id, vibe_id);

-- Update rate limit triggers to use user_id when available
CREATE OR REPLACE FUNCTION public.check_comment_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT count(*) INTO recent_count
    FROM public.vibe_comments
    WHERE user_id = NEW.user_id
      AND created_at > now() - interval '1 hour';
  ELSE
    SELECT count(*) INTO recent_count
    FROM public.vibe_comments
    WHERE device_id = NEW.device_id
      AND created_at > now() - interval '1 hour';
  END IF;
  
  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 10 comments per hour';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_like_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT count(*) INTO recent_count
    FROM public.vibe_likes
    WHERE user_id = NEW.user_id
      AND created_at > now() - interval '1 hour';
  ELSE
    SELECT count(*) INTO recent_count
    FROM public.vibe_likes
    WHERE device_id = NEW.device_id
      AND created_at > now() - interval '1 hour';
  END IF;
  
  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 20 likes per hour';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_super_vibe_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT count(*) INTO recent_count
    FROM public.vibe_super_vibes
    WHERE user_id = NEW.user_id
      AND created_at > now() - interval '6 hours';
  ELSE
    SELECT count(*) INTO recent_count
    FROM public.vibe_super_vibes
    WHERE device_id = NEW.device_id
      AND created_at > now() - interval '6 hours';
  END IF;
  
  IF recent_count >= 1 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 1 super vibe per 6 hours';
  END IF;
  
  RETURN NEW;
END;
$$;
