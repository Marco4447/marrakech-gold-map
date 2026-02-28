
INSERT INTO storage.buckets (id, name, public) VALUES ('vibes', 'vibes', true);

CREATE POLICY "Anyone can view vibe images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vibes');

CREATE POLICY "Anyone can upload vibe images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vibes');
