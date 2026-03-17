import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Send, Search, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConversations, type Conversation } from "@/hooks/useConversations";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/timeAgo";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

function ChatView({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 50;

  const fetchMessages = useCallback(async (pageNum: number = 0) => {
    const from = pageNum * PAGE_SIZE;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const sorted = (data || []).reverse();
    if (pageNum === 0) setMessages(sorted);
    else {
      const prevHeight = scrollRef.current?.scrollHeight || 0;
      setMessages(prev => [...sorted, ...prev]);
      // Restore scroll position after prepend
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
        }
      });
    }
    setHasMore((data || []).length === PAGE_SIZE);

    // Mark as read
    if (user) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversation.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    }
  }, [conversation.id, user]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Realtime
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
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        // Mark as read if from other
        if (user && msg.sender_id !== user.id) {
          supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversation.id, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
    } as any);

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-foreground active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar className="w-8 h-8">
          <AvatarImage src={conversation.otherUserAvatar || undefined} />
          <AvatarFallback className="bg-gold/10 text-gold text-xs">
            {conversation.otherUserName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm font-semibold text-foreground truncate">{conversation.otherUserName}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 no-scrollbar">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground pt-10">Commence la conversation 👋</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                isMine
                  ? "bg-foreground text-background rounded-br-md"
                  : "bg-card border border-border text-foreground rounded-bl-md"
              }`}>
                <p>{msg.content}</p>
                <p className={`text-[9px] mt-1 ${isMine ? "text-background/50" : "text-muted-foreground"}`}>
                  {timeAgo(msg.created_at)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Message…"
            className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/40"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage({ onBack }: { onBack: () => void }) {
  const { conversations, loading, startConversation } = useConversations();
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { user } = useAuth();

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("profiles_public" as any)
      .select("user_id, full_name, avatar_url")
      .ilike("full_name", `%${q}%`)
      .limit(10);
    if (data) setSearchResults(data.filter((p: any) => p.user_id !== user?.id));
  };

  const handleStartChat = async (otherUserId: string) => {
    const convoId = await startConversation(otherUserId);
    if (convoId) {
      const profile = searchResults.find(p => p.user_id === otherUserId);
      setActiveConvo({
        id: convoId,
        otherUserId,
        otherUserName: profile?.full_name || "Utilisateur",
        otherUserAvatar: profile?.avatar_url || null,
        lastMessage: null,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      });
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  if (activeConvo) {
    return <ChatView conversation={activeConvo} onBack={() => setActiveConvo(null)} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-foreground active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-display">Messages</h1>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher un utilisateur…"
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/40"
          />
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-card border border-border rounded-xl overflow-hidden">
            {searchResults.map((p: any) => (
              <button
                key={p.user_id}
                onClick={() => handleStartChat(p.user_id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-0"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className="bg-gold/10 text-gold text-xs">
                    {(p.full_name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-foreground">{p.full_name || "Utilisateur"}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="space-y-3 px-4 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
            <p className="text-[13px] text-muted-foreground">Recherche un utilisateur pour démarrer une conversation.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConvo(c)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-card/50 transition-colors text-left"
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={c.otherUserAvatar || undefined} />
                    <AvatarFallback className="bg-gold/10 text-gold font-semibold">
                      {c.otherUserName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {c.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${c.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                      {c.otherUserName}
                    </p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                      {timeAgo(c.lastMessageAt)}
                    </span>
                  </div>
                  {c.lastMessage && (
                    <p className={`text-xs truncate mt-0.5 ${c.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {c.lastMessage}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
