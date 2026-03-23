-- Email queue table for scheduled emails
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  email text NOT NULL,
  email_type text NOT NULL,
  send_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage email_queue" ON email_queue FOR ALL USING (true);

-- Database webhook triggers (configure in Supabase Dashboard → Database → Webhooks)
--
-- Webhook 1: User onboarding
--   Table: profiles
--   Event: INSERT
--   URL: https://pyocqorzbsshawgknmpr.supabase.co/functions/v1/send-onboarding-email
--   Headers: Authorization: Bearer [SERVICE_ROLE_KEY]
--
-- Webhook 2: Partner approval
--   Table: partner_requests
--   Event: UPDATE
--   URL: https://pyocqorzbsshawgknmpr.supabase.co/functions/v1/send-partner-email
--   Headers: Authorization: Bearer [SERVICE_ROLE_KEY]
