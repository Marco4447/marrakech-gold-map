
-- Fix places: drop restrictive policy and create permissive one
DROP POLICY IF EXISTS "Places are viewable by everyone" ON public.places;
CREATE POLICY "Places are viewable by everyone"
ON public.places
FOR SELECT
USING (true);

-- Fix bookings: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;

CREATE POLICY "Anyone can view bookings"
ON public.bookings
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (true);

-- Fix vibe_comments
DROP POLICY IF EXISTS "Anyone can view vibe_comments" ON public.vibe_comments;
DROP POLICY IF EXISTS "Anyone can insert vibe_comments" ON public.vibe_comments;
DROP POLICY IF EXISTS "Anyone can delete vibe_comments" ON public.vibe_comments;

CREATE POLICY "Anyone can view vibe_comments"
ON public.vibe_comments FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vibe_comments"
ON public.vibe_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete vibe_comments"
ON public.vibe_comments FOR DELETE USING (true);

-- Fix vibe_likes
DROP POLICY IF EXISTS "Anyone can view vibe_likes" ON public.vibe_likes;
DROP POLICY IF EXISTS "Anyone can insert vibe_likes" ON public.vibe_likes;
DROP POLICY IF EXISTS "Anyone can delete vibe_likes" ON public.vibe_likes;

CREATE POLICY "Anyone can view vibe_likes"
ON public.vibe_likes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vibe_likes"
ON public.vibe_likes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete vibe_likes"
ON public.vibe_likes FOR DELETE USING (true);

-- Fix vibe_super_vibes
DROP POLICY IF EXISTS "Anyone can view vibe_super_vibes" ON public.vibe_super_vibes;
DROP POLICY IF EXISTS "Anyone can insert vibe_super_vibes" ON public.vibe_super_vibes;
DROP POLICY IF EXISTS "Anyone can delete vibe_super_vibes" ON public.vibe_super_vibes;

CREATE POLICY "Anyone can view vibe_super_vibes"
ON public.vibe_super_vibes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vibe_super_vibes"
ON public.vibe_super_vibes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete vibe_super_vibes"
ON public.vibe_super_vibes FOR DELETE USING (true);

-- Fix vibes
DROP POLICY IF EXISTS "Vibes are viewable by everyone" ON public.vibes;
DROP POLICY IF EXISTS "Anyone can insert vibes" ON public.vibes;
DROP POLICY IF EXISTS "Anyone can update vibes" ON public.vibes;
DROP POLICY IF EXISTS "Anyone can delete vibes" ON public.vibes;

CREATE POLICY "Vibes are viewable by everyone"
ON public.vibes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vibes"
ON public.vibes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update vibes"
ON public.vibes FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete vibes"
ON public.vibes FOR DELETE USING (true);

-- Fix profiles
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);
