import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Flame, Heart, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface HallEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_vip: boolean;
  vibes_count: number;
  total_likes: number;
  score: number;
}

type Period = "week" | "month" | "alltime";

const PERIOD_LABELS: Record<Period, string> = {
  week: "Cette semaine",
  month: "Ce mois",
  alltime: "All-time",
};

const PERIOD_SINCE: Record<Period, number> = {
  week: 7 * 24 * 3600000,
  month: 30 * 24 * 3600000,
  alltime: 365 * 10 * 24 * 3600000,
};

const PODIUM_STYLES = [
  { ring: "ring-gold/60", bg: "bg-gold/15", badge: "🥇", size: "w-14 h-14" },
  { ring: "ring-border", bg: "bg-muted/40", badge: "🥈", size: "w-11 h-11" },
  { ring: "ring-border", bg: "bg-muted/30", badge: "🥉", size: "w-11 h-11" },
];

export default function HallOfFame({ currentUserId }: { currentUserId?: string }) {
  const [entries, setEntries] = useState<HallEntry[]>([]);
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      const since = new Date(Date.now() - PERIOD_SINCE[period]).toISOString();

      const { data: vibes } = await supabase
        .from("vibes")
        .select("user_id, likes, super_vibes")
        .eq("is_official", false)
        .not("user_id", "is", null)
        .gte("created_at", since)
        .order("likes", { ascending: false })
        .limit(500);

      if (!vibes || vibes.length === 0) { setEntries([]); setLoading(false); return; }

      const stats: Record<string, { count: number; likes: number; supers: number }> = {};
      vibes.forEach(v => {
        if (!v.user_id) return;
        if (!stats[v.user_id]) stats[v.user_id] = { count: 0, likes: 0, supers: 0 };
        stats[v.user_id].count++;
        stats[v.user_id].likes += v.likes || 0;
        stats[v.user_id].supers += v.super_vibes || 0;
      });

      const ranked = Object.entries(stats)
        .map(([uid, s]) => ({
          user_id: uid,
          vibes_count: s.count,
          total_likes: s.likes,
          score: s.likes + s.supers * 3 + s.count * 2,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      const ids = ranked.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("user_id, full_name, avatar_url, is_vip")
        .in("user_id", ids);

      const pMap: Record<string, any> = {};
      profiles?.forEach(p => { if (p.user_id) pMap[p.user_id] = p; });

      setEntries(ranked.map(r => ({
        ...r,
        full_name: pMap[r.user_id]?.full_name || null,
        avatar_url: pMap[r.user_id]?.avatar_url || null,
        is_vip: pMap[r.user_id]?.is_vip || false,
      })));
      setLoading(false);
    };
    fetch();
  }, [period]);

  if (loading && entries.length === 0) return null;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold" />
          <h2 className="font-display text-lg font-bold text-foreground">Hall of Fame</h2>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 px-5">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
              period === p
                ? "bg-gold text-primary-foreground shadow-sm shadow-gold/20"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">Pas encore de données pour cette période</p>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 3 && (
            <div className="flex items-end justify-center gap-3 px-5 pt-2 pb-4">
              {/* 2nd */}
              <PodiumSlot entry={top3[1]} rank={1} currentUserId={currentUserId} />
              {/* 1st - taller */}
              <PodiumSlot entry={top3[0]} rank={0} currentUserId={currentUserId} isFirst />
              {/* 3rd */}
              <PodiumSlot entry={top3[2]} rank={2} currentUserId={currentUserId} />
            </div>
          )}

          {/* Rest of list */}
          <div className="px-5 space-y-2">
            {rest.map((entry, i) => {
              const isMe = entry.user_id === currentUserId;
              return (
                <Link key={entry.user_id} to={`/u/${entry.user_id}`}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    isMe ? "bg-gold/10 border-gold/30 ring-1 ring-gold/20" : "bg-card/80 border-border"
                  }`}>
                  <span className="text-xs font-bold text-muted-foreground w-6 text-center">{i + 4}</span>
                  <Avatar className="w-8 h-8 border border-border">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="bg-gold/10 text-gold text-xs">{(entry.full_name || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-semibold truncate ${isMe ? "text-gold" : "text-foreground"}`}>
                        {isMe ? `${entry.full_name || "Toi"} (toi)` : entry.full_name || "Anonyme"}
                      </span>
                      {entry.is_vip && <Crown className="w-3 h-3 text-gold" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{entry.vibes_count} vibes · {entry.total_likes} ❤️</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gold/10 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3 text-gold" />
                    <span className="text-[10px] font-bold text-gold">{entry.score}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}

function PodiumSlot({ entry, rank, currentUserId, isFirst }: { entry: HallEntry; rank: number; currentUserId?: string; isFirst?: boolean }) {
  const style = PODIUM_STYLES[rank];
  const isMe = entry.user_id === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`flex flex-col items-center gap-1.5 ${isFirst ? "mb-4" : ""}`}
    >
      <div className="relative">
        <Avatar className={`${style.size} ring-2 ${style.ring} ${isMe ? "ring-gold" : ""}`}>
          <AvatarImage src={entry.avatar_url || undefined} />
          <AvatarFallback className={`${style.bg} text-gold font-bold ${isFirst ? "text-lg" : "text-sm"}`}>
            {(entry.full_name || "?")[0]}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 text-sm">{style.badge}</span>
      </div>
      <span className={`text-[11px] font-semibold text-center truncate max-w-[80px] ${isMe ? "text-gold" : "text-foreground"}`}>
        {entry.full_name || "Anonyme"}
      </span>
      <div className={`flex items-center gap-1 ${style.bg} px-2 py-0.5 rounded-full`}>
        <Flame className="w-2.5 h-2.5 text-gold" />
        <span className="text-[9px] font-bold text-gold">{entry.score}</span>
      </div>
    </motion.div>
  );
}
