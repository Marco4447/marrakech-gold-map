
-- Table place_follows: users following places for notifications
CREATE TABLE public.place_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, place_id)
);

ALTER TABLE public.place_follows ENABLE ROW LEVEL SECURITY;

-- Users can view their own follows
CREATE POLICY "Users view own place_follows"
  ON public.place_follows FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own follows
CREATE POLICY "Users insert own place_follows"
  ON public.place_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own follows
CREATE POLICY "Users delete own place_follows"
  ON public.place_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Partners/admins can view followers of their places
CREATE POLICY "Partners view place_follows"
  ON public.place_follows FOR SELECT
  USING (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger: notify followers when a new VIP offer is created
CREATE OR REPLACE FUNCTION public.notify_followers_new_offer()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_place_name text;
  v_follower record;
BEGIN
  SELECT name INTO v_place_name FROM places WHERE id = NEW.place_id;

  FOR v_follower IN
    SELECT user_id FROM place_follows WHERE place_id = NEW.place_id
  LOOP
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (
      v_follower.user_id,
      'new_offer',
      '🎁 Nouvelle offre chez ' || COALESCE(v_place_name, 'un lieu'),
      NEW.title || ' — ' || NEW.description
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Follower notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_vip_offer_notify_followers
  AFTER INSERT ON public.vip_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_new_offer();
