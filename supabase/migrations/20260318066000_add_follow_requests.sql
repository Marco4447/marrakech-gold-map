-- Add private profile support
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

-- Follow requests table for private profiles
CREATE TABLE public.follow_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_id, target_id),
  CHECK (requester_id != target_id)
);

ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

-- Requester can see their sent requests
CREATE POLICY "Users can view their sent requests"
ON public.follow_requests FOR SELECT
TO authenticated
USING (auth.uid() = requester_id);

-- Target can see requests sent to them
CREATE POLICY "Users can view requests to them"
ON public.follow_requests FOR SELECT
TO authenticated
USING (auth.uid() = target_id);

-- Users can send follow requests
CREATE POLICY "Users can send follow requests"
ON public.follow_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_id);

-- Target can update (accept/reject) requests sent to them
CREATE POLICY "Users can update requests to them"
ON public.follow_requests FOR UPDATE
TO authenticated
USING (auth.uid() = target_id)
WITH CHECK (auth.uid() = target_id);

-- Users can delete their own sent requests
CREATE POLICY "Users can cancel their requests"
ON public.follow_requests FOR DELETE
TO authenticated
USING (auth.uid() = requester_id);

CREATE INDEX idx_follow_requests_target ON public.follow_requests(target_id, status);
CREATE INDEX idx_follow_requests_requester ON public.follow_requests(requester_id);
