
-- Add mood, latitude, longitude columns to vibes
ALTER TABLE public.vibes ADD COLUMN IF NOT EXISTS mood text DEFAULT NULL;
ALTER TABLE public.vibes ADD COLUMN IF NOT EXISTS latitude double precision DEFAULT NULL;
ALTER TABLE public.vibes ADD COLUMN IF NOT EXISTS longitude double precision DEFAULT NULL;

-- Drop old permissive RLS policies on vibes and replace with time-scoped ones
DROP POLICY IF EXISTS "Vibes are viewable by everyone" ON public.vibes;

-- Users can only see vibes from the last 6 hours
CREATE POLICY "Users see recent vibes only"
ON public.vibes
FOR SELECT
USING (
  created_at > (now() - interval '6 hours')
  OR public.has_role(auth.uid(), 'admin')
);

-- Keep existing insert/update/delete policies as they are
