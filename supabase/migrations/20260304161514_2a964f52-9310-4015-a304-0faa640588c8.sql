CREATE OR REPLACE FUNCTION public.notify_new_vibe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://pyocqorzbsshawgknmpr.supabase.co/functions/v1/notify-new-vibe',
      body := jsonb_build_object('record', jsonb_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'location', NEW.location,
        'caption', NEW.caption,
        'mood', NEW.mood,
        'media_type', NEW.media_type,
        'created_at', NEW.created_at
      )),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Vibe notification failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_new_vibe_notify
  AFTER INSERT ON public.vibes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_vibe();

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))