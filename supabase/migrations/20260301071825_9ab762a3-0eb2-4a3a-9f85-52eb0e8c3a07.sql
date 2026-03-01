
-- =============================================
-- 1. PROFILES: Restrict SELECT to own profile only, create public view
-- =============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Users can only read their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Create a public view excluding email for other components (LivePage)
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT user_id, full_name, avatar_url
  FROM public.profiles;

-- =============================================
-- 2. BOOKINGS: Add user_id, restrict access
-- =============================================

-- Add user_id column (nullable for existing rows)
ALTER TABLE public.bookings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

-- Only authenticated users can create bookings (linked to their account)
CREATE POLICY "Authenticated users can create their own bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 3. VIBES: Restrict UPDATE/DELETE to owner only
-- =============================================

-- Drop overly permissive UPDATE and DELETE policies
DROP POLICY IF EXISTS "Anyone can update vibes" ON public.vibes;
DROP POLICY IF EXISTS "Anyone can delete vibes" ON public.vibes;

-- Only post owner can update their vibes
CREATE POLICY "Users can update their own vibes"
  ON public.vibes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only post owner can delete their vibes
CREATE POLICY "Users can delete their own vibes"
  ON public.vibes FOR DELETE
  USING (auth.uid() = user_id);
