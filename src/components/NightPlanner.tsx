import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Plus, X, Clock, MapPin, Share2, Trash2, GripVertical, Search } from "lucide-react";
import { toast } from "sonner";

interface NightPlannerProps {
  open: boolean;
  onClose: () => void;
  places: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    image_url: string | null;
    category: string | null;
  }>;
}

interface PlanStop {
  placeId: string;
  placeName: string;
  time: string;
  lat: number;
  lng: number;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function travelMinutes(km: number): number {
  return Math.round((km / 30) * 60);
}

const MAX_STOPS = 5;

export default function NightPlanner({ open, onClose, places }: NightPlannerProps) {
  const [stops, setStops] = useState<PlanStop[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlaces = places.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !stops.some((s) => s.placeId === p.id)
  );

  const addStop = useCallback(
    (place: (typeof places)[0]) => {
      if (stops.length >= MAX_STOPS) {
        toast.error("Maximum 5 spots par soirée");
        return;
      }
      setStops((prev) => [
        ...prev,
        {
          placeId: place.id,
          placeName: place.name,
          time: "21:00",
          lat: place.latitude,
          lng: place.longitude,
        },
      ]);
      setPickerOpen(false);
      setSearchQuery("");
    },
    [stops.length]
  );

  const removeStop = (placeId: string) => {
    setStops((prev) => prev.filter((s) => s.placeId !== placeId));
  };

  const updateTime = (placeId: string, time: string) => {
    setStops((prev) => prev.map((s) => (s.placeId === placeId ? { ...s, time } : s)));
  };

  const totalTravelMinutes = stops.reduce((acc, stop, i) => {
    if (i === 0) return 0;
    const prev = stops[i - 1];
    const km = haversineKm(prev.lat, prev.lng, stop.lat, stop.lng);
    return acc + travelMinutes(km);
  }, 0);

  const shareWhatsApp = () => {
    if (stops.length < 2) {
      toast.error("Ajoute au moins 2 spots pour partager");
      return;
    }
    const lines = stops.map(
      (s, i) => `${i + 1}. ${s.time.replace(":", "h")} — ${s.placeName}`
    );
    const text = `🌙 Mon parcours Weshkech ce soir:\n${lines.join("\n")}\n\n⏱ Trajet estimé: ~${totalTravelMinutes} min`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const savePlan = () => {
    if (stops.length < 2) {
      toast.error("Ajoute au moins 2 spots pour sauvegarder");
      return;
    }
    const existing = JSON.parse(localStorage.getItem("wk_night_plans") || "[]");
    existing.push({ stops, createdAt: new Date().toISOString() });
    localStorage.setItem("wk_night_plans", JSON.stringify(existing));
    toast.success("Soirée sauvegardée !");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a2e] rounded-t-3xl max-h-[85vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Planifier ma soirée</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {stops.length === 0 && (
                <p className="text-white/40 text-sm text-center py-8">
                  Ajoute des spots pour planifier ta soirée
                </p>
              )}

              {/* Stop list */}
              <Reorder.Group axis="y" values={stops} onReorder={setStops} className="space-y-0">
                {stops.map((stop, index) => {
                  const travelFromPrev =
                    index > 0
                      ? travelMinutes(
                          haversineKm(
                            stops[index - 1].lat,
                            stops[index - 1].lng,
                            stop.lat,
                            stop.lng
                          )
                        )
                      : null;

                  return (
                    <div key={stop.placeId}>
                      {/* Travel time indicator */}
                      {travelFromPrev !== null && (
                        <div className="flex items-center gap-2 py-2 pl-8">
                          <div className="h-5 w-px bg-[#D4AF37]/30" />
                          <span className="text-xs text-white/40">
                            ~{travelFromPrev} min de trajet
                          </span>
                        </div>
                      )}

                      <Reorder.Item
                        value={stop}
                        className="flex items-center gap-3 py-3 border-b border-white/5"
                      >
                        <GripVertical className="w-4 h-4 text-white/20 cursor-grab shrink-0" />

                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold shrink-0">
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {stop.placeName}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-white/40" />
                          <input
                            type="time"
                            value={stop.time}
                            onChange={(e) => updateTime(stop.placeId, e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm w-[80px] focus:outline-none focus:border-[#D4AF37]/50"
                          />
                        </div>

                        <button
                          onClick={() => removeStop(stop.placeId)}
                          className="p-1.5 rounded-full hover:bg-red-500/15 transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-400/70" />
                        </button>
                      </Reorder.Item>
                    </div>
                  );
                })}
              </Reorder.Group>

              {/* Add stop button */}
              {stops.length < MAX_STOPS && (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-2 w-full py-3 text-[#D4AF37] text-sm font-medium hover:bg-white/5 rounded-lg transition-colors px-2 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un spot
                </button>
              )}

              {/* Place picker */}
              <AnimatePresence>
                {pickerOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/5 rounded-xl p-3 mt-2 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          placeholder="Chercher un spot..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredPlaces.length === 0 && (
                          <p className="text-white/30 text-xs text-center py-3">
                            Aucun spot trouvé
                          </p>
                        )}
                        {filteredPlaces.slice(0, 10).map((place) => (
                          <button
                            key={place.id}
                            onClick={() => addStop(place)}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="text-white text-sm truncate">{place.name}</span>
                            {place.category && (
                              <span className="text-white/30 text-xs ml-auto shrink-0">
                                {place.category}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setPickerOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full text-center text-white/40 text-xs py-1 hover:text-white/60 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Summary + actions */}
            {stops.length >= 2 && (
              <div className="border-t border-white/10 px-5 py-4 space-y-3">
                {/* Summary */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">
                    {stops.length} spots · ~{totalTravelMinutes} min de trajet
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={savePlan}
                    className="flex-1 py-3 bg-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/15 transition-colors"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={shareWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#D4AF37] text-black text-sm font-bold rounded-xl hover:bg-[#D4AF37]/90 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
