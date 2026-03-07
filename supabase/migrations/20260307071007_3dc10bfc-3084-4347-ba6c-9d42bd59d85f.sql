
ALTER TABLE public.partner_invites
  ADD COLUMN initial_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN initial_plan text DEFAULT NULL,
  ADD COLUMN initial_plan_days integer NOT NULL DEFAULT 30;
