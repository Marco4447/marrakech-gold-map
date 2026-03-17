import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  placeName: string;
  placeId: string;
}

interface EnergyData {
  score: number;
  label: string;
  emoji: string;
  vibeCount: number;
  checkinCount: number;
}

function computeScore(vibes: any[], checkins: number): EnergyData {
  const now = Date.now();
  const ONE_H = 3600000;
  const THREE_H = 3 * ONE_H;

  let pts = 0;
  let vibeCount = 0;

  for (const v of vibes) {
    vibeCount++;
    const age = now - new Date(v.created_at).getTime();
    const freshness = age < ONE_H ? 3 : age < THREE_H ? 1.5 : 0.5;
    pts += freshness;
    pts += (v.likes || 0) * 0.5;
    pts += (v.super_vibes || 0) * 2;
  }

  pts += checkins * 4;

  // Normalize 0-100
  const normalized = Math.min(100, Math.round(pts * 2));

  let label: string, emoji: string;
  if (normalized >= 80) { label = "ON FIRE"; emoji = "🔥"; }
  else if (normalized >= 55) { label = "PACKED"; emoji = "🔴"; }
  else if (normalized >= 30) { label = "CHILL"; emoji = "🟡"; }
  else if (normalized >= 10) { label = "CALME"; emoji = "🟢"; }
  else { label = "FERMÉ ?"; emoji = "⚫"; }

  return { score: normalized, label, emoji, vibeCount, checkinCount: checkins };
}

export default function PlaceEnergyScore({ placeName, placeId }: Props) {
  const [energy, setEnergy] = useState<EnergyData | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const sixH = new Date(Date.now() - 6 * 3600000).toISOString();
      const threeH = new Date(Date.now() - 3 * 3600000).toISOString();

      const [vibesRes, checkinsRes] = await Promise.all([
        supabase.from("vibes").select("created_at, likes, super_vibes")
          .ilike("location", placeName).gte("created_at", sixH),
        supabase.from("checkins").select("id", { count: "exact", head: true })
          .eq("place_id", placeId).gte("expires_at", new Date().toISOString()),
      ]);

      const vibes = vibesRes.data || [];
      const checkins = checkinsRes.count || 0;
      setEnergy(computeScore(vibes, checkins));
    };
    fetch();
  }, [placeName, placeId]);

  if (!energy || energy.score === 0) return null;

  const barColor = energy.score >= 80 ? "bg-orange-500" : energy.score >= 55 ? "bg-red-400" : energy.score >= 30 ? "bg-yellow-400" : "bg-emerald-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-gold" />
          <h3 className="font-display text-sm font-semibold text-foreground">Energy Score</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{energy.emoji}</span>
          <span className="text-xs font-bold text-foreground">{energy.label}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${energy.score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor}`}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-foreground/70">
          {energy.score}/100
        </span>
      </div>

      {/* Details */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span>📸 {energy.vibeCount} vibes récentes</span>
        <span>📍 {energy.checkinCount} ici maintenant</span>
      </div>
    </motion.div>
  );
}
