import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Eye, Heart, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId: string;
  placeId: string | null;
  planType: string | null;
  credits: number;
}

function StatCard({ icon: Icon, label, value, delay = 0 }: { icon: any; label: string; value: string | number; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-4 space-y-1"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4 text-gold" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-display font-black text-foreground">{value}</p>
    </motion.div>
  );
}

export default function PartnerOverview({ userId, placeId, planType, credits }: Props) {
  const [stats, setStats] = useState({ vibeCount: 0, totalLikes: 0, mapClicks: 0, bookings: 0 });

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data: vibes } = await supabase
        .from("vibes")
        .select("id, likes")
        .eq("user_id", userId)
        .eq("is_official", true);

      const vibeCount = vibes?.length ?? 0;
      const totalLikes = vibes?.reduce((s, v) => s + (v.likes || 0), 0) ?? 0;

      let mapClicks = 0;
      if (placeId) {
        const { count } = await supabase
          .from("venue_analytics")
          .select("id", { count: "exact", head: true })
          .eq("place_id", placeId)
          .eq("event_type", "map_click");
        mapClicks = count ?? 0;
      }

      let bookings = 0;
      if (placeId) {
        const { data: place } = await supabase.from("places").select("name").eq("id", placeId).single();
        if (place) {
          const { count } = await supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("place_name", place.name);
          bookings = count ?? 0;
        }
      }

      setStats({ vibeCount, totalLikes, mapClicks, bookings });
    };
    load();
  }, [userId, placeId]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gold/20 bg-card/80 backdrop-blur-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Plan actif</p>
            <p className="text-lg font-display font-bold text-gold capitalize">{planType || "Aucun"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Crédits</p>
            <p className="text-lg font-display font-bold text-foreground">{credits}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Eye} label="Vibes publiées" value={stats.vibeCount} delay={0} />
        <StatCard icon={Heart} label="Total likes" value={stats.totalLikes} delay={0.05} />
        <StatCard icon={MapPin} label="Clics carte" value={stats.mapClicks} delay={0.1} />
        <StatCard icon={Calendar} label="Réservations" value={stats.bookings} delay={0.15} />
      </div>
    </div>
  );
}
