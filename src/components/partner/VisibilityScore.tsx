import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  placeId: string | null;
}

export default function VisibilityScore({ placeId }: Props) {
  const [score, setScore] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [neighborhood, setNeighborhood] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState({ checkins: 0, vibes: 0, redemptions: 0, qrScans: 0 });

  useEffect(() => {
    if (!placeId) return;
    const load = async () => {
      // Fetch place info
      const { data: place } = await supabase
        .from("places")
        .select("neighborhood, latitude, longitude")
        .eq("id", placeId)
        .single();

      if (place?.neighborhood) setNeighborhood(place.neighborhood);

      // Fetch weekly metrics
      const [checkinsRes, vibeViewsRes, redemptionsRes, qrRes] = await Promise.all([
        supabase.rpc("weekly_checkins", { p_place_id: placeId }),
        supabase.rpc("weekly_vibe_views", { p_place_id: placeId }),
        supabase.rpc("weekly_qr_redemptions", { p_place_id: placeId }),
        supabase.from("qr_scans").select("id", { count: "exact", head: true }).eq("place_id", placeId),
      ]);

      const checkins = Number(checkinsRes.data) || 0;
      const vibes = Number(vibeViewsRes.data) || 0;
      const redemptions = Number(redemptionsRes.data) || 0;
      const qrScans = qrRes.count ?? 0;

      setBreakdown({ checkins, vibes, redemptions, qrScans });

      // Calculate score (0-100)
      // Weighted: checkins (30%), vibe engagement (30%), redemptions (25%), QR scans (15%)
      const checkinScore = Math.min(checkins / 50, 1) * 30;
      const vibeScore = Math.min(vibes / 100, 1) * 30;
      const redemptionScore = Math.min(redemptions / 20, 1) * 25;
      const qrScore = Math.min(qrScans / 30, 1) * 15;
      const total = Math.round(checkinScore + vibeScore + redemptionScore + qrScore);
      setScore(total);

      // Calculate rank among nearby places
      if (place?.latitude && place?.longitude) {
        const { data: allPlaces } = await supabase.from("places").select("id, latitude, longitude");
        if (allPlaces) {
          const radiusKm = 3;
          const nearby = allPlaces.filter(p => {
            const d = getDistanceKm(place.latitude, place.longitude, p.latitude, p.longitude);
            return d < radiusKm;
          });

          // Get scores for all nearby places
          const scores = await Promise.all(
            nearby.map(async (p) => {
              const [c, v, r] = await Promise.all([
                supabase.rpc("weekly_checkins", { p_place_id: p.id }),
                supabase.rpc("weekly_vibe_views", { p_place_id: p.id }),
                supabase.rpc("weekly_qr_redemptions", { p_place_id: p.id }),
              ]);
              const cs = Math.min((Number(c.data) || 0) / 50, 1) * 30;
              const vs = Math.min((Number(v.data) || 0) / 100, 1) * 30;
              const rs = Math.min((Number(r.data) || 0) / 20, 1) * 25;
              return { id: p.id, score: Math.round(cs + vs + rs) };
            })
          );

          scores.sort((a, b) => b.score - a.score);
          const myRank = scores.findIndex(s => s.id === placeId) + 1;
          setRank(myRank);
        }
      }
    };
    load();
  }, [placeId]);

  if (!placeId) return null;

  const getScoreColor = () => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-gold";
    return "text-orange-400";
  };

  const getScoreLabel = () => {
    if (score >= 70) return "Excellent";
    if (score >= 40) return "Bon";
    return "À booster";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold/20 bg-gradient-to-br from-card/90 via-card/80 to-gold/5 backdrop-blur-xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-gold" />
          <h3 className="font-display text-sm font-bold text-foreground">Visibility Score</h3>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${getScoreColor()}`}>
          {getScoreLabel()}
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Score circle */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="3"
            />
            <motion.path
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--gold))"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: `${score}, 100` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={`text-xl font-display font-black ${getScoreColor()}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {score}
            </motion.span>
          </div>
        </div>

        {/* Rank + breakdown */}
        <div className="flex-1 space-y-2">
          {rank && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs text-foreground font-semibold">
                #{rank} {neighborhood ? `à ${neighborhood}` : "dans ta zone"}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              { label: "Check-ins", value: breakdown.checkins },
              { label: "Vibe views", value: breakdown.vibes },
              { label: "Rédemptions", value: breakdown.redemptions },
              { label: "QR scans", value: breakdown.qrScans },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{label}</span>
                <span className="text-[10px] font-bold text-foreground tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
