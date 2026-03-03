-- Add user_id to partner_requests so we can link requests to authenticated users
ALTER TABLE public.partner_requests ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow authenticated users to view their own requests
CREATE POLICY "Users can view their own requests"
ON public.partner_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
