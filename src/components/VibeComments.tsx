import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, Reply, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { timeAgoShort } from "@/lib/timeAgo";
import { getDeviceId } from "@/lib/deviceId";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface CommentProfile {
  user_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  device_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  parent_id: string | null;
  profile?: CommentProfile | null;
}

interface VibeCommentsProps {
  vibeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VibeComments({ vibeId, open, onOpenChange }: VibeCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const deviceId = getDeviceId();

  useEffect(() => {
    if (!open) return;

    const fetchComments = async () => {
      const { data } = await supabase
        .from("vibe_comments")
        .select("*")
        .eq("vibe_id", vibeId)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        // Fetch profiles for comments with user_id
        const userIds = [...new Set(data.filter(c => c.user_id).map(c => c.user_id!))] as string[];
        let profileMap: Record<string, CommentProfile> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles_public")
            .select("user_id, full_name, avatar_url")
            .in("user_id", userIds);
          if (profiles) {
            profileMap = Object.fromEntries(profiles.filter(p => p.user_id).map(p => [p.user_id!, p]));
          }
        }
        setComments(data.map(c => ({
          ...c,
          parent_id: (c as any).parent_id || null,
          profile: c.user_id ? profileMap[c.user_id] || null : null,
        })));
      } else {
        setComments([]);
      }
    };
    fetchComments();

    const channel = supabase
      .channel(`comments-${vibeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vibe_comments", filter: `vibe_id=eq.${vibeId}` },
        async (payload) => {
          const newComment = payload.new as any;
          let profile: CommentProfile | null = null;
          if (newComment.user_id) {
            const { data } = await supabase
              .from("profiles_public")
              .select("user_id, full_name, avatar_url")
              .eq("user_id", newComment.user_id)
              .maybeSingle();
            if (data) profile = data;
          }
          setComments((prev) => [...prev, { ...newComment, parent_id: newComment.parent_id || null, profile }]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, vibeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const insertData: any = {
      vibe_id: vibeId,
      device_id: deviceId,
      content: trimmed.slice(0, 500),
    };
    if (user) insertData.user_id = user.id;
    if (replyTo) insertData.parent_id = replyTo.id;

    await supabase.from("vibe_comments").insert(insertData);
    setText("");
    setReplyTo(null);
    setSending(false);
    inputRef.current?.focus();
  };

  const getDisplayName = (c: Comment): string => {
    if (c.profile?.full_name) return c.profile.full_name;
    if (c.user_id && c.user_id === user?.id) return "Vous";
    if (c.device_id === deviceId) return "Vous";
    return "Anonyme";
  };

  // Separate top-level and replies
  const topLevel = comments.filter(c => !c.parent_id);
  const repliesMap = new Map<string, Comment[]>();
  comments.filter(c => c.parent_id).forEach(c => {
    const arr = repliesMap.get(c.parent_id!) || [];
    arr.push(c);
    repliesMap.set(c.parent_id!, arr);
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[3000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[3001] max-h-[70vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="bg-card rounded-t-3xl border-t border-border shadow-2xl flex flex-col max-h-[70vh]">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              <div className="flex items-center justify-between px-5 pb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gold" />
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    Commentaires ({comments.length})
                  </h3>
                </div>
                <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 space-y-3 min-h-0 pb-2">
                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Aucun commentaire. Soyez le premier !
                  </p>
                ) : (
                  topLevel.map((c) => (
                    <div key={c.id}>
                      <CommentItem
                        comment={c}
                        deviceId={deviceId}
                        currentUserId={user?.id}
                        getDisplayName={getDisplayName}
                        onReply={() => { setReplyTo(c); inputRef.current?.focus(); try { navigator.vibrate?.(10); } catch {} }}
                      />
                      {/* Replies */}
                      {repliesMap.get(c.id)?.map((reply) => (
                        <div key={reply.id} className="ml-8 mt-1.5">
                          <CommentItem
                            comment={reply}
                            deviceId={deviceId}
                            currentUserId={user?.id}
                            getDisplayName={getDisplayName}
                            onReply={() => { setReplyTo(c); inputRef.current?.focus(); try { navigator.vibrate?.(10); } catch {} }}
                            isReply
                          />
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>

              {/* Reply banner */}
              {replyTo && (
                <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center gap-2">
                  <Reply className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground flex-1 truncate">
                    Réponse à {getDisplayName(replyTo)}
                  </span>
                  <button onClick={() => setReplyTo(null)} className="text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="border-t border-border px-4 py-3 flex gap-2 items-end">
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 500))}
                  placeholder={replyTo ? "Votre réponse…" : "Votre commentaire…"}
                  maxLength={500}
                  className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); if (e.key === "Escape") onOpenChange(false); }}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-40 flex items-center justify-center transition-all active:scale-90 shrink-0"
                >
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
              <div className="flex items-center justify-between px-5 pb-4">
                <span className="text-[10px] text-muted-foreground">{text.length}/500</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommentItem({
  comment,
  deviceId,
  currentUserId,
  getDisplayName,
  onReply,
  isReply,
}: {
  comment: Comment;
  deviceId: string;
  currentUserId?: string;
  getDisplayName: (c: Comment) => string;
  onReply: () => void;
  isReply?: boolean;
}) {
  const name = getDisplayName(comment);
  const isMe = comment.user_id === currentUserId || comment.device_id === deviceId;
  const profileLink = comment.user_id && !isMe ? `/u/${comment.user_id}` : null;

  return (
    <div className="flex gap-2">
      {profileLink ? (
        <Link to={profileLink} className="shrink-0 mt-0.5">
          <Avatar className="w-6 h-6">
            <AvatarImage src={comment.profile?.avatar_url || undefined} />
            <AvatarFallback className="text-[9px] bg-gold/10 text-gold font-bold">
              {name[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[9px] font-bold text-gold">{name[0]?.toUpperCase() || "?"}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {profileLink ? (
            <Link to={profileLink} className="text-xs font-semibold text-foreground hover:underline">
              {name}
            </Link>
          ) : (
            <span className="text-xs font-semibold text-foreground">{name}</span>
          )}
          <span className="text-[10px] text-muted-foreground">{timeAgoShort(comment.created_at)}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed break-words">{comment.content}</p>
        {!isReply && (
          <button onClick={onReply} className="text-[10px] text-muted-foreground hover:text-foreground mt-0.5 flex items-center gap-1">
            <Reply className="w-3 h-3" />
            Répondre
          </button>
        )}
      </div>
    </div>
  );
}

/* Hook to fetch comment counts for multiple vibes */
export function useCommentCounts(vibeIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (vibeIds.length === 0) return;
    const fetchCounts = async () => {
      const { data } = await supabase
        .from("vibe_comments")
        .select("vibe_id");
      if (data) {
        const map: Record<string, number> = {};
        (data as { vibe_id: string }[]).forEach((r) => {
          map[r.vibe_id] = (map[r.vibe_id] || 0) + 1;
        });
        setCounts(map);
      }
    };
    fetchCounts();
  }, [vibeIds.join(",")]);

  return counts;
}
