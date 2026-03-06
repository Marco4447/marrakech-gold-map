
-- Stories table
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL DEFAULT 'user' CHECK (source_type IN ('admin', 'partner', 'user')),
  user_id uuid,
  place_id uuid REFERENCES public.places(id) ON DELETE SET NULL,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'photo',
  badge text,
  caption text,
  is_featured boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Story views tracking
CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  device_id text,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- RLS on stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active stories"
  ON public.stories FOR SELECT
  USING (is_hidden = false AND expires_at > now());

CREATE POLICY "Admins see all stories"
  ON public.stories FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Auth users insert own stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners insert partner stories"
  ON public.stories FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'partner') AND source_type = 'partner');

CREATE POLICY "Admins insert any stories"
  ON public.stories FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update stories"
  ON public.stories FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete stories"
  ON public.stories FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete own stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = user_id);

-- RLS on story_views
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert story views"
  ON public.story_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins view story_views"
  ON public.story_views FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own story_views"
  ON public.story_views FOR SELECT
  USING (auth.uid() = user_id);

-- Index for expiry queries
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at) WHERE is_hidden = false;
CREATE INDEX idx_stories_source_type ON public.stories(source_type, created_at DESC);
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
