ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferences text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.profiles
SET onboarding_completed = true
WHERE onboarding_completed = false;