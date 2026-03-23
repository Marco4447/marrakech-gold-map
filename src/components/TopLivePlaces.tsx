import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { isBoosted } from "@/lib/boostedPlaces";
import { Flame } from "lucide-react";

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

    const map = new Map<string, { count: number; lastImage: string; lastDate: string }>();
    
    // Always include Mazel as a featured place
    map.set("Mazel", { 
      count: 0, 
      lastImage: "/images/mazel-1.jpg", 
      lastDate: new Date().toISOString() 
    });
    
    if (data && data.length > 0) {
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
    }

    const sorted = Array.from(map.entries())
      .sort((a, b) => {
        const aB = isBoosted(a[0]);
        const bB = isBoosted(b[0]);
        if (aB && !bB) return -1;
        if (!aB && bB) return 1;
        return b[1].count - a[1].count;
      })
      .slice(0, 4)
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

    const channel = supabase
      .channel("top-live-places")
      .on("postgres_changes", { event: "*", schema: "public", table: "vibes" }, () => {
        fetchHotPlaces();
      })
      .subscribe();

    const interval = setInterval(fetchHotPlaces, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  if (loading || hotPlaces.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
      {hotPlaces.map((place, i) => (
        <motion.button
          key={place.name}
          initial={{ opacity: 0, scale: 0.85, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.3, ease: "easeOut" }}
          onClick={() => onPlaceClick?.(place.name)}
          className="relative flex-shrink-0 flex items-center gap-2 bg-card/90 backdrop-blur-xl border border-border/60 rounded-full pl-1 pr-3 py-1 shadow-lg shadow-black/10 active:scale-95 transition-transform"
        >
          {/* Thumbnail */}
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gold/30 flex-shrink-0">
            <img src={place.lastImage} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
          </div>
          {/* Info */}
          <div className="min-w-0 text-left">
            <p className="text-xs font-semibold text-foreground truncate max-w-[80px] leading-tight">{place.name}</p>
            <div className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
              </span>
              <span className="text-2xs text-muted-foreground">{place.vibeCount} live</span>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
