import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Clock, Crown, Flame, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  theme_tag: string | null;
  start_date: string;
  end_date: string;
  status: string;
  winner_user_id: string | null;
}

interface ChallengeLeader {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  score: number;
  vibe_count: number;
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Terminé"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}j ${h}h` : `${h}h ${m}min`);
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [endDate]);

  return timeLeft;
}

export default function WeeklyChallenge() {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaders, setLeaders] = useState<ChallengeLeader[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenge();
  }, []);

  async function fetchChallenge() {
    try {
      // Get active challenge
      const { data: ch } = await supabase
        .from("weekly_challenges" as any)
        .select("*")
        .eq("status", "active")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!ch) { setLoading(false); return; }
      setChallenge(ch as any);

      // Get leaderboard: vibes posted during challenge period, ranked by likes
      const { data: vibes } = await supabase
        .from("vibes")
        .select("user_id, likes, super_vibes")
        .gte("created_at", (ch as any).start_date)
        .lte("created_at", (ch as any).end_date)
        .not("user_id", "is", null);

      if (vibes && vibes.length > 0) {
        // Aggregate per user
        const userScores: Record<string, { score: number; count: number }> = {};
        for (const v of vibes) {
          if (!v.user_id) continue;
          if (!userScores[v.user_id]) userScores[v.user_id] = { score: 0, count: 0 };
          userScores[v.user_id].score += (v.likes || 0) + (v.super_vibes || 0) * 3;
          userScores[v.user_id].count += 1;
        }

        const sorted = Object.entries(userScores)
          .sort((a, b) => b[1].score - a[1].score)
          .slice(0, 5);

        // Fetch profiles
        const userIds = sorted.map(([uid]) => uid);
        const { data: profiles } = await supabase
          .from("profiles_public")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.user_id, p])
        );

        setLeaders(
          sorted.map(([uid, s]) => ({
            user_id: uid,
            full_name: profileMap.get(uid)?.full_name || "Anonyme",
            avatar_url: profileMap.get(uid)?.avatar_url || null,
            score: s.score,
            vibe_count: s.count,
          }))
        );
      }
    } catch (e) {
      console.error("Challenge fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  const timeLeft = useCountdown(challenge?.end_date || new Date().toISOString());

  if (loading || !challenge) return null;

  const userRank = user
    ? leaders.findIndex((l) => l.user_id === user.id) + 1
    : 0;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-3 mb-4 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--background)) 100%)",
        border: "1px solid hsl(var(--primary) / 0.3)",
      }}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <span className="text-2xl">{challenge.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {challenge.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-semibold">{timeLeft}</span>
            {userRank > 0 && (
              <span className="text-xs text-muted-foreground">
                · Tu es {userRank === 1 ? "1er 🔥" : `${userRank}ème`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-primary">
          <Crown className="w-4 h-4" />
          <span className="text-xs font-bold">VIP</span>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {challenge.description && (
                <p className="text-xs text-muted-foreground mb-3">
                  {challenge.description}
                </p>
              )}

              {/* Prize */}
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-primary/10">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  🏆 Le gagnant remporte 7 jours VIP gratuits !
                </span>
              </div>

              {/* Leaderboard */}
              {leaders.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Classement
                  </p>
                  {leaders.map((leader, i) => (
                    <div
                      key={leader.user_id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                        leader.user_id === user?.id
                          ? "bg-primary/15 ring-1 ring-primary/30"
                          : "bg-muted/30"
                      }`}
                    >
                      <span className="text-sm w-6 text-center">
                        {medals[i] || `${i + 1}.`}
                      </span>
                      {leader.avatar_url ? (
                        <img
                          src={leader.avatar_url}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                          {(leader.full_name || "?")[0]}
                        </div>
                      )}
                      <span className="flex-1 text-xs font-medium text-foreground truncate">
                        {leader.full_name}
                        {leader.user_id === user?.id && " (toi)"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-primary" />
                        <span className="text-xs font-bold text-primary">
                          {leader.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Publie des vibes pour participer ! 📸
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
