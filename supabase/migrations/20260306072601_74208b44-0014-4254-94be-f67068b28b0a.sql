
-- Table for multiple photos per place
CREATE TABLE public.place_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: everyone can view, partners/admins can manage
ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view place photos"
  ON public.place_photos FOR SELECT
  USING (true);

CREATE POLICY "Partners and admins can insert place photos"
  ON public.place_photos FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners and admins can update place photos"
  ON public.place_photos FOR UPDATE
  USING (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners and admins can delete place photos"
  ON public.place_photos FOR DELETE
  USING (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add menu_url to places
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS menu_url text;
