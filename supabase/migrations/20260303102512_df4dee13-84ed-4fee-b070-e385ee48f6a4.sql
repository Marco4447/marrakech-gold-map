-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to notify on new signup
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_url TEXT;
  service_key TEXT;
BEGIN
  edge_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- Use pg_net to call the edge function asynchronously
  PERFORM extensions.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/notify-new-signup',
    body := jsonb_build_object('record', jsonb_build_object(
      'user_id', NEW.user_id,
      'full_name', NEW.full_name,
      'email', NEW.email,
      'created_at', NEW.created_at
    )),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block signup if notification fails
  RAISE WARNING 'Signup notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_new_signup_notify ON public.profiles;
CREATE TRIGGER on_new_signup_notify
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_signup();
