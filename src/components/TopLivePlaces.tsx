import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface HotPlace {
  name: string;
  vibeCount: number;
  lastImage: string;
}

export default function TopLivePlaces({ onPlaceClick }: { onPlaceClick?: (name: string) => void }) {
  const [hotPlaces, setHotPlaces] = useState<HotPlace[]>([]);
  const [loading, setLoading] = useState(true);

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
      .sort((a, b) => b[1].count - a[1].count)
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
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-sm font-display font-bold text-[hsl(30,20%,90%)]">En ce moment à Kech</span>
        <span className="text-sm">🔥</span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        <AnimatePresence mode="popLayout">
          {hotPlaces.map((place, i) => (
            <motion.button
              key={place.name}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.1, duration: 0.35 }}
              onClick={() => onPlaceClick?.(place.name)}
              className="relative flex-shrink-0 w-[140px] rounded-2xl overflow-hidden border border-gold/25 bg-[hsl(0,0%,8%)] shadow-[0_4px_20px_-4px_hsl(43,76%,52%,0.15)] active:scale-[0.97] transition-transform"
            >
              {/* Thumbnail */}
              <div className="relative h-[72px] w-full overflow-hidden">
                <img
                  src={place.lastImage}
                  alt={place.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,5%)] via-transparent to-transparent" />

                {/* LIVE badge */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-[hsl(0,70%,45%,0.9)] backdrop-blur-sm rounded-full px-2 py-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(30,20%,95%)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(30,20%,95%)]" />
                  </span>
                  <span className="text-[8px] font-bold text-[hsl(30,20%,95%)] uppercase tracking-wider">Live</span>
                </div>

                {/* Rank badge */}
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gold/90 flex items-center justify-center">
                  <span className="text-[9px] font-black text-primary-foreground">{i + 1}</span>
                </div>
              </div>

              {/* Info */}
              <div className="px-2.5 py-2">
                <p className="text-[11px] font-display font-bold text-gold truncate leading-tight">
                  {place.name}
                </p>
                <p className="text-[9px] text-[hsl(30,10%,60%)] mt-0.5 font-medium">
                  {place.vibeCount} vibe{place.vibeCount > 1 ? "s" : ""} en direct
                </p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
