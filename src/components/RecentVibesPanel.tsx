import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ChevronDown, ChevronUp } from "lucide-react";
import { timeAgoShort } from "@/lib/timeAgo";
import type { RecentVibe } from "@/types/models";
import { isBoosted } from "@/lib/boostedPlaces";

export default function RecentVibesPanel({ onVibeClick }: { onVibeClick?: (vibe: RecentVibe) => void }) {
  const [vibes, setVibes] = useState<RecentVibe[]>([]);
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  const fetchRecent = async () => {
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("vibes")
      .select("id, image_url, location, caption, mood, username, created_at, media_type, is_official, latitude, longitude")
      .or(`created_at.gte.${since},is_official.eq.true`)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      const sorted = (data as RecentVibe[]).sort((a, b) => {
        const aB = isBoosted(a.location);
        const bB = isBoosted(b.location);
        if (aB && !bB) return -1;
        if (!aB && bB) return 1;
        return 0;
      });
      setVibes(sorted);
    }
  };

  useEffect(() => {
    fetchRecent();

    const channel = supabase
      .channel("vibes-recent-panel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "vibes" }, (payload) => {
        const newVibe = payload.new as RecentVibe;
        setVibes((prev) => [newVibe, ...prev].slice(0, 20));
        setHasNew(true);
        setTimeout(() => setHasNew(false), 3000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="w-full relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1 px-2 py-1 rounded-full bg-card/80 backdrop-blur-md border border-border text-left"
      >
        <Radio className={`w-2.5 h-2.5 ${hasNew ? "text-destructive animate-pulse" : "text-gold"}`} />
        <span className="text-2xs font-semibold text-muted-foreground flex-1 truncate">
          Vibes {vibes.length > 0 && `(${vibes.length})`}
        </span>
        {hasNew && <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />}
        {open ? <ChevronUp className="w-2.5 h-2.5 text-muted-foreground" /> : <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute right-0 top-full mt-1 w-[200px] bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-lg overflow-hidden max-h-[250px] overflow-y-auto no-scrollbar z-50"
          >
            {vibes.map((vibe, i) => (
              <button
                key={vibe.id}
                onClick={() => onVibeClick?.(vibe)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-muted transition-colors ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden border border-border shrink-0">
                  <img src={vibe.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xs font-medium text-foreground truncate flex items-center gap-1">
                    {vibe.is_official && <span className="text-2xs bg-gold/20 text-gold px-1 py-px rounded font-bold uppercase tracking-wider leading-none">Officiel</span>}
                    {vibe.username || vibe.location || "Anonyme"}
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    {vibe.mood ? `${vibe.mood} · ` : ""}{timeAgoShort(vibe.created_at)}
                  </p>
                </div>
                {vibe.is_official && <span className="text-gold text-2xs">⭐</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
