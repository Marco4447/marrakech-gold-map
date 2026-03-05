
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  vibe_id uuid REFERENCES public.vibes(id) ON DELETE CASCADE,
  actor_user_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function: create notification on new like
CREATE OR REPLACE FUNCTION public.notify_on_like()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id uuid;
  v_location text;
  v_actor_name text;
BEGIN
  SELECT user_id, location INTO v_owner_id, v_location FROM vibes WHERE id = NEW.vibe_id;
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Quelqu''un') INTO v_actor_name FROM profiles_public WHERE user_id = NEW.user_id LIMIT 1;
  INSERT INTO notifications (user_id, type, title, body, vibe_id, actor_user_id)
  VALUES (v_owner_id, 'like', '❤️ ' || v_actor_name || ' a liké ta vibe', COALESCE(v_location, ''), NEW.vibe_id, NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_like
  AFTER INSERT ON public.vibe_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- Trigger function: create notification on new comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id uuid;
  v_location text;
  v_actor_name text;
BEGIN
  SELECT user_id, location INTO v_owner_id, v_location FROM vibes WHERE id = NEW.vibe_id;
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, 'Quelqu''un') INTO v_actor_name FROM profiles_public WHERE user_id = NEW.user_id LIMIT 1;
  INSERT INTO notifications (user_id, type, title, body, vibe_id, actor_user_id)
  VALUES (v_owner_id, 'comment', '💬 ' || v_actor_name || ' a commenté ta vibe', LEFT(NEW.content, 80), NEW.vibe_id, NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON public.vibe_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();
