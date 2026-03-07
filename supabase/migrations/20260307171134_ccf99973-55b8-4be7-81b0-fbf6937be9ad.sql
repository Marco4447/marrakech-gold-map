
CREATE OR REPLACE FUNCTION public.broadcast_official_vibe()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_location text;
  v_caption text;
  v_title text;
  v_body text;
  v_user record;
BEGIN
  -- Only for official vibes (admin or partner publications)
  IF NOT NEW.is_official THEN RETURN NEW; END IF;

  v_location := COALESCE(NEW.location, 'un lieu');
  v_caption := COALESCE(NEW.caption, 'Découvrez ce qui se passe en ce moment !');
  v_title := '🔥 ' || v_location || ' est en feu ce soir !';
  v_body := v_caption;

  -- Insert a notification for EVERY user (except the publisher)
  INSERT INTO notifications (user_id, type, title, body, vibe_id, actor_user_id)
  SELECT 
    p.user_id,
    'broadcast_vibe',
    v_title,
    v_body,
    NEW.id,
    NEW.user_id
  FROM profiles p
  WHERE p.user_id != COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Broadcast vibe notification failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Create trigger on vibes table
CREATE TRIGGER trg_broadcast_official_vibe
  AFTER INSERT ON public.vibes
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_official_vibe();
