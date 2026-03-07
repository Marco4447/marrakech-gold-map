-- Trigger to notify followers when a partner publishes a story
CREATE OR REPLACE FUNCTION public.notify_followers_new_story()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_place_name text;
  v_follower record;
BEGIN
  -- Only for partner stories with a place_id
  IF NEW.source_type != 'partner' OR NEW.place_id IS NULL THEN RETURN NEW; END IF;

  SELECT name INTO v_place_name FROM places WHERE id = NEW.place_id;

  FOR v_follower IN
    SELECT user_id FROM place_follows WHERE place_id = NEW.place_id
      AND user_id != COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
  LOOP
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (
      v_follower.user_id,
      'partner_story',
      '📸 ' || COALESCE(v_place_name, 'Un lieu') || ' a publié une story',
      COALESCE(NEW.caption, 'Découvrez ce qui se passe en ce moment !')
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Follower story notification failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Trigger on stories insert
CREATE TRIGGER trg_notify_followers_new_story
  AFTER INSERT ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_new_story();

-- Also add partner_invites referral columns for partner referral system
ALTER TABLE public.partner_invites
  ADD COLUMN IF NOT EXISTS referred_by uuid DEFAULT NULL;
