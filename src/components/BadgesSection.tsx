import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Compass, Flame, Crown, Lock, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Badge {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  emoji: string;
  threshold: number;
  metric: "vibes" | "likes" | "spots";
  color: string;
  glow: string;
}

const BADGES: Badge[] = [
  // Explorer tier
  { id: "explorer-1", label: "Explorateur", desc: "Postez votre 1ère vibe", icon: Compass, emoji: "🧭", threshold: 1, metric: "vibes", color: "border-emerald-500/40 bg-emerald-500/10", glow: "shadow-emerald-500/20" },
  { id: "explorer-5", label: "Curieux", desc: "Découvrez 5 spots", icon: Compass, emoji: "🔍", threshold: 5, metric: "spots", color: "border-emerald-500/40 bg-emerald-500/10", glow: "shadow-emerald-500/20" },
  // Insider tier
  { id: "insider-5", label: "Insider", desc: "Postez 5 vibes", icon: Flame, emoji: "🔥", threshold: 5, metric: "vibes", color: "border-gold/40 bg-gold/10", glow: "shadow-gold/20" },
  { id: "insider-10", label: "Populaire", desc: "Recevez 10 likes", icon: Flame, emoji: "❤️‍🔥", threshold: 10, metric: "likes", color: "border-gold/40 bg-gold/10", glow: "shadow-gold/20" },
  { id: "insider-15", label: "Influenceur", desc: "Découvrez 15 spots", icon: Flame, emoji: "⭐", threshold: 15, metric: "spots", color: "border-gold/40 bg-gold/10", glow: "shadow-gold/20" },
  // Legend tier
  { id: "legend-20", label: "Légende", desc: "Postez 20 vibes", icon: Crown, emoji: "👑", threshold: 20, metric: "vibes", color: "border-amber-400/50 bg-amber-400/10", glow: "shadow-amber-400/30" },
  { id: "legend-50", label: "Icône", desc: "Recevez 50 likes", icon: Crown, emoji: "💎", threshold: 50, metric: "likes", color: "border-amber-400/50 bg-amber-400/10", glow: "shadow-amber-400/30" },
  { id: "legend-30", label: "Maître Kech", desc: "Découvrez 30 spots", icon: Crown, emoji: "🏆", threshold: 30, metric: "spots", color: "border-amber-400/50 bg-amber-400/10", glow: "shadow-amber-400/30" },
];

function getTier(unlockedCount: number): { label: string; emoji: string; color: string } {
  if (unlockedCount >= 6) return { label: "Legend", emoji: "👑", color: "text-amber-400" };
  if (unlockedCount >= 3) return { label: "Insider", emoji: "🔥", color: "text-gold" };
  if (unlockedCount >= 1) return { label: "Explorer", emoji: "🧭", color: "text-emerald-400" };
  return { label: "Nouveau", emoji: "🌱", color: "text-muted-foreground" };
}

function getDeviceId(): string {
  let id = localStorage.getItem("wk_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wk_device_id", id);
  }
  return id;
}

