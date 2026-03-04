import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Flame, Compass, Heart, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_vip: boolean;
  vibes_count: number;
  total_likes: number;
  score: number;
}

function getTier(vibeCount: number): { emoji: string; label: string; color: string } {
  if (vibeCount >= 20) return { emoji: "👑", label: "Legend", color: "text-amber-400" };
  if (vibeCount >= 5) return { emoji: "🔥", label: "Insider", color: "text-gold" };
  if (vibeCount >= 1) return { emoji: "🧭", label: "Explorer", color: "text-emerald-400" };
  return { emoji: "🌱", label: "Nouveau", color: "text-muted-foreground" };
}

const RANK_STYLES = [
  "bg-gold/15 border-gold/40 shadow-lg shadow-gold/10",
  "bg-secondary/60 border-border",
  "bg-secondary/40 border-border",
];

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function CommunityLeaderboard({ currentUserId }: { currentUserId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Fetch all vibes with user_id (non-official only)
      const { data: vibes } = await supabase
        .from("vibes")
        .select("user_id, likes, super_vibes")
        .eq("is_official", false)
        .not("user_id", "is", null);

      if (!vibes || vibes.length === 0) {
        setLoading(false);
        return;
      }

      // Aggregate per user
      const userStats: Record<string, { vibes_count: number; total_likes: number; total_super: number }> = {};
      vibes.forEach((v) => {
        if (!v.user_id) return;
        if (!userStats[v.user_id]) {
          userStats[v.user_id] = { vibes_count: 0, total_likes: 0, total_super: 0 };
        }
        userStats[v.user_id].vibes_count += 1;
        userStats[v.user_id].total_likes += v.likes || 0;
        userStats[v.user_id].total_super += v.super_vibes || 0;
      });

      // Score = likes + super_vibes * 3 + vibes_count * 2
      const ranked = Object.entries(userStats)
        .map(([uid, s]) => ({
          user_id: uid,
          vibes_count: s.vibes_count,
          total_likes: s.total_likes,
          score: s.total_likes + s.total_super * 3 + s.vibes_count * 2,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // Fetch profiles
      const userIds = ranked.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("user_id, full_name, avatar_url, is_vip")
        .in("user_id", userIds);

      const profileMap: Record<string, any> = {};
      if (profiles) profiles.forEach((p: any) => { profileMap[p.user_id] = p; });

      const final: LeaderboardEntry[] = ranked.map((r) => ({
        ...r,
        full_name: profileMap[r.user_id]?.full_name || null,
        avatar_url: profileMap[r.user_id]?.avatar_url || null,
        is_vip: profileMap[r.user_id]?.is_vip || false,
      }));

      setEntries(final);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  if (loading) return null;
  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-gold" />
        <h3 className="font-display text-sm font-semibold text-foreground">Top Insiders</h3>
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground">Top 10</span>
      </div>

      <div className="space-y-2">
        {entries.map((entry, i) => {
          const tier = getTier(entry.vibes_count);
          const isMe = entry.user_id === currentUserId;
          const displayName = entry.full_name || "Anonyme";
          const initial = displayName.charAt(0).toUpperCase();

          return (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                i < 3 ? RANK_STYLES[i] : "bg-secondary/20 border-border"
              } ${isMe ? "ring-1 ring-gold/40" : ""}`}
            >
              {/* Rank */}
              <div className="w-7 text-center shrink-0">
                {i < 3 ? (
                  <span className="text-base">{RANK_MEDALS[i]}</span>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="w-8 h-8 shrink-0 border border-border">
                <AvatarImage src={entry.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-gold/10 text-gold text-xs font-bold">
                  {initial}
                </AvatarFallback>
              </Avatar>

              {/* Name + tier */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold truncate ${isMe ? "text-gold" : "text-foreground"}`}>
                    {isMe ? `${displayName} (toi)` : displayName}
                  </span>
                  {entry.is_vip && <Crown className="w-3 h-3 text-gold shrink-0" />}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px]">{tier.emoji}</span>
                  <span className={`text-[9px] font-semibold ${tier.color}`}>{tier.label}</span>
                  <span className="text-[9px] text-muted-foreground">· {entry.vibes_count} vibes</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-0.5">
                  <Heart className="w-3 h-3 text-gold/70" />
                  <span className="text-[10px] font-bold text-foreground">{entry.total_likes}</span>
                </div>
                <div className="flex items-center gap-0.5 bg-gold/10 px-1.5 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5 text-gold" />
                  <span className="text-[10px] font-bold text-gold">{entry.score}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="h-px bg-border mt-4" />
    </motion.div>
  );
}
