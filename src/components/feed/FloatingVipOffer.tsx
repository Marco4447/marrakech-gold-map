import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ActiveOffer {
  id: string;
  title: string;
  place_name: string;
  place_slug: string | null;
  end_time: string | null;
}

export default function FloatingVipOffer() {
  const [offer, setOffer] = useState<ActiveOffer | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOffer = async () => {
      const { data } = await supabase
        .from("vip_offers")
        .select("id, title, end_time, place_id")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!data || data.length === 0) return;

      const o = data[0];
      const { data: place } = await supabase
        .from("places")
        .select("name, slug")
        .eq("id", o.place_id)
        .maybeSingle();

      if (place) {
        setOffer({
          id: o.id,
          title: o.title,
          place_name: place.name,
          place_slug: place.slug,
          end_time: o.end_time,
        });
      }
    };
    fetchOffer();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!offer?.end_time) return;
    const update = () => {
      const remaining = new Date(offer.end_time!).getTime() - Date.now();
      if (remaining <= 0) { setTimeLeft("Expiré"); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setTimeLeft(`${h}h ${m.toString().padStart(2, "0")}m`);
      setIsUrgent(remaining < 2 * 60 * 60 * 1000); // < 2h
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [offer?.end_time]);

  if (!offer || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ y: 40, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 18, stiffness: 200, delay: 2 }}
        onClick={() => {
          if (offer.place_slug) navigate(`/spot/${offer.place_slug}`);
          setDismissed(true);
        }}
        className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-[1998] flex items-center gap-2.5 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all active:scale-95 ${
          isUrgent
            ? "bg-accent-warm/20 border-accent-warm/40 shadow-accent-warm/20"
            : "bg-card/95 border-gold/30 shadow-gold/10"
        }`}
      >
        {/* Pulse ring when urgent */}
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
            {offer.title}
          </p>
          <p className="text-[9px] text-muted-foreground truncate">
            {offer.place_name}
          </p>
        </div>

        {offer.end_time && timeLeft && (
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
