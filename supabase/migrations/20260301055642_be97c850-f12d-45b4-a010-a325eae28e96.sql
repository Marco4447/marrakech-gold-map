-- Allow authenticated users to read basic profile info (name, avatar) for displaying in the feed
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Drop the restrictive own-profile-only policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;