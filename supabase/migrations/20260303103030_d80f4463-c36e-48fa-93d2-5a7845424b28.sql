
-- Update profiles_public view to expose VIP status
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT user_id, full_name, avatar_url, is_vip
FROM profiles;
