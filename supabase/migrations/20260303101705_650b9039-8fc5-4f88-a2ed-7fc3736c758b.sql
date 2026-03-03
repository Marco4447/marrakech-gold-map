
-- 1. vibe_likes: restrict INSERT/DELETE to authenticated users
DROP POLICY IF EXISTS "Anyone can insert vibe_likes" ON public.vibe_likes;
CREATE POLICY "Authenticated users can insert vibe_likes"
ON public.vibe_likes FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete vibe_likes" ON public.vibe_likes;
CREATE POLICY "Authenticated users can delete vibe_likes"
ON public.vibe_likes FOR DELETE
TO authenticated
USING (true);

-- 2. vibe_comments: restrict INSERT/DELETE to authenticated users
DROP POLICY IF EXISTS "Anyone can insert vibe_comments" ON public.vibe_comments;
CREATE POLICY "Authenticated users can insert vibe_comments"
ON public.vibe_comments FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete vibe_comments" ON public.vibe_comments;
CREATE POLICY "Authenticated users can delete vibe_comments"
ON public.vibe_comments FOR DELETE
TO authenticated
USING (true);

-- 3. vibe_super_vibes: restrict INSERT/DELETE to authenticated users
DROP POLICY IF EXISTS "Anyone can insert vibe_super_vibes" ON public.vibe_super_vibes;
CREATE POLICY "Authenticated users can insert vibe_super_vibes"
ON public.vibe_super_vibes FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete vibe_super_vibes" ON public.vibe_super_vibes;
CREATE POLICY "Authenticated users can delete vibe_super_vibes"
ON public.vibe_super_vibes FOR DELETE
TO authenticated
USING (true);

-- 4. vibes: restrict INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can insert vibes" ON public.vibes;
CREATE POLICY "Authenticated users can insert vibes"
ON public.vibes FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. partner_requests: restrict INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can submit partner requests" ON public.partner_requests;
CREATE POLICY "Authenticated users can submit partner requests"
ON public.partner_requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Add content length constraint on vibe_comments
ALTER TABLE public.vibe_comments
ADD CONSTRAINT vibe_comments_content_length
CHECK (char_length(content) <= 500 AND char_length(content) > 0);
