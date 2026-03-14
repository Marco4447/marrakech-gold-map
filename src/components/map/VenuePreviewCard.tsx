import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Star, Navigation, ChevronRight, Sparkles } from "lucide-react";
import type { Place } from "@/types/models";
import { getDistanceMeters, formatDistance } from "@/lib/energy";

interface VenuePreviewCardProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelect: (place: Place) => void;
  onOpenSheet: (place: Place) => void;
  userPosition: { lat: number; lng: number } | null;
  activeVipPlaceIds: Set<string>;
}

export default function VenuePreviewCard({
  places,
  selectedPlace,
  onSelect,
  onOpenSheet,
  userPosition,
  activeVipPlaceIds,
}: VenuePreviewCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);

  useEffect(() => {
    if (!selectedPlace || places.length === 0) return;
    const idx = places.findIndex((p) => p.id === selectedPlace.id);
    if (idx >= 0) setCurrentIndex(idx);
  }, [selectedPlace?.id, places]);

  const currentPlace = places[currentIndex];
  if (!currentPlace) return null;

  const distance = userPosition
    ? formatDistance(getDistanceMeters(userPosition.lat, userPosition.lng, currentPlace.latitude, currentPlace.longitude))
    : null;

  const hasVipOffer = activeVipPlaceIds.has(currentPlace.id);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${currentPlace.latitude},${currentPlace.longitude}`;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -60 && currentIndex < places.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      onSelect(places[next]);
    } else if (info.offset.x > 60 && currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      onSelect(places[prev]);
    }
  };

  return (
    <div className="absolute bottom-20 left-0 right-0 z-[1001] px-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPlace.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className="cursor-grab active:cursor-grabbing"
        >
          <div
            className={`bg-card/95 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden ${
              currentPlace.is_partner ? "border-gold/40 shadow-gold/10" : "border-border"
            }`}
          >
            <div className="flex gap-3 p-3">
              {/* Image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-muted relative">
                {currentPlace.image_url ? (
                  <img
                    src={currentPlace.image_url}
                    alt={currentPlace.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-secondary">
                    📍
                  </div>
                )}
                {hasVipOffer && (
                  <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-destructive/90 rounded-full px-1.5 py-px">
                    <Sparkles className="w-2 h-2 text-white" />
                    <span className="text-[7px] font-bold text-white">VIP</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-display font-bold text-foreground truncate">
                      {currentPlace.name}
                    </h3>
                    {(currentPlace as any).is_founder && (
                      <span className="text-[8px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded-full shrink-0">🛡️</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {currentPlace.category && (
                      <span className="text-[10px] text-gold font-medium uppercase tracking-wider">
                        {currentPlace.category}
                      </span>
                    )}
                    {currentPlace.rating && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gold">
                        <Star className="w-2.5 h-2.5 fill-gold" />
                        {currentPlace.rating}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    {distance && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <MapPin className="w-2.5 h-2.5" />
                        {distance}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-gold hover:bg-gold-light text-primary-foreground text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Navigation className="w-3 h-3" />
                      Go
                    </a>
                    <button
                      onClick={() => onOpenSheet(currentPlace)}
                      className="flex items-center gap-0.5 bg-secondary hover:bg-secondary/80 text-foreground text-[10px] font-medium px-2 py-1.5 rounded-lg transition-colors"
                    >
                      Détails
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination dots */}
            {places.length > 1 && (
              <div className="flex items-center justify-center gap-1 pb-2">
                {places.slice(Math.max(0, currentIndex - 3), currentIndex + 4).map((p, i) => {
                  const realIdx = Math.max(0, currentIndex - 3) + i;
                  return (
                    <div
                      key={p.id}
                      className={`rounded-full transition-all duration-200 ${
                        realIdx === currentIndex
                          ? "w-4 h-1.5 bg-gold"
                          : "w-1.5 h-1.5 bg-foreground/20"
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
