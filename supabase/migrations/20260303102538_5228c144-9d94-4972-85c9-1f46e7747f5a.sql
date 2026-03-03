-- Fix the notify function to use pg_net correctly
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use net.http_post from pg_net to call edge function
  PERFORM net.http_post(
    url := 'https://pyocqorzbsshawgknmpr.supabase.co/functions/v1/notify-new-signup',
    body := jsonb_build_object('record', jsonb_build_object(
      'user_id', NEW.user_id,
      'full_name', NEW.full_name,
      'email', NEW.email,
      'created_at', NEW.created_at
    )),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Signup notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;
