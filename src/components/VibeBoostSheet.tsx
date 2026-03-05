import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Compass, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const BOOST_OPTIONS = [
  {
    type: "24h_visibility",
    label: "+24h de visibilité",
    desc: "Ta vibe reste visible 24h de plus",
    price: "1€",
    priceId: "price_1T7idcJ8RyilXHbfu8quT9F2",
    icon: Zap,
  },
  {
    type: "discover_featured",
    label: "Featured Discover",
    desc: "Mise en avant dans la page Discover",
    price: "3€",
    priceId: "price_1T7idxJ8RyilXHbfUmO06T3U",
    icon: Compass,
  },
  {
    type: "map_spotlight",
    label: "Map Spotlight",
    desc: "Spotlight doré sur la carte",
    price: "5€",
    priceId: "price_1T7ieRJ8RyilXHbfaY93RC1O",
    icon: MapPin,
  },
];

interface VibeBoostSheetProps {
  vibeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VibeBoostSheet({ vibeId, open, onOpenChange }: VibeBoostSheetProps) {
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handleBoost = async (option: typeof BOOST_OPTIONS[0]) => {
    if (!user) { toast.error("Connecte-toi d'abord"); return; }
    setPurchasing(option.type);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId: option.priceId,
          productType: "vibe_boost",
          boostType: option.type,
          vibeId,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Erreur de paiement");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl px-5 pb-8 pt-4 max-h-[70dvh] overflow-y-auto"
          >
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-gold" /> Booster ta Vibe
              </h2>
              <button onClick={() => onOpenChange(false)} className="p-2 rounded-full bg-surface">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              {BOOST_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => handleBoost(opt)}
                  disabled={!!purchasing}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface hover:border-gold/30 transition-all active:scale-[0.98] text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <opt.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {purchasing === opt.type ? (
                      <Loader2 className="w-5 h-5 text-gold animate-spin" />
                    ) : (
                      <span className="text-sm font-bold text-gold">{opt.price}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-4">
              Paiement sécurisé via Stripe · Effet immédiat
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
