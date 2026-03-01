-- Add user_id column to vibes table to link posts to authenticated users
ALTER TABLE public.vibes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX idx_vibes_user_id ON public.vibes(user_id);