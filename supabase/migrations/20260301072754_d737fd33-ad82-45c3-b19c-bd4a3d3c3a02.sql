
-- =============================================
-- 1. PARTNER REQUESTS TABLE
-- =============================================

CREATE TABLE public.partner_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  category text NOT NULL,
  offer_description text NOT NULL,
  whatsapp_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a partner request (public form)
CREATE POLICY "Anyone can submit partner requests"
  ON public.partner_requests FOR INSERT
  WITH CHECK (true);

-- =============================================
-- 2. USER ROLES (admin access)
-- =============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Only admins can view partner requests
CREATE POLICY "Admins can view partner requests"
  ON public.partner_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update partner request status
CREATE POLICY "Admins can update partner requests"
  ON public.partner_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can read their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
