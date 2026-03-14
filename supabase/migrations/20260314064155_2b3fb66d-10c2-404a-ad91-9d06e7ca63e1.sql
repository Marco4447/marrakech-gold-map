-- Allow admins to delete places
CREATE POLICY "Admins can delete places"
ON public.places
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));