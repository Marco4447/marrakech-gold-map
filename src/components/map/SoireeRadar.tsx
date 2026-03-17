import { useMemo } from "react";
import { motion } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { MapPin } from "lucide-react";
import type { Place, VibePin } from "@/types/models";
import { getDistanceMeters, formatDistance, type EnergyLevel } from "@/lib/energy";

interface Props {
  open: boolean;
  places: Place[];
  userPosition: { lat: number; lng: number } | null;
  energyMap: Map<string, EnergyLevel>;
  vibePins: VibePin[];
  onPlaceSelect: (place: Place) => void;
  onClose: () => void;
}

const ONE_HOUR = 60 * 60 * 1000;

const CATEGORY_EMOJIS: Record<string, string> = {
  rooftop: "🌅", nightlife: "💃", restaurant: "🍽️", cafe: "☕",
  "street food": "🧆", bar: "🍸", club: "🎵", lounge: "🍸",
  hotel: "🏨", attraction: "📸",
};

function getCategoryEmoji(category: string | null): string {
  if (!category) return "📍";
  const lower = category.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "📍";
}

export default function SoireeRadar({ open, places, userPosition, energyMap, vibePins, onPlaceSelect, onClose }: Props) {
  const sortedPlaces = useMemo(() => {
    if (!userPosition) return places.slice(0, 20);

    const withDist = places.map(p => ({
      ...p,
      distance: getDistanceMeters(userPosition.lat, userPosition.lng, p.latitude, p.longitude),
    }));

    const nearby = withDist.filter(p => p.distance < 3000);
    const list = nearby.length > 0 ? nearby : withDist;
    return list.sort((a, b) => a.distance - b.distance).slice(0, 20);
  }, [places, userPosition]);

  const vibeCountMap = useMemo(() => {
    const now = Date.now();
    const counts = new Map<string, number>();
    vibePins.forEach(v => {
      if (!v.location) return;
      const age = now - new Date(v.created_at).getTime();
      if (age < ONE_HOUR) {
        const key = v.location.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    return counts;
  }, [vibePins]);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[75vh] bg-card border-border">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-sm font-bold flex items-center gap-2">
            <span>📡</span> Radar — Ce qui bouge autour de toi
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto space-y-1.5">
          {!userPosition && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">📍 Active ta position GPS pour voir les spots autour de toi</p>
            </div>
          )}

          {sortedPlaces.map((place, i) => {
            const dist = userPosition
              ? getDistanceMeters(userPosition.lat, userPosition.lng, place.latitude, place.longitude)
              : null;
            const energy = energyMap.get(place.name.toLowerCase());
            const liveCount = vibeCountMap.get(place.name.toLowerCase()) || 0;

            return (
              <motion.button
                key={place.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onPlaceSelect(place)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border hover:border-gold/30 transition-all text-left"
              >
                <div className="flex flex-col items-center gap-0.5 w-12 shrink-0">
                  {dist != null && (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      📍 {formatDistance(dist)}
                    </span>
                  )}
                  <span className="text-lg">{getCategoryEmoji(place.category)}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{place.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {energy && (
                      <span className={`text-[10px] font-bold ${energy.color}`}>
                        {energy.emoji} {energy.label}
                      </span>
                    )}
                    {liveCount > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                        {liveCount} vibe{liveCount > 1 ? "s" : ""} live
                      </span>
                    )}
                  </div>
                </div>

                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
