
CREATE TABLE public.vibes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  location TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vibes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vibes are viewable by everyone"
ON public.vibes
FOR SELECT
USING (true);
