import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface HotSpot {
  name: string;
  vibeCount: number;
}

export default function MarrakechTonightWidget() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState({ spots: 0, vibes: 0, rooftops: 0 });
  const [hotSpots, setHotSpots] = useState<HotSpot[]>([]);

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 6 && h < 17) return;
    setVisible(true);

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const fetchStats = async () => {
      try {
        const { data: recentVibes } = await supabase
          .from("vibes")
          .select("location")
          .gte("created_at", twoHoursAgo);

        if (!recentVibes) return;

        const locationCounts: Record<string, number> = {};
        recentVibes.forEach(v => {
          if (v.location) {
            const key = v.location.trim();
            locationCounts[key] = (locationCounts[key] || 0) + 1;
          }
        });

        const uniqueSpots = Object.keys(locationCounts).length;
        const rooftopCount = Object.keys(locationCounts).filter(
          n => n.toLowerCase().includes("rooftop") || n.toLowerCase().includes("terrasse")
        ).length;

        setStats({ spots: uniqueSpots, vibes: recentVibes.length, rooftops: rooftopCount });

        const sorted = Object.entries(locationCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, vibeCount]) => ({ name, vibeCount }));
        setHotSpots(sorted);
      } catch {
        // silent fail
      }
    };
    fetchStats();
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-3"
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">🌙</span>
          <p className="text-xs font-bold text-foreground">Ce soir à Marrakech</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>🔥 {stats.spots} spot{stats.spots !== 1 ? "s" : ""} actif{stats.spots !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>📸 {stats.vibes} vibe{stats.vibes !== 1 ? "s" : ""}</span>
          {stats.rooftops > 0 && (
            <>
              <span>·</span>
              <span>🌅 {stats.rooftops} rooftop{stats.rooftops !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && hotSpots.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1">
              {hotSpots.map((spot, i) => (
                <div key={spot.name} className="flex items-center gap-2 bg-card/50 border border-border/50 rounded-lg px-3 py-2">
                  <span className="text-xs">{i === 0 ? "🔥" : i === 1 ? "⚡" : "✨"}</span>
                  <p className="text-xs font-semibold text-foreground flex-1 truncate">{spot.name}</p>
                  <span className="text-[10px] text-muted-foreground">{spot.vibeCount} vibes</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
