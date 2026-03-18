import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch all conversations for this user
      const { data: convos, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (error || !convos || convos.length === 0) {
        setConversations([]);
        setTotalUnread(0);
        setLoading(false);
        return;
      }

      // 2. Get all other user IDs in one shot
      const otherUserIds = convos.map((c: any) =>
        c.user1_id === user.id ? c.user2_id : c.user1_id
      );
      const convoIds = convos.map((c: any) => c.id);

      // 3. Fetch all profiles in one query
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("user_id, full_name, avatar_url")
        .in("user_id", otherUserIds);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });

      // 4. Fetch all messages in batch (latest per conversation)
      const { data: allMessages } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at, sender_id, is_read")
        .in("conversation_id", convoIds)
        .order("created_at", { ascending: false });

      // Group messages by conversation — first = latest
      const lastMsgMap: Record<string, any> = {};
      const unreadMap: Record<string, number> = {};
      (allMessages || []).forEach((msg: any) => {
        if (!lastMsgMap[msg.conversation_id]) {
          lastMsgMap[msg.conversation_id] = msg;
        }
        if (msg.sender_id !== user.id && !msg.is_read) {
          unreadMap[msg.conversation_id] = (unreadMap[msg.conversation_id] || 0) + 1;
        }
      });

      // 5. Build result
      const result: Conversation[] = convos.map((c: any) => {
        const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
        const profile = profileMap[otherId];
        const lastMsg = lastMsgMap[c.id];
        const unreadCount = unreadMap[c.id] || 0;

        return {
          id: c.id,
          otherUserId: otherId,
          otherUserName: profile?.full_name || "Utilisateur",
          otherUserAvatar: profile?.avatar_url || null,
          lastMessage: lastMsg?.content || null,
          lastMessageAt: lastMsg?.created_at || c.created_at,
          unreadCount,
        };
      });

      const totalUnreadCount = result.reduce((sum, c) => sum + c.unreadCount, 0);
      setConversations(result);
      setTotalUnread(totalUnreadCount);
    } catch (err) {
      console.error("fetchConversations error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dm-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  const startConversation = useCallback(async (otherUserId: string) => {
    if (!user) return null;

    // Check if conversation exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
      .maybeSingle();

    if (existing) return existing.id;

    // Create new conversation (ensure user1_id < user2_id for uniqueness)
    const [u1, u2] = user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];
    const { data: newConvo } = await supabase
      .from("conversations")
      .insert({ user1_id: u1, user2_id: u2 } as any)
      .select("id")
      .single();

    if (newConvo) {
      fetchConversations();
      return newConvo.id;
    }
    return null;
  }, [user, fetchConversations]);

  return { conversations, loading, totalUnread, fetchConversations, startConversation };
}
