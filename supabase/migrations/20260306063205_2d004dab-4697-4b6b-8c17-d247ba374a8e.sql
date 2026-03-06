
CREATE OR REPLACE FUNCTION public.notify_staff_new_pass()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_partner_id uuid;
  v_offer_title text;
  v_place_name text;
  v_user_name text;
BEGIN
  -- Get the partner (offer creator), offer title, and place name
  SELECT vo.created_by, vo.title, p.name
  INTO v_partner_id, v_offer_title, v_place_name
  FROM vip_offers vo
  JOIN places p ON p.id = vo.place_id
  WHERE vo.id = NEW.offer_id;

  IF v_partner_id IS NULL OR v_partner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get the client name
  SELECT COALESCE(full_name, 'Un client') INTO v_user_name
  FROM profiles_public WHERE user_id = NEW.user_id LIMIT 1;

  -- Insert notification for the partner/staff
  INSERT INTO notifications (user_id, type, title, body, actor_user_id)
  VALUES (
    v_partner_id,
    'vip_pass',
    '🎫 Nouveau pass VIP généré',
    v_user_name || ' a généré un pass pour "' || COALESCE(v_offer_title, '') || '" @ ' || COALESCE(v_place_name, ''),
    NEW.user_id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Staff notification for new pass failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_staff_new_pass
AFTER INSERT ON public.vip_passes
FOR EACH ROW
EXECUTE FUNCTION public.notify_staff_new_pass();
