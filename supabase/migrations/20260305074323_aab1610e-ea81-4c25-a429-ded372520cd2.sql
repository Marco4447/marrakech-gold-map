
-- Rate-limiting trigger: max 10 comments per user per hour
CREATE OR REPLACE FUNCTION public.check_comment_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.vibe_comments
  WHERE device_id = NEW.device_id
    AND created_at > now() - interval '1 hour';
  
  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 10 comments per hour';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_comment_rate_limit
  BEFORE INSERT ON public.vibe_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_comment_rate_limit();

-- Rate-limiting trigger: max 20 likes per user per hour
CREATE OR REPLACE FUNCTION public.check_like_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.vibe_likes
  WHERE device_id = NEW.device_id
    AND created_at > now() - interval '1 hour';
  
  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 20 likes per hour';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_like_rate_limit
  BEFORE INSERT ON public.vibe_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_like_rate_limit();

-- Rate-limiting trigger: max 1 super vibe per 6 hours
CREATE OR REPLACE FUNCTION public.check_super_vibe_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.vibe_super_vibes
  WHERE device_id = NEW.device_id
    AND created_at > now() - interval '6 hours';
  
  IF recent_count >= 1 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 1 super vibe per 6 hours';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_super_vibe_rate_limit
  BEFORE INSERT ON public.vibe_super_vibes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_super_vibe_rate_limit();
