
-- Add partner columns to places
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS is_partner boolean NOT NULL DEFAULT false;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS has_active_offer boolean NOT NULL DEFAULT false;

-- Set some places as partners with active offers
UPDATE public.places SET is_partner = true, has_active_offer = true WHERE name IN ('La Mamounia', 'Royal Mansour', 'Kabana Rooftop', 'Le Comptoir Darna', 'Jad Mahal');
UPDATE public.places SET is_partner = true, has_active_offer = false WHERE name IN ('Nomad', 'El Fenn', 'Hôtel Selman');
