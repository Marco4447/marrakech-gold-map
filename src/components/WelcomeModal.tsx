import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Clock, Gift, MapPin, X } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onComplete: (coords: { lat: number; lng: number } | null) => void;
}

const rules = [
  {
    emoji: "📸",
    icon: Camera,
    title: "Capturez le Réel",
    desc: "Partagez l'ambiance sans filtre.",
  },
  {
    emoji: "⏳",
    icon: Clock,
    title: "Règle des 6H",
    desc: "Vos vibes sont éphémères et disparaissent après 6 heures.",
  },
  {
    emoji: "🎁",
    icon: Gift,
    title: "Pass Privilège",
    desc: "Profitez d'avantages exclusifs chez nos partenaires.",
  },
];

export default function WelcomeModal({ open, onComplete }: WelcomeModalProps) {
  const [step, setStep] = useState<"welcome" | "geoloc">("welcome");
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    setStep("geoloc");
  };

  const requestGeoloc = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onComplete({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLoading(false);
        onComplete(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const skipGeoloc = () => {
    onComplete(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[4000] flex items-center justify-center p-6"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-gold/20 shadow-[0_8px_40px_-8px_hsl(43_76%_52%/0.25)]"
            style={{
              background: "linear-gradient(135deg, hsl(0 0% 8% / 0.85), hsl(0 0% 5% / 0.9))",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            {/* Gold accent line at top */}
            <div
              className="h-1 w-full"
              style={{ background: "linear-gradient(to right, #BF953F, #FCF6BA, #B38728)" }}
            />

            <div className="p-6 space-y-6">
              <AnimatePresence mode="wait">
                {step === "welcome" ? (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    {/* Title */}
                    <div className="text-center space-y-2">
                      <h2 className="font-display text-2xl font-bold text-gold">
                        Bienvenue dans le Club !
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Voici les 3 règles d'or de Weshkech
                      </p>
                    </div>

                    {/* Rules */}
                    <div className="space-y-4">
                      {rules.map((rule, i) => (
                        <motion.div
                          key={rule.title}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 * (i + 1) }}
                          className="flex items-start gap-3 p-3 rounded-2xl bg-gold/5 border border-gold/10"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-lg">
                            {rule.emoji}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{rule.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{rule.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Continue */}
                    <button
                      onClick={handleContinue}
                      className="cta-shimmer relative w-full overflow-hidden py-3.5 rounded-2xl font-bold text-primary-foreground text-sm tracking-wide transition-all active:scale-[0.98] shadow-[0_6px_20px_-4px_hsl(43_76%_52%/0.4)]"
                      style={{ background: "linear-gradient(to bottom right, #BF953F, #FCF6BA, #B38728)" }}
                    >
                      Continuer
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="geoloc"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    {/* Geoloc icon */}
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-gold" />
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="font-display text-lg font-bold text-foreground">
                        Activez votre position
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed px-2">
                        Autorisez Weshkech à accéder à votre position pour afficher les vibes autour de vous et débloquer vos avantages Pass Invité.
                      </p>
                    </div>

                    <button
                      onClick={requestGeoloc}
                      disabled={loading}
                      className="cta-shimmer relative w-full overflow-hidden py-3.5 rounded-2xl font-bold text-primary-foreground text-sm tracking-wide transition-all active:scale-[0.98] shadow-[0_6px_20px_-4px_hsl(43_76%_52%/0.4)] disabled:opacity-70"
                      style={{ background: "linear-gradient(to bottom right, #BF953F, #FCF6BA, #B38728)" }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Localisation…
                        </span>
                      ) : (
                        "Autoriser la localisation"
                      )}
                    </button>

                    <button
                      onClick={skipGeoloc}
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      Plus tard
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}