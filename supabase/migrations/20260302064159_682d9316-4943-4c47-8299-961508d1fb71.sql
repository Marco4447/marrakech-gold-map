
-- Add 'partner' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';

-- Create partner_credits table for tracking vibe credits
CREATE TABLE public.partner_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  credits integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_credits ENABLE ROW LEVEL SECURITY;

-- Partners can view their own credits
CREATE POLICY "Users can view their own credits"
  ON public.partner_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Only backend (edge functions) can update credits via service role
CREATE POLICY "Users can read own credits"
  ON public.partner_credits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add is_official column to vibes
ALTER TABLE public.vibes ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;

-- Official vibes bypass the 6h rule for SELECT (visible longer)
DROP POLICY IF EXISTS "Users see recent vibes only" ON public.vibes;
CREATE POLICY "Users see recent vibes or official"
  ON public.vibes FOR SELECT
  USING (
    is_official = true
    OR created_at > (now() - interval '6 hours')
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Trigger for updated_at on partner_credits
CREATE TRIGGER update_partner_credits_updated_at
  BEFORE UPDATE ON public.partner_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
