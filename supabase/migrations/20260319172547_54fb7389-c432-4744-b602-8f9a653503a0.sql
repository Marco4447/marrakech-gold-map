
CREATE TABLE message_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL DEFAULT '❤️',
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read reactions" ON message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert own reactions" ON message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON message_reactions FOR DELETE USING (auth.uid() = user_id);