export default function BadgesSection({ userId }: { userId: string }) {
  const [stats, setStats] = useState({ vibes: 0, likes: 0, spots: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchStats = async () => {
      const deviceId = getDeviceId();

      const [vibesRes, likesRes, likedVibeIds] = await Promise.all([
        supabase.from("vibes").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("vibes").select("likes").eq("user_id", userId),
        supabase.from("vibe_likes").select("vibe_id").eq("device_id", deviceId),
      ]);

      const totalLikes = likesRes.data?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0;

      let spotsCount = 0;
      if (likedVibeIds.data && likedVibeIds.data.length > 0) {
        const { data: likedVibes } = await supabase
          .from("vibes")
          .select("location")
          .in("id", likedVibeIds.data.map((l) => l.vibe_id))
          .not("location", "is", null);
        spotsCount = new Set(likedVibes?.map((v) => v.location).filter(Boolean)).size;
      }

      setStats({ vibes: vibesRes.count || 0, likes: totalLikes, spots: spotsCount });
      setLoading(false);
    };
    fetchStats();
  }, [userId]);

  const prevUnlockedRef = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  const unlockedBadges = BADGES.filter((b) => stats[b.metric] >= b.threshold);
  const lockedBadges = BADGES.filter((b) => stats[b.metric] < b.threshold);
  const tier = getTier(unlockedBadges.length);

  // Detect newly unlocked badges and show toast
  useEffect(() => {
    if (loading) return;

    const seenKey = `wk_badges_seen_${userId}`;
    const seenRaw = localStorage.getItem(seenKey);
    const seenSet: Set<string> = seenRaw ? new Set(JSON.parse(seenRaw)) : new Set();

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const newBadges = unlockedBadges.filter((b) => !seenSet.has(b.id));
      if (newBadges.length > 0 && seenRaw !== null) {
        newBadges.forEach((badge, i) => {
          setTimeout(() => {
            toast({ title: `${badge.emoji} Badge débloqué !`, description: `${badge.label} — ${badge.desc}` });
            try { navigator.vibrate?.([15, 30, 15]); } catch {}
          }, 800 + i * 1200);
        });

        // Tier change notification
        const prevUnlocked = seenSet.size;
        const nowUnlocked = unlockedBadges.length;
        const prevTier = getTier(prevUnlocked);
        const newTier = getTier(nowUnlocked);
        if (prevTier.label !== newTier.label) {
          setTimeout(() => {
            toast({ title: `${newTier.emoji} Nouveau rang : ${newTier.label} !`, description: "Continue comme ça, tu grimpes !" });
            try { navigator.vibrate?.([20, 50, 20, 50, 20]); } catch {}
          }, 800 + newBadges.length * 1200 + 500);
        }
      }
    }

    // Save all currently unlocked as seen
    const allUnlocked = unlockedBadges.map((b) => b.id);
    localStorage.setItem(seenKey, JSON.stringify(allUnlocked));
    prevUnlockedRef.current = new Set(allUnlocked);
  }, [loading, unlockedBadges, userId]);

  if (loading) return null;

  const nextBadge = lockedBadges[0];
  const nextProgress = nextBadge
    ? Math.min(100, Math.round((stats[nextBadge.metric] / nextBadge.threshold) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-4"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-gold" />
        <h3 className="font-display text-sm font-semibold text-foreground">Mes Badges</h3>
        <div className="flex-1 h-px bg-border" />
        <span className={`text-xs font-bold ${tier.color}`}>
          {tier.emoji} {tier.label}
        </span>
      </div>

      {/* Badges grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {BADGES.map((badge, i) => {
          const unlocked = stats[badge.metric] >= badge.threshold;
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                unlocked
                  ? `${badge.color} shadow-lg ${badge.glow}`
                  : "border-border bg-secondary/30 opacity-50"
              }`}
            >
              {!unlocked && (
                <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-muted-foreground" />
              )}
              <span className={`text-lg ${unlocked ? "" : "grayscale"}`}>{badge.emoji}</span>
              <span className={`text-2xs font-semibold text-center leading-tight ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                {badge.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Next badge progress */}
      {nextBadge && (
        <div className="bg-secondary/50 border border-border rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-2xs font-semibold text-foreground flex items-center gap-1">
              <span>{nextBadge.emoji}</span> Prochain : {nextBadge.label}
            </span>
            <span className="text-2xs text-muted-foreground">
              {stats[nextBadge.metric]}/{nextBadge.threshold}
            </span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${nextProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-2xs text-muted-foreground mt-1">{nextBadge.desc}</p>
        </div>
      )}

      {/* All unlocked celebration */}
      {lockedBadges.length === 0 && (
        <div className="bg-gold/10 border border-gold/30 rounded-xl p-3 text-center">
          <span className="text-sm">🏆✨</span>
          <p className="text-xs font-semibold text-gold mt-1">Tous les badges débloqués !</p>
          <p className="text-2xs text-muted-foreground">Tu es une vraie Légende de Kech</p>
        </div>
      )}

      <div className="h-px bg-border mt-4" />
    </motion.div>
  );
}
