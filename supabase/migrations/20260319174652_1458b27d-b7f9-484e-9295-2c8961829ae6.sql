DROP INDEX IF EXISTS places_slug_unique;
CREATE UNIQUE INDEX places_slug_unique ON public.places USING btree (slug);