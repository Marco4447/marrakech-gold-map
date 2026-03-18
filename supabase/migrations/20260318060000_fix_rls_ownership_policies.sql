-- Fix RLS: Restrict DELETE on engagement tables to own records only
-- Previously any authenticated user could delete any record

-- 1. vibe_likes: users can only delete their own likes
DROP POLICY IF EXISTS "Authenticated users can delete vibe_likes" ON public.vibe_likes;
CREATE POLICY "Users can delete their own vibe_likes"
ON public.vibe_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2. vibe_comments: users can only delete their own comments
DROP POLICY IF EXISTS "Authenticated users can delete vibe_comments" ON public.vibe_comments;
CREATE POLICY "Users can delete their own vibe_comments"
ON public.vibe_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. vibe_super_vibes: users can only delete their own super vibes
DROP POLICY IF EXISTS "Authenticated users can delete vibe_super_vibes" ON public.vibe_super_vibes;
CREATE POLICY "Users can delete their own vibe_super_vibes"
ON public.vibe_super_vibes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Also restrict INSERT on engagement tables to own user_id
DROP POLICY IF EXISTS "Authenticated users can insert vibe_likes" ON public.vibe_likes;
CREATE POLICY "Users can insert their own vibe_likes"
ON public.vibe_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert vibe_comments" ON public.vibe_comments;
CREATE POLICY "Users can insert their own vibe_comments"
ON public.vibe_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert vibe_super_vibes" ON public.vibe_super_vibes;
CREATE POLICY "Users can insert their own vibe_super_vibes"
ON public.vibe_super_vibes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
