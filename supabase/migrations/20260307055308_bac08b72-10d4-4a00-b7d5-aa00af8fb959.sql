
-- Admin events log table
CREATE TABLE public.admin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- signup, partner_request, vibe, vip_offer, vip_pass, story
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only admins can read
ALTER TABLE public.admin_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin_events"
  ON public.admin_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_events;

-- Trigger function: log signup
CREATE OR REPLACE FUNCTION public.log_admin_event_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO admin_events (event_type, title, body, metadata)
  VALUES ('signup', '🆕 Nouvelle inscription', COALESCE(NEW.full_name, NEW.email, 'Inconnu'), jsonb_build_object('user_id', NEW.user_id, 'email', NEW.email));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_event_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_event_signup();

-- Trigger: new vibe
CREATE OR REPLACE FUNCTION public.log_admin_event_vibe()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO admin_events (event_type, title, body, metadata)
  VALUES ('vibe', '📸 Nouvelle vibe', COALESCE(NEW.location, '') || CASE WHEN NEW.is_official THEN ' (officielle)' ELSE '' END, jsonb_build_object('vibe_id', NEW.id, 'user_id', NEW.user_id, 'mood', NEW.mood));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_event_vibe
  AFTER INSERT ON public.vibes
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_event_vibe();

-- Trigger: partner request
CREATE OR REPLACE FUNCTION public.log_admin_event_partner_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO admin_events (event_type, title, body, metadata)
  VALUES ('partner_request', '🤝 Demande partenaire', NEW.business_name || ' (' || NEW.category || ')', jsonb_build_object('request_id', NEW.id, 'whatsapp', NEW.whatsapp_number));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_event_partner_request
  AFTER INSERT ON public.partner_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_event_partner_request();

-- Trigger: VIP offer published
CREATE OR REPLACE FUNCTION public.log_admin_event_vip_offer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_place_name text;
BEGIN
  SELECT name INTO v_place_name FROM places WHERE id = NEW.place_id;
  INSERT INTO admin_events (event_type, title, body, metadata)
  VALUES ('vip_offer', '🎁 Offre VIP publiée', NEW.title || ' @ ' || COALESCE(v_place_name, ''), jsonb_build_object('offer_id', NEW.id, 'place_id', NEW.place_id));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_event_vip_offer
  AFTER INSERT ON public.vip_offers
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_event_vip_offer();

-- Trigger: VIP pass generated
CREATE OR REPLACE FUNCTION public.log_admin_event_vip_pass()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user_name text; v_offer_title text;
BEGIN
  SELECT COALESCE(full_name, 'Client') INTO v_user_name FROM profiles_public WHERE user_id = NEW.user_id LIMIT 1;
  SELECT title INTO v_offer_title FROM vip_offers WHERE id = NEW.offer_id;
  INSERT INTO admin_events (event_type, title, body, metadata)
  VALUES ('vip_pass', '🎫 Pass VIP généré', v_user_name || ' → ' || COALESCE(v_offer_title, ''), jsonb_build_object('pass_id', NEW.id, 'user_id', NEW.user_id));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_event_vip_pass
  AFTER INSERT ON public.vip_passes
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_event_vip_pass();

-- Trigger: story published
CREATE OR REPLACE FUNCTION public.log_admin_event_story()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO admin_events (event_type, title, body, metadata)
  VALUES ('story', '📖 Story publiée', COALESCE(NEW.badge, NEW.source_type) || ' — ' || COALESCE(NEW.caption, 'sans légende'), jsonb_build_object('story_id', NEW.id, 'source_type', NEW.source_type));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_event_story
  AFTER INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_event_story();
