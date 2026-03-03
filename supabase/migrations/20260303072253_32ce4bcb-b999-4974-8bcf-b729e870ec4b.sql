CREATE POLICY "Admins can insert places"
ON public.places
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));