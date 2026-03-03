
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can verify VIP status" ON public.profiles;

-- Create a security definer function for VIP verification (no email exposed)
CREATE OR REPLACE FUNCTION public.verify_vip_status(p_user_id uuid)
RETURNS TABLE(valid boolean, full_name text, is_vip boolean, vip_expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (p.is_vip = true AND (p.vip_expires_at IS NULL OR p.vip_expires_at > now())) AS valid,
    p.full_name,
    p.is_vip,
    p.vip_expires_at
  FROM profiles p
  WHERE p.user_id = p_user_id
  LIMIT 1;
$$;
