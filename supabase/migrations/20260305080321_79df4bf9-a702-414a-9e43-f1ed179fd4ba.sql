
-- Referral system tables
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL REFERENCES public.referral_codes(code),
  referred_user_id uuid NOT NULL UNIQUE,
  referrer_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_uses ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
CREATE POLICY "Users can view their own referral code"
  ON public.referral_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code"
  ON public.referral_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for referral_uses
CREATE POLICY "Anyone authenticated can insert referral use"
  ON public.referral_uses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referred_user_id);

CREATE POLICY "Users can view referrals they made"
  ON public.referral_uses FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_user_id);

-- Function to check and grant VIP on 3 referrals
CREATE OR REPLACE FUNCTION public.check_referral_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  referral_count INT;
  v_referrer_user_id uuid;
BEGIN
  v_referrer_user_id := NEW.referrer_user_id;
  
  SELECT count(*) INTO referral_count
  FROM public.referral_uses
  WHERE referrer_user_id = v_referrer_user_id;
  
  -- Grant 7 days VIP on every 3 referrals
  IF referral_count > 0 AND referral_count % 3 = 0 THEN
    UPDATE public.profiles
    SET is_vip = true,
        vip_expires_at = GREATEST(
          COALESCE(vip_expires_at, now()),
          now()
        ) + interval '7 days'
    WHERE user_id = v_referrer_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_referral_use_check_reward
  AFTER INSERT ON public.referral_uses
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_reward();

-- Enable RLS on processed_stripe_events
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;
