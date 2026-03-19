
-- 1. Vibe Checks
CREATE TABLE public.vibe_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id uuid REFERENCES public.places(id) ON DELETE CASCADE,
  mood text NOT NULL,
  device_id text NOT NULL,
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vibe_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vibe checks" ON public.vibe_checks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vibe checks" ON public.vibe_checks FOR INSERT WITH CHECK (true);

-- Validation trigger for mood
CREATE OR REPLACE FUNCTION public.validate_vibe_check_mood()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.mood NOT IN ('full', 'dead', 'dance', 'chill') THEN
    RAISE EXCEPTION 'Invalid mood value: %', NEW.mood;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_vibe_check_mood
  BEFORE INSERT OR UPDATE ON public.vibe_checks
  FOR EACH ROW EXECUTE FUNCTION public.validate_vibe_check_mood();

-- 2. Events
CREATE TABLE public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  place_id uuid REFERENCES public.places(id) ON DELETE CASCADE,
  date date NOT NULL,
  time text NOT NULL,
  description text,
  image_url text,
  type text NOT NULL DEFAULT 'special',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Validation trigger for event type
CREATE OR REPLACE FUNCTION public.validate_event_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.type NOT IN ('dj_set', 'ladies_night', 'opening', 'live', 'special') THEN
    RAISE EXCEPTION 'Invalid event type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_event_type
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_type();

-- 3. Ephemeral Reviews
CREATE TABLE public.ephemeral_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id uuid REFERENCES public.places(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  text text NOT NULL,
  rating int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ephemeral_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recent reviews" ON public.ephemeral_reviews FOR SELECT USING (created_at > now() - interval '48 hours');
CREATE POLICY "Authenticated users can insert reviews" ON public.ephemeral_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Validation triggers for ephemeral_reviews
CREATE OR REPLACE FUNCTION public.validate_ephemeral_review()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF char_length(NEW.text) > 140 THEN
    RAISE EXCEPTION 'Review text must be 140 characters or less';
  END IF;
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ephemeral_review
  BEFORE INSERT OR UPDATE ON public.ephemeral_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_ephemeral_review();
