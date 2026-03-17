import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getDistanceMeters } from "@/lib/energy";

interface ActiveOffer {
  id: string;
  title: string;
  place_name: string;
  place_slug: string | null;
  place_latitude: number | null;
  place_longitude: number | null;
  end_time: string | null;
}

export default function FloatingVipOffer() {
  const [offers, setOffers] = useState<ActiveOffer[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const navigate = useNavigate();
  const userLocation = useUserLocation();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data } = await supabase
          .from("vip_offers")
          .select("id, title, end_time, place_id")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!data || data.length === 0) return;

        const placeIds = [...new Set(data.map(o => o.place_id))];
        const { data: places } = await supabase
          .from("places")
          .select("id, name, slug, latitude, longitude")
          .in("id", placeIds);

        const placeMap: Record<string, { name: string; slug: string | null; latitude: number; longitude: number }> = {};
        if (places) places.forEach(p => { placeMap[p.id] = p; });

        const mapped: ActiveOffer[] = data
          .filter(o => placeMap[o.place_id])
          .map(o => ({
            id: o.id,
            title: o.title,
            place_name: placeMap[o.place_id].name,
            place_slug: placeMap[o.place_id].slug,
            place_latitude: placeMap[o.place_id].latitude,
            place_longitude: placeMap[o.place_id].longitude,
            end_time: o.end_time,
          }));

        setOffers(mapped);
      } catch {}
    };
    fetchOffers();
  }, []);

  // Filter by geo
  const filteredOffers = userLocation
    ? offers.filter(offer => {
        if (!offer.place_latitude || !offer.place_longitude) return true;
        const dist = getDistanceMeters(userLocation.lat, userLocation.lng, offer.place_latitude, offer.place_longitude);
        return dist <= 5000; // 5km radius
      })
    : offers;

  // Fallback: if no filtered offers but offers exist, show closest
  const displayOffer = filteredOffers.length > 0
    ? filteredOffers[0]
    : (userLocation && offers.length > 0
        ? offers.reduce((closest, o) => {
            if (!o.place_latitude || !o.place_longitude) return closest;
            if (!closest) return o;
            const dO = getDistanceMeters(userLocation.lat, userLocation.lng, o.place_latitude, o.place_longitude);
            const dC = getDistanceMeters(userLocation.lat, userLocation.lng, closest.place_latitude!, closest.place_longitude!);
            return dO < dC ? o : closest;
          }, null as ActiveOffer | null)
        : offers[0] || null);

  // Countdown timer
  useEffect(() => {
    if (!displayOffer?.end_time) return;
    const update = () => {
      const remaining = new Date(displayOffer.end_time!).getTime() - Date.now();
      if (remaining <= 0) { setTimeLeft("Expiré"); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setTimeLeft(`${h}h ${m.toString().padStart(2, "0")}m`);
      setIsUrgent(remaining < 2 * 60 * 60 * 1000);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [displayOffer?.end_time]);

  if (!displayOffer || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ y: 40, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 18, stiffness: 200, delay: 2 }}
        onClick={() => {
          if (displayOffer.place_slug) navigate(`/spot/${displayOffer.place_slug}`);
          setDismissed(true);
        }}
        className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-[1998] flex items-center gap-2.5 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all active:scale-95 ${
          isUrgent
            ? "bg-accent-warm/20 border-accent-warm/40 shadow-accent-warm/20"
            : "bg-card/95 border-gold/30 shadow-gold/10"
        }`}
      >
        {isUrgent && (
          <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-accent-warm" />
        )}

        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isUrgent ? "bg-accent-warm/30" : "bg-gold/15"
        }`}>
          <Gift className={`w-4.5 h-4.5 ${isUrgent ? "text-accent-warm" : "text-gold"}`} />
        </div>

        <div className="text-left min-w-0">
          <p className="text-[11px] font-bold text-foreground truncate max-w-[160px]">
            {displayOffer.title}
          </p>
          <p className="text-[9px] text-muted-foreground truncate">
            {displayOffer.place_name}
          </p>
        </div>

        {displayOffer.end_time && timeLeft && (
          <div className={`flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${
            isUrgent ? "bg-accent-warm/20 text-accent-warm" : "bg-gold/10 text-gold"
          }`}>
            <Clock className="w-3 h-3" />
            {timeLeft}
          </div>
        )}
      </motion.button>
    </AnimatePresence>
  );
}
