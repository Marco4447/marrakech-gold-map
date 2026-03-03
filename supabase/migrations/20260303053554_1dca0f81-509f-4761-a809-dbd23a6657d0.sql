
-- Create a public bucket for partner media uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('vibes_media', 'vibes_media', true) ON CONFLICT DO NOTHING;

-- Storage policies for vibes_media bucket
CREATE POLICY "Anyone can view vibes_media"
ON storage.objects FOR SELECT
USING (bucket_id = 'vibes_media');

CREATE POLICY "Authenticated users can upload to vibes_media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vibes_media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own vibes_media"
ON storage.objects FOR DELETE
USING (bucket_id = 'vibes_media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Atomic RPC: publish a vibe and deduct 1 credit in a single transaction
-- Adapted to existing schema: partner_credits(user_id, credits) and vibes table
CREATE OR REPLACE FUNCTION public.publish_vibe_use_credit(
  p_image_url TEXT,
  p_caption TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_mood TEXT DEFAULT NULL,
  p_media_type TEXT DEFAULT 'photo'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_credits INT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the row to prevent race conditions
  SELECT credits INTO v_current_credits
  FROM partner_credits
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL OR v_current_credits < 1 THEN
    RAISE EXCEPTION 'Not enough Vibe Credits. Please purchase a pack.';
  END IF;

  -- Deduct 1 credit
  UPDATE partner_credits
  SET credits = credits - 1, updated_at = now()
  WHERE user_id = v_user_id;

  -- Insert the official vibe
  INSERT INTO vibes (image_url, caption, location, mood, media_type, is_official, user_id, username)
  VALUES (
    p_image_url,
    p_caption,
    p_location,
    p_mood,
    p_media_type,
    true,
    v_user_id,
    (SELECT COALESCE(full_name, email) FROM profiles WHERE user_id = v_user_id LIMIT 1)
  );

  RETURN true;
END;
$$;
