
-- Create partner_accounts table
CREATE TABLE IF NOT EXISTS public.partner_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'manager',
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, place_id)
);

ALTER TABLE public.partner_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own partner accounts" ON public.partner_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all partner accounts" ON public.partner_accounts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert partner accounts" ON public.partner_accounts FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update partner accounts" ON public.partner_accounts FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete partner accounts" ON public.partner_accounts FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Partners insert own account" ON public.partner_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add updated_at to places if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'places' AND column_name = 'updated_at') THEN
    ALTER TABLE public.places ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Create trigger for places updated_at
DROP TRIGGER IF EXISTS places_updated_at ON public.places;
CREATE TRIGGER places_updated_at BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
