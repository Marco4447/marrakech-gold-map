-- Allow admins to insert user roles (for auto-assigning partner role on approval)
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert partner credits
CREATE POLICY "Admins can insert partner credits"
ON public.partner_credits
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
