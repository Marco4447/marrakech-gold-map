import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, MapPin, Zap } from "lucide-react";
import type { NearbyPlace } from "@/hooks/useProximityDetection";
import { formatDistance } from "@/lib/energy";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AutoVibeCardProps {
  place: NearbyPlace | null;
  onPost: (place: NearbyPlace) => void;
  onDismiss: () => void;
}

export default function AutoVibeCard({ place, onPost, onDismiss }: AutoVibeCardProps) {
  const [vibeCount, setVibeCount] = useState(0);

  // Fetch recent vibe count for this place
  useEffect(() => {
    if (!place) return;
    const fetchCount = async () => {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { count } = await supabase
        .from("vibes")
        .select("id", { count: "exact", head: true })
        .ilike("location", place.name)
        .gte("created_at", oneHourAgo);
      setVibeCount(count || 0);
    };
    fetchCount();
  }, [place?.id]);

  return (
    <AnimatePresence>
      {place && (
        <motion.div
          key={place.id}
          initial={{ y: 120, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 120, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="fixed bottom-20 left-3 right-3 z-float pointer-events-auto"
        >
          <div className="relative bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-2xl shadow-black/30 overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsl(43 76% 52%), transparent)" }} />

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="flex items-center gap-3">
              {/* Place image/icon */}
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                {place.image_url ? (
                  <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Tu es à {formatDistance(place.distance)}
                </p>
                <p className="text-sm font-bold text-foreground truncate mt-0.5">{place.name}</p>
                {vibeCount > 0 && (
                  <p className="text-2xs text-orange-400 font-semibold mt-0.5 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {vibeCount} vibe{vibeCount > 1 ? "s" : ""} cette heure
                  </p>
                )}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => onPost(place)}
              className="w-full mt-3 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-lg"
              style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)", color: "#1a1a1a" }}
            >
              <Camera className="w-4 h-4" />
              Poster une Vibe en 1 tap
            </button>

            <p className="text-2xs text-center text-muted-foreground mt-2">
              📍 Live from Marrakech • +10 XP
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
