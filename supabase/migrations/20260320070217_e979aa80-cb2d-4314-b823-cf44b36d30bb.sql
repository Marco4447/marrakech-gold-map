ALTER TABLE public.places ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS is_outdoor boolean DEFAULT false;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS energy_score integer DEFAULT 50;