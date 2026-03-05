
-- Partner subscriptions table
CREATE TABLE public.partner_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  place_id uuid REFERENCES public.places(id) ON DELETE SET NULL,
  plan_type text NOT NULL DEFAULT 'basic',
  status text NOT NULL DEFAULT 'active',
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own subscriptions" ON public.partner_subscriptions
  FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY "Admins can view all subscriptions" ON public.partner_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert subscriptions" ON public.partner_subscriptions
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = partner_id);

CREATE POLICY "Admins can update subscriptions" ON public.partner_subscriptions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Sponsored events table
CREATE TABLE public.sponsored_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  boost_level text NOT NULL DEFAULT 'standard',
  price_paid numeric NOT NULL DEFAULT 0,
  stripe_session_id text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsored_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sponsored events" ON public.sponsored_events
  FOR SELECT USING (true);

CREATE POLICY "Partners can insert sponsored events" ON public.sponsored_events
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can update own events" ON public.sponsored_events
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Venue analytics tracking table
CREATE TABLE public.venue_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.venue_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners and admins can view analytics" ON public.venue_analytics
  FOR SELECT USING (has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert analytics events" ON public.venue_analytics
  FOR INSERT WITH CHECK (true);

-- Add trigger for updated_at on partner_subscriptions
CREATE TRIGGER update_partner_subscriptions_updated_at
  BEFORE UPDATE ON public.partner_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for sponsored_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.sponsored_events;
