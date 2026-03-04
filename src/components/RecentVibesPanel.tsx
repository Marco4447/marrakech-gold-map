import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ChevronDown, ChevronUp } from "lucide-react";

interface RecentVibe {
  id: string;
  image_url: string;
  location: string | null;
  caption: string | null;
  mood: string | null;
  username: string | null;
  created_at: string;
  media_type: string;
  is_official: boolean;
  latitude: number | null;
  longitude: number | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "à l'instant";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}j`;
}

export default function RecentVibesPanel({ onVibeClick }: { onVibeClick?: (vibe: RecentVibe) => void }) {
  const [vibes, setVibes] = useState<RecentVibe[]>([]);
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  const fetchRecent = async () => {
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("vibes")
      .select("id, image_url, location, caption, mood, username, created_at, media_type, is_official, latitude, longitude")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setVibes(data as RecentVibe[]);
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
    <div className="absolute top-[60px] right-3 z-[1000] w-[190px]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[hsl(0,0%,10%,0.92)] backdrop-blur-xl border border-[hsl(0,0%,20%)] shadow-lg text-left"
      >
        <Radio className={`w-3 h-3 ${hasNew ? "text-red-400 animate-pulse" : "text-gold"}`} />
        <span className="text-[10px] font-semibold text-[hsl(30,20%,85%)] flex-1">
          Vibes récentes
        </span>
        {hasNew && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
        {open ? <ChevronUp className="w-3 h-3 text-[hsl(30,10%,65%)]" /> : <ChevronDown className="w-3 h-3 text-[hsl(30,10%,65%)]" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 bg-[hsl(0,0%,10%,0.92)] backdrop-blur-xl border border-[hsl(0,0%,20%)] rounded-xl shadow-lg overflow-hidden max-h-[300px] overflow-y-auto no-scrollbar"
          >
            {vibes.map((vibe, i) => (
              <button
                key={vibe.id}
                onClick={() => onVibeClick?.(vibe)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-[hsl(0,0%,15%)] transition-colors ${
                  i > 0 ? "border-t border-[hsl(0,0%,18%)]" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[hsl(0,0%,25%)] shrink-0">
                  <img src={vibe.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-[hsl(30,20%,85%)] truncate">
                    {vibe.username || vibe.location || "Anonyme"}
                  </p>
                  <p className="text-[9px] text-[hsl(30,10%,55%)]">
                    {vibe.mood ? `${vibe.mood} · ` : ""}{timeAgo(vibe.created_at)}
                  </p>
                </div>
                {vibe.is_official && <span className="text-[8px]">⭐</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
