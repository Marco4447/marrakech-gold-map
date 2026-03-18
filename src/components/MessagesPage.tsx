import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Send, Search, MessageCircle,
  Check, CheckCheck, X, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConversations, type Conversation } from "@/hooks/useConversations";
import { useFollows } from "@/hooks/useFollows";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FollowButton from "./FollowButton";
import { timeAgo } from "@/lib/timeAgo";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

// ─── ChatView ─────────────────────────────────────────────────────────────────

function ChatView({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 30;

  const fetchMessages = useCallback(async (pageNum: number = 0) => {
    try {
      const from = pageNum * PAGE_SIZE;
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;

      const sorted = (data || []).reverse();
      setHasMore((data || []).length === PAGE_SIZE);

      if (pageNum === 0) {
        setMessages(sorted);
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 50);
      } else {
        setMessages(prev => [...sorted, ...prev]);
      }

      // Mark as read
      if (user && data && data.length > 0) {
        const unreadIds = data
          .filter((m: any) => m.sender_id !== user.id && !m.is_read)
          .map((m: any) => m.id);
        if (unreadIds.length > 0) {
          await supabase
            .from("messages")
            .update({ is_read: true })
            .in("id", unreadIds);
        }
      }
    } catch (err) {
      console.error("fetchMessages error:", err);
    }
  }, [conversation.id, user]);

  useEffect(() => {
    fetchMessages(0);
    setPage(0);
  }, [fetchMessages]);

  // Load more on scroll to top
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    if (scrollRef.current.scrollTop < 60 && hasMore && !loadingMore) {
      setLoadingMore(true);
      const prevHeight = scrollRef.current.scrollHeight;
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage).then(() => {
        setLoadingMore(false);
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop =
              scrollRef.current.scrollHeight - prevHeight;
          }
        });
      });
    }
  }, [hasMore, loadingMore, page, fetchMessages]);

  // Realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversation.id}`,
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages(prev =>
          prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
        );
        if (user && msg.sender_id !== user.id) {
          supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
        }
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 50);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversation.id, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);
    try {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content,
      } as any);
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);
    } catch {
      toast.error("Impossible d'envoyer le message");
      setNewMessage(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={onBack} className="text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar className="w-8 h-8">
            <AvatarImage src={conversation.otherUserAvatar || undefined} />
            <AvatarFallback className="bg-gold/10 text-gold text-xs">
              {conversation.otherUserName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {conversation.otherUserName}
            </p>
          </div>
        </div>
        <FollowButton
          targetUserId={conversation.otherUserId}
          size="sm"
          variant="outline"
        />
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 no-scrollbar"
      >
        {loadingMore && (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {hasMore && !loadingMore && messages.length >= PAGE_SIZE && (
          <button
            onClick={() => {
              setLoadingMore(true);
              const nextPage = page + 1;
              setPage(nextPage);
              fetchMessages(nextPage).then(() => setLoadingMore(false));
            }}
            className="w-full text-center text-[11px] text-muted-foreground py-2 hover:text-foreground transition-colors"
          >
            Voir les messages précédents
          </button>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[40vh] text-center">
            <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Début de la conversation
            </p>
            <p className="text-xs text-muted-foreground">
              Dis bonjour à {conversation.otherUserName} 👋
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.sender_id === user?.id;
          const prevMsg = messages[i - 1];
          const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
          const isLastMine = isMine &&
            (i === messages.length - 1 || messages[i + 1]?.sender_id !== user?.id);

          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && (
                <div className="w-6 flex-shrink-0">
                  {showAvatar ? (
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={conversation.otherUserAvatar || undefined} />
                      <AvatarFallback className="bg-gold/10 text-gold text-[9px]">
                        {conversation.otherUserName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>
              )}

              <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    isMine
                      ? "bg-foreground text-background rounded-br-md"
                      : "bg-card border border-border text-foreground rounded-bl-md"
                  }`}
                >
                  <p>{msg.content}</p>
                </div>

                {isLastMine && (
                  <div className="flex items-center justify-end gap-1 mt-0.5 pr-1">
                    <span className="text-[9px] text-muted-foreground">
                      {timeAgo(msg.created_at)}
                    </span>
                    {msg.is_read ? (
                      <CheckCheck className="w-3 h-3 text-gold" />
                    ) : (
                      <Check className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Input ── */}
      <div className="sticky bottom-0 bg-background border-t border-border/50 px-4 py-3 safe-area-pb">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${conversation.otherUserName}…`}
            className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/40 transition-colors"
            maxLength={1000}
          />
          <AnimatePresence>
            {newMessage.trim() && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={handleSend}
                disabled={sending}
                className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light, var(--gold))))" }}
              >
                <Send className="w-4 h-4 text-primary-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── ConversationRow ────────────────────────────────────────────────────────

function ConversationRow({
  conversation,
  onClick,
}: {
  conversation: Conversation;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-card/50 active:bg-card/70 transition-colors text-left"
    >
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={conversation.otherUserAvatar || undefined} />
          <AvatarFallback className="bg-gold/10 text-gold font-semibold">
            {conversation.otherUserName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {conversation.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm truncate ${
            conversation.unreadCount > 0
              ? "font-bold text-foreground"
              : "font-medium text-foreground"
          }`}>
            {conversation.otherUserName}
          </p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
            {timeAgo(conversation.lastMessageAt)}
          </span>
        </div>
        {conversation.lastMessage && (
          <p className={`text-xs truncate mt-0.5 ${
            conversation.unreadCount > 0
              ? "text-foreground font-medium"
              : "text-muted-foreground"
          }`}>
            {conversation.lastMessage}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── MessagesPage ─────────────────────────────────────────────────────────────

export default function MessagesPage({ onBack }: { onBack: () => void }) {
  const { conversations, loading, startConversation } = useConversations();
  const { user } = useAuth();
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await supabase
          .from("profiles_public" as any)
          .select("user_id, full_name, avatar_url")
          .ilike("full_name", `%${q.trim()}%`)
          .limit(8);
        setSearchResults(
          (data || []).filter((p: any) => p.user_id !== user?.id)
        );
      } catch {
        toast.error("Recherche impossible");
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [user]);

  const handleStartChat = async (otherUserId: string, profile?: any) => {
    try {
      const convoId = await startConversation(otherUserId);
      if (convoId) {
        const p = profile || searchResults.find((r: any) => r.user_id === otherUserId);
        setActiveConvo({
          id: convoId,
          otherUserId,
          otherUserName: p?.full_name || "Utilisateur",
          otherUserAvatar: p?.avatar_url || null,
          lastMessage: null,
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
        });
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch {
      toast.error("Impossible de démarrer la conversation");
    }
  };

  // Listen for external "open DM" event (from vibe share or profile)
  useEffect(() => {
    // Check for pending DM from sessionStorage (set before navigation)
    const pending = sessionStorage.getItem("wk_pending_dm");
    if (pending) {
      sessionStorage.removeItem("wk_pending_dm");
      try {
        const { userId, userName, userAvatar } = JSON.parse(pending);
        if (userId) {
          handleStartChat(userId, { full_name: userName, avatar_url: userAvatar });
        }
      } catch {}
    }

    const handler = (e: CustomEvent) => {
      const { userId, userName, userAvatar } = e.detail || {};
      if (userId) {
        handleStartChat(userId, { full_name: userName, avatar_url: userAvatar });
      }
    };
    const dmHandler = (e: CustomEvent) => {
      // Legacy vibe share event
      if (e.detail?.vibeUrl) {
        // handled by existing flow
      }
    };
    window.addEventListener("wk:open-dm", handler as EventListener);
    window.addEventListener("wk:share-vibe-dm", dmHandler as EventListener);
    return () => {
      window.removeEventListener("wk:open-dm", handler as EventListener);
      window.removeEventListener("wk:share-vibe-dm", dmHandler as EventListener);
    };
  }, []);

  if (activeConvo) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="chat"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="h-full"
        >
          <ChatView
            conversation={activeConvo}
            onBack={() => setActiveConvo(null)}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-foreground active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground font-display">Messages</h1>
        </div>
        <button
          onClick={() => document.getElementById("dm-search")?.focus()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-card active:scale-90 transition-all"
        >
          <UserPlus className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* ── Search ── */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="dm-search"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Chercher un utilisateur…"
            className="w-full pl-9 pr-9 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        <AnimatePresence>
          {(searchResults.length > 0 || searchLoading) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 bg-card border border-border rounded-xl overflow-hidden"
            >
              {searchLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                searchResults.map((p: any) => (
                  <button
                    key={p.user_id}
                    onClick={() => handleStartChat(p.user_id, p)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary active:bg-secondary transition-colors border-b border-border last:border-0 text-left"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="bg-gold/10 text-gold text-xs">
                        {(p.full_name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.full_name || "Utilisateur"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Démarrer une conversation
                      </p>
                    </div>
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Conversation list ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="space-y-3 px-4 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-card animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-card animate-pulse rounded" />
                  <div className="h-2.5 w-40 bg-card animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1.5">Aucun message</h2>
            <p className="text-[13px] text-muted-foreground">
              Cherche un utilisateur ci-dessus pour démarrer une conversation
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                onClick={() => setActiveConvo(c)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
