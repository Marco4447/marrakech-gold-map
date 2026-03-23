import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Eye, MapPin, Flame, QrCode, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  placeId: string | null;
}

async function fetchWeeklyStats(placeId: string) {
  const [viewsRes, checkinsRes, vibeViewsRes, redemptionsRes, followersRes] = await Promise.all([
    supabase.rpc("weekly_place_views", { p_place_id: placeId }),
    supabase.rpc("weekly_checkins", { p_place_id: placeId }),
    supabase.rpc("weekly_vibe_views", { p_place_id: placeId }),
    supabase.rpc("weekly_qr_redemptions", { p_place_id: placeId }),
    supabase.from("place_follows").select("id", { count: "exact", head: true }).eq("place_id", placeId),
  ]);
  return {
    views: Number(viewsRes.data) || 0,
    checkins: Number(checkinsRes.data) || 0,
    vibeViews: Number(vibeViewsRes.data) || 0,
    redemptions: Number(redemptionsRes.data) || 0,
    followers: Number(followersRes.count) || 0,
  };
}

const STATS = [
  { key: "views", icon: Eye, label: "Vues profil", emoji: "👁" },
  { key: "checkins", icon: MapPin, label: "Check-ins", emoji: "📍" },
  { key: "vibeViews", icon: Flame, label: "Vues vibes", emoji: "🔥" },
  { key: "redemptions", icon: QrCode, label: "QR utilisés", emoji: "🎟" },
  { key: "followers", icon: Users, label: "Followers", emoji: "🔔" },
] as const;

export default function PartnerStatsBanner({ placeId }: Props) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["partner-weekly-stats", placeId],
    queryFn: () => fetchWeeklyStats(placeId!),
    enabled: !!placeId,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000,
  });

  if (!placeId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 via-card/80 to-card/80 backdrop-blur-xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-gold font-semibold">
          Cette semaine sur Weshkech
        </p>
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STATS.map(({ key, label, emoji }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 bg-card/60 border border-border rounded-xl px-3 py-2.5"
          >
            <span className="text-lg">{emoji}</span>
            <div className="min-w-0">
              <p className="text-lg font-display font-black text-foreground tabular-nums">
                {isLoading ? "—" : (stats?.[key as keyof typeof stats] ?? 0).toLocaleString("fr-FR")}
              </p>
              <p className="text-2xs text-muted-foreground uppercase tracking-wide truncate">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
