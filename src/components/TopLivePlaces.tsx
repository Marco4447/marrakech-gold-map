import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { isBoosted } from "@/lib/boostedPlaces";

interface HotPlace {
  name: string;
  vibeCount: number;
  lastImage: string;
}

export default function TopLivePlaces({ onPlaceClick }: { onPlaceClick?: (name: string) => void }) {
  const [hotPlaces, setHotPlaces] = useState<HotPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse after 6 seconds to free map space
  useEffect(() => {
    const timer = setTimeout(() => setCollapsed(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const fetchHotPlaces = async () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("vibes")
      .select("location, image_url, created_at")
      .gte("created_at", threeHoursAgo)
      .not("location", "is", null);

    if (!data || data.length === 0) {
      setHotPlaces([]);
      setLoading(false);
      return;
    }

    // Group by location, count vibes, get latest image
    const map = new Map<string, { count: number; lastImage: string; lastDate: string }>();
    for (const v of data) {
      if (!v.location) continue;
      const existing = map.get(v.location);
      if (!existing) {
        map.set(v.location, { count: 1, lastImage: v.image_url, lastDate: v.created_at });
      } else {
        existing.count++;
        if (v.created_at > existing.lastDate) {
          existing.lastImage = v.image_url;
          existing.lastDate = v.created_at;
        }
      }
    }

    const sorted = Array.from(map.entries())
      .sort((a, b) => {
        const aB = isBoosted(a[0]);
        const bB = isBoosted(b[0]);
        if (aB && !bB) return -1;
        if (!aB && bB) return 1;
        return b[1].count - a[1].count;
      })
      .slice(0, 3)
      .map(([name, info]) => ({
        name,
        vibeCount: info.count,
        lastImage: info.lastImage,
      }));

    setHotPlaces(sorted);
    setLoading(false);
  };

  useEffect(() => {
    fetchHotPlaces();

    // Realtime refresh
    const channel = supabase
      .channel("top-live-places")
      .on("postgres_changes", { event: "*", schema: "public", table: "vibes" }, () => {
        fetchHotPlaces();
      })
      .subscribe();

    // Refresh every 60s
    const interval = setInterval(fetchHotPlaces, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  if (loading || hotPlaces.length === 0) return null;

  return (
    <div className="w-full">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-1.5 mb-1.5 px-0.5 w-full"
      >
        <span className="text-xs font-display font-bold text-foreground">En ce moment</span>
        <span className="text-xs">🔥</span>
        <div className="flex-1 h-px bg-border" />
        <motion.span
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground text-[10px]"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="top-live-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              <AnimatePresence mode="popLayout">
                {hotPlaces.map((place, i) => (
                  <motion.button
                    key={place.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.08, duration: 0.25 }}
                    onClick={() => onPlaceClick?.(place.name)}
                    className="relative flex-shrink-0 w-[120px] rounded-xl overflow-hidden border border-gold/20 bg-card shadow-md active:scale-[0.97] transition-transform"
                  >
                    <div className="relative h-14 w-full overflow-hidden">
                      <img src={place.lastImage} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-destructive/90 backdrop-blur-sm rounded-full px-1.5 py-px">
                        <span className="relative flex h-1 w-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-75" />
                          <span className="relative inline-flex rounded-full h-1 w-1 bg-destructive-foreground" />
                        </span>
                        <span className="text-[7px] font-bold text-destructive-foreground uppercase tracking-wider">Live</span>
                      </div>
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] font-display font-bold text-foreground truncate leading-tight">{place.name}</p>
                      <p className="text-[8px] text-muted-foreground mt-0.5">{place.vibeCount} vibe{place.vibeCount > 1 ? "s" : ""}</p>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
