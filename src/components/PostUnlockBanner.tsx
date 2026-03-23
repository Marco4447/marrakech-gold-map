import { useState, useEffect } from "react";
import { Camera, Gift, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PostUnlockBannerProps {
  placeId: string;
  placeName: string;
  onPostClick: () => void;
}

/**
 * Shows a banner on venue pages: "Post a Vibe here → Unlock VIP offers"
 * Checks if user already posted a vibe at this place.
 */
export default function PostUnlockBanner({ placeId, placeName, onPostClick }: PostUnlockBannerProps) {
  const { user } = useAuth();
  const [hasPosted, setHasPosted] = useState(false);
  const [offersCount, setOffersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      // Check if there are active offers for this place
      const { count: offers } = await supabase
        .from("partner_offers")
        .select("id", { count: "exact", head: true })
        .eq("place_id", placeId)
        .eq("is_active", true);

      setOffersCount(offers ?? 0);

      // Check if user posted a vibe at this place
      if (user) {
        const { count: vibeCount } = await supabase
          .from("vibes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("location", placeName);
        setHasPosted((vibeCount ?? 0) > 0);
      }

      setLoading(false);
    };
    check();
  }, [placeId, placeName, user]);

  if (loading || offersCount === 0) return null;

  if (hasPosted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gold/30 p-3 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, hsl(43 76% 52% / 0.08), hsl(43 70% 62% / 0.03))" }}
      >
        <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
          <Gift className="w-4 h-4 text-gold" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gold">🎉 Offres VIP débloquées !</p>
          <p className="text-2xs text-muted-foreground">Tu as posté ici — les offres exclusives sont accessibles.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={onPostClick}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="w-full rounded-xl border border-gold/30 p-3 flex items-center gap-3 text-left transition-all hover:border-gold/50"
      style={{ background: "linear-gradient(135deg, hsl(43 76% 52% / 0.08), hsl(43 70% 62% / 0.03))" }}
    >
      <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
        <Camera className="w-5 h-5 text-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-gold" />
          Poste une Vibe, débloque {offersCount} offre{offersCount > 1 ? "s" : ""} VIP
        </p>
        <p className="text-2xs text-muted-foreground mt-0.5">
          Partage un moment depuis {placeName} et accède aux avantages exclusifs
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-gold shrink-0" />
    </motion.button>
  );
}
