-- Audit log for admin actions (who did what, when)
-- Distinct from admin_events which tracks user-facing events (signups, vibes, etc.)

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,           -- e.g. 'update_credits', 'approve_partner', 'hide_story', 'delete_venue'
  target_table text NOT NULL,     -- e.g. 'partner_credits', 'stories', 'places'
  target_id text,                 -- ID of the affected record
  old_value jsonb,                -- previous state (optional)
  new_value jsonb,                -- new state (optional)
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view audit_logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit_logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookups
CREATE INDEX idx_audit_logs_admin ON public.audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_target ON public.audit_logs(target_table, target_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
