import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Comment {
  id: string;
  device_id: string;
  content: string;
  created_at: string;
}

interface VibeCommentsProps {
  vibeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDeviceId(): string {
  let id = localStorage.getItem("wk_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wk_device_id", id);
  }
  return id;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  return `${hours}h`;
}

export default function VibeComments({ vibeId, open, onOpenChange }: VibeCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const deviceId = getDeviceId();

  useEffect(() => {
    if (!open) return;
    const fetchComments = async () => {
      const { data } = await supabase
        .from("vibe_comments")
        .select("*")
        .eq("vibe_id", vibeId)
        .order("created_at", { ascending: true });
      if (data) setComments(data as Comment[]);
    };
    fetchComments();

    const channel = supabase
      .channel(`comments-${vibeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vibe_comments", filter: `vibe_id=eq.${vibeId}` },
        (payload) => {
          setComments((prev) => [...prev, payload.new as Comment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    await supabase.from("vibe_comments").insert({
      vibe_id: vibeId,
      device_id: deviceId,
      content: trimmed.slice(0, 200),
    });
    setText("");
    setSending(false);
  };

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
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
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

              {/* Comments list */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 space-y-3 min-h-0 pb-2">
                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Aucun commentaire. Soyez le premier !
                  </p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-gold">
                          {c.device_id.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {c.device_id === deviceId ? "Vous" : `User ${c.device_id.slice(0, 4)}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed break-words">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border px-4 py-3 flex gap-2 items-end">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 200))}
                  placeholder="Votre commentaire…"
                  maxLength={200}
                  className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-gold hover:bg-gold-light disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
                >
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
              <div className="flex items-center justify-between px-5 pb-4">
                <span className="text-[10px] text-muted-foreground">{text.length}/200</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
