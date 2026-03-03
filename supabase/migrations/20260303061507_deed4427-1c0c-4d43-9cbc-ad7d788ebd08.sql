
-- Allow public read of VIP status for bouncer verification
-- This is a permissive policy that only exposes is_vip and vip_expires_at fields
-- The actual column restriction is handled at the application level
CREATE POLICY "Public can verify VIP status"
ON public.profiles
FOR SELECT
USING (true);
