import { motion, AnimatePresence } from "framer-motion";
import { Rocket, X, Flame, Eye, MapPin } from "lucide-react";

interface Props {
  show: boolean;
  onClose: () => void;
  onBoost?: (tier: string) => void;
}

const BOOSTS = [
  { key: "extend", price: "1€", label: "+24h de visibilité", icon: Flame, desc: "Ta vibe reste visible plus longtemps" },
  { key: "discover", price: "3€", label: "Discover Feed", icon: Eye, desc: "Mise en avant dans l'onglet Discover" },
  { key: "spotlight", price: "5€", label: "Map Spotlight", icon: MapPin, desc: "Halo doré sur la carte pendant 4h" },
];

export default function BoostUpsell({ show, onClose, onBoost }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border-t border-gold/20 rounded-t-3xl p-6 space-y-4 pb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-gold" />
                <h3 className="font-display text-base font-bold text-foreground">Booste ta vibe 🚀</h3>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Ta vibe est publiée ! Donne-lui un coup de boost pour toucher plus de monde.</p>

            <div className="space-y-2">
              {BOOSTS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => onBoost?.(b.key)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card/80 hover:border-gold/30 transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <b.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-foreground">{b.label}</p>
                    <p className="text-2xs text-muted-foreground">{b.desc}</p>
                  </div>
                  <span className="text-sm font-black text-gold shrink-0">{b.price}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              Non merci, pas maintenant
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
