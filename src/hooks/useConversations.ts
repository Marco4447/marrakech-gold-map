import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

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
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ─── FETCH OPTIMISÉ : 0 N+1 query ────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!user) {
      if (isMounted.current) {
        setConversations([]);
        setTotalUnread(0);
        setLoading(false);
      }
      return;
    }

    if (isMounted.current) setLoading(true);

    try {
      // 1. Toutes les conversations de l'utilisateur
      const { data: convos, error: convosError } = await supabase
        .from("conversations")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (convosError) throw convosError;

      if (!convos || convos.length === 0) {
        if (isMounted.current) {
          setConversations([]);
          setTotalUnread(0);
          setLoading(false);
        }
        return;
      }

      const convoIds = convos.map((c: any) => c.id);
      const otherUserIds = [
        ...new Set(
          convos.map((c: any) => (c.user1_id === user.id ? c.user2_id : c.user1_id))
        ),
      ];

      // 2. Tous les profils en 1 seule requête
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles_public" as any)
        .select("user_id, full_name, avatar_url")
        .in("user_id", otherUserIds);

      if (profilesError) throw profilesError;

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => {
        if (p?.user_id) profileMap[p.user_id] = p;
      });

      // 3. Tous les messages récents en 1 seule requête
      const { data: allMessages, error: messagesError } = await supabase
        .from("messages")
        .select("id, conversation_id, content, created_at, sender_id, is_read")
        .in("conversation_id", convoIds)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      // Construire lastMsg + unread par conversation
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

      // 4. Assembler le résultat — filtrer les conversations sans profil valide
      const result: Conversation[] = convos
        .map((c: any) => {
          const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
          const profile = profileMap[otherId];
          const lastMsg = lastMsgMap[c.id];
          const unreadCount = unreadMap[c.id] || 0;

          return {
            id: c.id,
            otherUserId: otherId,
            otherUserName: profile?.full_name || null,
            otherUserAvatar: profile?.avatar_url || null,
            lastMessage: lastMsg?.content || null,
            lastMessageAt: lastMsg?.created_at || c.last_message_at || c.created_at,
            unreadCount,
          };
        })
        .filter((c) => c.otherUserName !== null) as Conversation[];

      const totalUnreadCount = result.reduce((sum, convo) => sum + convo.unreadCount, 0);

      if (isMounted.current) {
        setConversations(result);
        setTotalUnread(totalUnreadCount);
        setLoading(false);
      }
    } catch (err) {
      console.error("fetchConversations error:", err);
      toast.error("Impossible de charger les conversations");
      if (isMounted.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  // ─── REALTIME : mise à jour légère sans refetch complet ──────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dm-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as any;
          let foundConversation = false;

          setConversations((prev) => {
            const next = prev
              .map((conversation) => {
                if (conversation.id !== msg.conversation_id) return conversation;
                foundConversation = true;
                const isFromOther = msg.sender_id !== user.id;
                return {
                  ...conversation,
                  lastMessage: msg.content,
                  lastMessageAt: msg.created_at,
                  unreadCount: isFromOther
                    ? conversation.unreadCount + 1
                    : conversation.unreadCount,
                };
              })
              .sort(
                (a, b) =>
                  new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
              );

            return next;
          });

          if (!foundConversation) {
            void fetchConversations();
            return;
          }

          if (msg.sender_id !== user.id) {
            setTotalUnread((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg?.is_read) {
            setConversations((prev) =>
              prev.map((conversation) => {
                if (conversation.id !== msg.conversation_id) return conversation;
                return {
                  ...conversation,
                  unreadCount: Math.max(
                    0,
                    msg.sender_id !== user.id
                      ? conversation.unreadCount - 1
                      : conversation.unreadCount
                  ),
                };
              })
            );

            if (msg.sender_id !== user.id) {
              setTotalUnread((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  // ─── DÉMARRER UNE CONVERSATION ───────────────────────────────────────────
  const startConversation = useCallback(
    async (otherUserId: string): Promise<string | null> => {
      if (!user) return null;

      const targetId = (otherUserId || "").trim();
      if (!targetId || targetId === user.id) return null;

      try {
        // Vérifier que la cible existe bien dans les profils publics
        const { data: targetProfileRaw, error: targetError } = await supabase
          .from("profiles_public" as any)
          .select("user_id")
          .eq("user_id", targetId)
          .maybeSingle();

        if (targetError) throw targetError;
        const targetProfile = targetProfileRaw as unknown as { user_id: string } | null;
        if (!targetProfile?.user_id) return null;

        // Vérifier si existe déjà
        const { data: existing, error: existingError } = await supabase
          .from("conversations")
          .select("id")
          .or(
            `and(user1_id.eq.${user.id},user2_id.eq.${targetId}),` +
              `and(user1_id.eq.${targetId},user2_id.eq.${user.id})`
          )
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing?.id) return existing.id;

        // Créer (user1_id < user2_id pour unicité)
        const [u1, u2] = user.id < targetId ? [user.id, targetId] : [targetId, user.id];

        const { data: newConvo, error: insertError } = await supabase
          .from("conversations")
          .insert({ user1_id: u1, user2_id: u2 } as any)
          .select("id")
          .maybeSingle();

        if (insertError) {
          // race condition fallback
          const { data: retry, error: retryError } = await supabase
            .from("conversations")
            .select("id")
            .or(
              `and(user1_id.eq.${user.id},user2_id.eq.${targetId}),` +
                `and(user1_id.eq.${targetId},user2_id.eq.${user.id})`
            )
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (retryError) throw retryError;
          if (retry?.id) return retry.id;
          throw insertError;
        }

        if (newConvo?.id) {
          void fetchConversations();
          return newConvo.id;
        }

        return null;
      } catch (err) {
        console.error("startConversation error:", err);
        toast.error("Impossible de démarrer la conversation");
        return null;
      }
    },
    [user, fetchConversations]
  );

  // ─── MARQUER TOUT LU ─────────────────────────────────────────────────────
  const markConversationRead = useCallback(
    async (conversationId: string) => {
      if (!user) return;
      try {
        const unreadBefore = conversations.find((c) => c.id === conversationId)?.unreadCount || 0;

        const { error } = await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .eq("is_read", false);

        if (error) throw error;

        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
        setTotalUnread((prev) => Math.max(0, prev - unreadBefore));
      } catch (err) {
        console.error("markConversationRead error:", err);
        toast.error("Impossible de marquer la conversation comme lue");
      }
    },
    [user, conversations]
  );

  return {
    conversations,
    loading,
    totalUnread,
    fetchConversations,
    startConversation,
    markConversationRead,
  };
}
