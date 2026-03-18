
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT
  user_id,
  full_name,
  avatar_url,
  is_vip,
  username,
  bio
FROM public.profiles;
