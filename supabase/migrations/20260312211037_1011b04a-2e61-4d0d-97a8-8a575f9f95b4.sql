
CREATE TABLE public.partner_prospects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text DEFAULT '',
  neighborhood text DEFAULT '',
  status text NOT NULL DEFAULT 'prospect',
  priority text NOT NULL DEFAULT 'medium',
  instagram text DEFAULT '',
  whatsapp text DEFAULT '',
  contact_name text DEFAULT '',
  first_contact_date date,
  follow_up_date date,
  credits_offered integer NOT NULL DEFAULT 15,
  app_link text DEFAULT '',
  invite_link text DEFAULT '',
  notes text DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prospects" ON public.partner_prospects
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_partner_prospects_updated_at
  BEFORE UPDATE ON public.partner_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
