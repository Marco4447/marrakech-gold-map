
-- Trigger: call send-onboarding-email on profiles INSERT
CREATE OR REPLACE FUNCTION public.trigger_send_onboarding_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://pyocqorzbsshawgknmpr.supabase.co/functions/v1/send-onboarding-email',
    body := jsonb_build_object('record', jsonb_build_object(
      'user_id', NEW.user_id,
      'email', NEW.email,
      'full_name', NEW.full_name,
      'created_at', NEW.created_at
    )),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Onboarding email trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_send_onboarding ON public.profiles;
CREATE TRIGGER on_profile_created_send_onboarding
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_onboarding_email();

-- Trigger: call send-partner-email on partner_requests UPDATE to approved
CREATE OR REPLACE FUNCTION public.trigger_send_partner_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    PERFORM net.http_post(
      url := 'https://pyocqorzbsshawgknmpr.supabase.co/functions/v1/send-partner-email',
      body := jsonb_build_object(
        'record', row_to_json(NEW)::jsonb,
        'old_record', row_to_json(OLD)::jsonb
      ),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Partner email trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_partner_approved_send_email ON public.partner_requests;
CREATE TRIGGER on_partner_approved_send_email
  AFTER UPDATE ON public.partner_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_partner_email();
