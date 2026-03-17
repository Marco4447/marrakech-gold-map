
CREATE TABLE public.party_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🎉',
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '12 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.party_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active groups" ON public.party_groups FOR SELECT USING (expires_at > now());
CREATE POLICY "Auth users can create groups" ON public.party_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can delete groups" ON public.party_groups FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TABLE public.party_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.party_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.party_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group members" ON public.party_group_members FOR SELECT USING (true);
CREATE POLICY "Auth users can join groups" ON public.party_group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.party_group_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.party_group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.party_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.party_group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group messages" ON public.party_group_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.party_group_members WHERE group_id = party_group_messages.group_id AND user_id = auth.uid()));
CREATE POLICY "Members can send messages" ON public.party_group_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.party_group_members WHERE group_id = party_group_messages.group_id AND user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.party_group_messages;
