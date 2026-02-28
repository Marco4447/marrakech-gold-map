import { useEffect, useState } from "react";
import { Heart, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Vibe {
  id: string;
  image_url: string;
  caption: string | null;
  location: string | null;
  likes: number;
  created_at: string;
}

export default function LivePage() {
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("vibes")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setVibes(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <h1 className="font-display text-xl font-bold">
          <span className="text-gold">Live</span>
          <span className="text-foreground"> Vibes</span>
        </h1>
        <p className="text-muted-foreground text-xs mt-0.5">Les meilleures photos de Marrakech</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {vibes.map((vibe, i) => (
            <motion.button
              key={vibe.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="relative aspect-square overflow-hidden group"
              onClick={() => setSelectedVibe(selectedVibe?.id === vibe.id ? null : vibe)}
            >
              <img
                src={vibe.image_url}
                alt={vibe.caption || "Vibe"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <div className="flex items-center gap-1 text-foreground text-sm font-semibold">
                  <Heart className="w-4 h-4 fill-gold text-gold" />
                  {vibe.likes}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail overlay */}
      {selectedVibe && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-3 right-3 z-[1500] bg-card border border-border rounded-2xl p-4 shadow-2xl shadow-gold/5"
        >
          <div className="flex items-start gap-3">
            <img
              src={selectedVibe.image_url}
              alt=""
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              {selectedVibe.caption && (
                <p className="text-sm text-foreground font-medium truncate">
                  {selectedVibe.caption}
                </p>
              )}
              {selectedVibe.location && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-gold/60" />
                  <span className="text-xs text-muted-foreground">{selectedVibe.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1 mt-1.5">
                <Heart className="w-3.5 h-3.5 text-gold fill-gold" />
                <span className="text-xs text-gold font-semibold">{selectedVibe.likes}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedVibe(null)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
