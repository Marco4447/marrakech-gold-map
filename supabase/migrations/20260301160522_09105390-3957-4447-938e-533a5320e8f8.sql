
-- Fix places SELECT policy to be PERMISSIVE
DROP POLICY IF EXISTS "Places are viewable by everyone" ON public.places;
CREATE POLICY "Places are viewable by everyone"
ON public.places FOR SELECT
USING (true);

-- Fix partner_requests INSERT policy to be PERMISSIVE
DROP POLICY IF EXISTS "Anyone can submit partner requests" ON public.partner_requests;
CREATE POLICY "Anyone can submit partner requests"
ON public.partner_requests FOR INSERT
WITH CHECK (true);

-- Fix bookings policies to be PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users can create their own bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create their own bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id);

-- Fix profiles policies to be PERMISSIVE
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Fix vibes policies to be PERMISSIVE
DROP POLICY IF EXISTS "Vibes are viewable by everyone" ON public.vibes;
CREATE POLICY "Vibes are viewable by everyone"
ON public.vibes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can insert vibes" ON public.vibes;
CREATE POLICY "Anyone can insert vibes"
ON public.vibes FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own vibes" ON public.vibes;
CREATE POLICY "Users can update their own vibes"
ON public.vibes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own vibes" ON public.vibes;
CREATE POLICY "Users can delete their own vibes"
ON public.vibes FOR DELETE
USING (auth.uid() = user_id);

-- Fix vibe_comments, vibe_likes, vibe_super_vibes
DROP POLICY IF EXISTS "Anyone can view vibe_comments" ON public.vibe_comments;
CREATE POLICY "Anyone can view vibe_comments" ON public.vibe_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert vibe_comments" ON public.vibe_comments;
CREATE POLICY "Anyone can insert vibe_comments" ON public.vibe_comments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete vibe_comments" ON public.vibe_comments;
CREATE POLICY "Anyone can delete vibe_comments" ON public.vibe_comments FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can view vibe_likes" ON public.vibe_likes;
CREATE POLICY "Anyone can view vibe_likes" ON public.vibe_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert vibe_likes" ON public.vibe_likes;
CREATE POLICY "Anyone can insert vibe_likes" ON public.vibe_likes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete vibe_likes" ON public.vibe_likes;
CREATE POLICY "Anyone can delete vibe_likes" ON public.vibe_likes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can view vibe_super_vibes" ON public.vibe_super_vibes;
CREATE POLICY "Anyone can view vibe_super_vibes" ON public.vibe_super_vibes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert vibe_super_vibes" ON public.vibe_super_vibes;
CREATE POLICY "Anyone can insert vibe_super_vibes" ON public.vibe_super_vibes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete vibe_super_vibes" ON public.vibe_super_vibes;
CREATE POLICY "Anyone can delete vibe_super_vibes" ON public.vibe_super_vibes FOR DELETE USING (true);

-- Fix user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Fix admin policies on partner_requests
DROP POLICY IF EXISTS "Admins can view partner requests" ON public.partner_requests;
CREATE POLICY "Admins can view partner requests" ON public.partner_requests FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update partner requests" ON public.partner_requests;
CREATE POLICY "Admins can update partner requests" ON public.partner_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Recreate the missing trigger for handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
