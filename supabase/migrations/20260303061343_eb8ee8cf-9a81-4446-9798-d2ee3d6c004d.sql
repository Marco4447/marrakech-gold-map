
-- Add vip_perk_description column to places table
ALTER TABLE public.places ADD COLUMN vip_perk_description text;

-- Allow partners to update their own places (matched by name via their vibes)
CREATE POLICY "Partners can update places"
ON public.places
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
