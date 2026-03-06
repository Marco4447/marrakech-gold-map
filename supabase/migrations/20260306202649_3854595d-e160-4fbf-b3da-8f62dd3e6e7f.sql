
-- Story reactions table (covers likes ❤️ and emoji reactions 🔥😍🤤💀)
CREATE TABLE public.story_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid,
  device_id text NOT NULL,
  emoji text NOT NULL DEFAULT '❤️',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(story_id, device_id, emoji)
);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions
CREATE POLICY "Anyone can view story_reactions" ON public.story_reactions
  FOR SELECT USING (true);

-- Anyone authenticated can insert
CREATE POLICY "Anyone can insert story_reactions" ON public.story_reactions
  FOR INSERT WITH CHECK (true);

-- Anyone authenticated can delete own
CREATE POLICY "Users can delete own story_reactions" ON public.story_reactions
  FOR DELETE USING (true);

-- Rate limit trigger
CREATE OR REPLACE FUNCTION public.check_story_reaction_rate_limit()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  recent_count INT;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT count(*) INTO recent_count
    FROM public.story_reactions
    WHERE user_id = NEW.user_id
      AND created_at > now() - interval '1 hour';
  ELSE
    SELECT count(*) INTO recent_count
    FROM public.story_reactions
    WHERE device_id = NEW.device_id
      AND created_at > now() - interval '1 hour';
  END IF;
  
  IF recent_count >= 30 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 30 story reactions per hour';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_story_reaction_rate
  BEFORE INSERT ON public.story_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_story_reaction_rate_limit();
