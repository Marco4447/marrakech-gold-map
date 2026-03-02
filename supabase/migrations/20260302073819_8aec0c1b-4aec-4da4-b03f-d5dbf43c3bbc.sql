-- Drop the restrictive SELECT policy and recreate as permissive
DROP POLICY IF EXISTS "Users see recent vibes or official" ON public.vibes;

CREATE POLICY "Users see recent vibes or official"
ON public.vibes
FOR SELECT
TO public
USING (
  is_official = true 
  OR created_at > (now() - interval '6 hours')
  OR has_role(auth.uid(), 'admin'::app_role)
);