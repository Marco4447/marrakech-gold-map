
-- Add VIP fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS vip_expires_at timestamp with time zone;

-- RLS: users can read their own VIP status (already covered by existing SELECT policy)
