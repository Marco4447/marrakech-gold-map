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
    
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const otherUserIds = convos.map((c: any) => 
      c.user1_id === user.id ? c.user2_id : c.user1_id
    );

    const { data: profiles } = await supabase
      .from("profiles_public" as any)
      .select("user_id, full_name, avatar_url")
      .in("user_id", otherUserIds);

    const profileMap: Record<string, any> = {};
    profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

    // Get last message + unread count for each conversation
    let unreadTotal = 0;
    const result: Conversation[] = [];

    for (const c of convos as any[]) {
      const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
      const profile = profileMap[otherId];

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const { count: unread } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      const unreadCount = unread || 0;
      unreadTotal += unreadCount;

      result.push({
        id: c.id,
        otherUserId: otherId,
        otherUserName: profile?.full_name || "Utilisateur",
        otherUserAvatar: profile?.avatar_url || null,
        lastMessage: lastMsg?.[0]?.content || null,
        lastMessageAt: lastMsg?.[0]?.created_at || c.created_at,
        unreadCount,
      });
    }

    setConversations(result);
    setTotalUnread(unreadTotal);
    setLoading(false);
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
