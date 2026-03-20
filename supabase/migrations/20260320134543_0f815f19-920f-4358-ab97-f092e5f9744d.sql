
-- Create public bucket for spot images
INSERT INTO storage.buckets (id, name, public) VALUES ('spot-images', 'spot-images', true) ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to spot-images
CREATE POLICY "Allow public uploads spot-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'spot-images');

-- Allow anyone to read from spot-images
CREATE POLICY "Allow public reads spot-images" ON storage.objects FOR SELECT USING (bucket_id = 'spot-images');

-- Also allow uploads to vibes_media
CREATE POLICY "Allow public uploads vibes_media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vibes_media');
