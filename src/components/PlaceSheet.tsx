import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Tag, Zap } from "lucide-react";
import DealTunnel from "./DealTunnel";

interface Place {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  address: string | null;
  rating: number | null;
}

interface PlaceSheetProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PlaceSheet({ place, open, onOpenChange }: PlaceSheetProps) {
  const [dealOpen, setDealOpen] = useState(false);

  if (!place) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 bg-background/40 backdrop-blur-sm z-[1001]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            className="absolute bottom-16 left-0 right-0 z-[1002] px-4 pb-4"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-2xl shadow-gold/5">
              {place.image_url && (
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={place.image_url}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      {place.name}
                    </h2>
                    {place.category && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Tag className="w-3 h-3 text-gold" />
                        <span className="text-xs text-gold font-medium uppercase tracking-wider">
                          {place.category}
                        </span>
                      </div>
                    )}
                  </div>
                  {place.rating && (
                    <div className="flex items-center gap-1 bg-gold/10 px-2.5 py-1 rounded-full shrink-0">
                      <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                      <span className="text-sm font-semibold text-gold">{place.rating}</span>
                    </div>
                  )}
                </div>

                {place.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {place.description}
                  </p>
                )}

                {/* Value proposition */}
                <div className="bg-gold/5 border border-gold/15 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs text-foreground leading-relaxed">
                    🔓 Pour <span className="text-gold font-semibold">2,00€</span>, débloquez :
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 pl-1">
                    <li>📖 Le guide PDF <span className="text-gold font-medium">« Marrakech : 48h sans pièges à touristes »</span></li>
                    <li>🎟️ Accès prioritaire à la communauté <span className="text-gold font-medium">Weshkech Insiders</span></li>
                  </ul>
                </div>

                {place.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-gold/60 shrink-0" />
                    <span className="text-xs">{place.address}</span>
                  </div>
                )}

                {/* Deal Button */}
                <button
                  onClick={() => setDealOpen(true)}
                  className="w-full mt-1 flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-gold/20"
                >
                  <Zap className="w-4 h-4" />
                  Voir les Secrets Insider
                </button>
              </div>
            </div>
          </motion.div>

          <DealTunnel
            open={dealOpen}
            onOpenChange={setDealOpen}
            placeName={place.name}
          />
        </>
      )}
    </AnimatePresence>
  );
}
