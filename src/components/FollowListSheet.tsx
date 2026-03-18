import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FollowButton from "@/components/FollowButton";

interface FollowUser {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface FollowListSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  mode: "followers" | "following";
}

export default function FollowListSheet({ open, onClose, userId, mode }: FollowListSheetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      // Get follow relationships
      const column = mode === "followers" ? "following_id" : "follower_id";
      const selectColumn = mode === "followers" ? "follower_id" : "following_id";

      const { data: followRows } = await supabase
        .from("follows")
        .select(selectColumn)
        .eq(column, userId)
        .limit(200);

      if (!followRows || followRows.length === 0) {
        setUsers([]);
        return;
      }

      const ids = followRows.map((r: any) => r[selectColumn] as string);

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", ids);

      if (profiles) {
        setUsers(profiles as unknown as FollowUser[]);
      }
    } catch (err) {
      console.error("fetch follow list error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, mode]);

  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  const handleNavigate = (uid: string) => {
    onClose();
    navigate(`/u/${uid}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-background/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-background rounded-t-2xl border-t border-border/60 max-h-[70dvh] flex flex-col"
          >
            {/* Handle + header */}
            <div className="flex flex-col items-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mb-2" />
              <div className="w-full flex items-center justify-between px-4 pb-2 border-b border-border/40">
                <h2 className="text-base font-bold text-foreground">
                  {mode === "followers" ? "Followers" : "Suivi(e)s"}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-card active:scale-90 transition-all"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {mode === "followers" ? "Aucun follower pour le moment" : "Ne suit personne pour le moment"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {users.map((u) => {
                    const displayName = u.full_name || u.username || "Utilisateur";
                    const initial = displayName.charAt(0).toUpperCase();
                    const isMe = user?.id === u.user_id;

                    return (
                      <div
                        key={u.user_id}
                        className="flex items-center gap-3 py-2.5 rounded-xl hover:bg-card/50 px-2 transition-colors"
                      >
                        <button
                          onClick={() => handleNavigate(u.user_id)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <Avatar className="w-11 h-11 border border-border/60">
                            <AvatarImage src={u.avatar_url || undefined} alt={displayName} />
                            <AvatarFallback className="bg-card text-foreground text-sm font-semibold">
                              {initial}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {u.username || displayName.toLowerCase().replace(/\s+/g, "")}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{displayName}</p>
                          </div>
                        </button>

                        {!isMe && (
                          <div className="w-24 flex-shrink-0">
                            <FollowButton
                              targetUserId={u.user_id}
                              size="sm"
                              variant="pill"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
