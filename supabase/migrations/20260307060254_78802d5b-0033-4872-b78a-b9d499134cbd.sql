
-- Notify followers when a partner publishes an official vibe
CREATE OR REPLACE FUNCTION public.notify_followers_new_vibe()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_place_name text;
  v_follower record;
BEGIN
  -- Only for official vibes (partner publications)
  IF NOT NEW.is_official THEN RETURN NEW; END IF;
  IF NEW.location IS NULL THEN RETURN NEW; END IF;

  -- Find the place matching the vibe location
  SELECT id, name INTO v_place_name FROM places WHERE name = NEW.location LIMIT 1;

  -- If no matching place, try to find followers anyway
  FOR v_follower IN
    SELECT pf.user_id FROM place_follows pf
    JOIN places p ON p.id = pf.place_id
    WHERE p.name = NEW.location
      AND pf.user_id != COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
  LOOP
    INSERT INTO notifications (user_id, type, title, body, vibe_id, actor_user_id)
    VALUES (
      v_follower.user_id,
      'official_vibe',
      '📸 Nouveau post de ' || COALESCE(NEW.location, 'un lieu que vous suivez'),
      COALESCE(NEW.caption, 'Découvrez leur dernière publication !'),
      NEW.id,
      NEW.user_id
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Follower vibe notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_followers_new_vibe
  AFTER INSERT ON public.vibes
  FOR EACH ROW EXECUTE FUNCTION public.notify_followers_new_vibe();
