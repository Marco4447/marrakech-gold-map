
-- Partner invite tokens table
CREATE TABLE public.partner_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  created_by uuid NOT NULL,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

-- RLS
ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage invites" ON public.partner_invites
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read an invite by token (needed for the invite page)
CREATE POLICY "Anyone can read invite by token" ON public.partner_invites
  FOR SELECT TO authenticated
  USING (true);
