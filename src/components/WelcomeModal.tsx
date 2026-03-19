import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Clock, Gift, MapPin, ArrowRight, Sparkles, Bell } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { requestNotificationPermission } from "@/lib/pushNotifications";

interface WelcomeModalProps {
  open: boolean;
  onComplete: (coords: { lat: number; lng: number } | null) => void;
  onOpenFlashPost?: () => void;
}

const TOTAL_STEPS = 3;

export default function WelcomeModal({ open, onComplete, onOpenFlashPost }: WelcomeModalProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const requestGeoloc = () => {
    setLoading(true);
    // Request both geoloc + notifications in parallel
    requestNotificationPermission().catch(() => {});
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLoading(false); finish({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => { setLoading(false); finish(null); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const finish = (coords: { lat: number; lng: number } | null) => {
    localStorage.setItem("wk_welcome_seen", "1");
    onComplete(coords);
  };

  const steps = [
    // Step 0: Welcome rules
    {
      content: (
        <motion.div key="rules" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl font-bold text-gold">{t("welcome_title")}</h2>
            <p className="text-xs text-muted-foreground">{t("welcome_subtitle")}</p>
          </div>
          <div className="space-y-3">
            {[
              { emoji: "📸", title: t("welcome_rule1Title"), desc: t("welcome_rule1Desc") },
              { emoji: "⏳", title: t("welcome_rule2Title"), desc: t("welcome_rule2Desc") },
              { emoji: "🎁", title: t("welcome_rule3Title"), desc: t("welcome_rule3Desc") },
            ].map((rule, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }}
                className="flex items-start gap-3 p-3 rounded-2xl bg-gold/5 border border-gold/10">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-lg">{rule.emoji}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{rule.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rule.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <button onClick={() => setStep(1)}
            className="cta-shimmer relative w-full overflow-hidden py-3.5 rounded-2xl font-bold text-primary-foreground text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_6px_20px_-4px_hsl(43_76%_52%/0.4)]"
            style={{ background: "linear-gradient(to bottom right, #BF953F, #FCF6BA, #B38728)" }}>
            {t("continue")} <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      ),
    },
    // Step 1: Geolocation
    {
      content: (
        <motion.div key="geoloc" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-gold" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-display text-lg font-bold text-foreground">{t("welcome_geoTitle")}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed px-2">{t("welcome_geoDesc")}</p>
          </div>
          <button onClick={requestGeoloc} disabled={loading}
            className="cta-shimmer relative w-full overflow-hidden py-3.5 rounded-2xl font-bold text-primary-foreground text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_6px_20px_-4px_hsl(43_76%_52%/0.4)] disabled:opacity-70"
            style={{ background: "linear-gradient(to bottom right, #BF953F, #FCF6BA, #B38728)" }}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                {t("welcome_locating")}
              </span>
            ) : (
              <>{t("welcome_allowLocation")} <MapPin className="w-4 h-4" /></>
            )}
          </button>
          <button onClick={() => setStep(2)} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2">{t("later")}</button>
        </motion.div>
      ),
    },
    // Step 2: Quick tips + go
    {
      content: (
        <motion.div key="tips" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
          <div className="text-center space-y-2">
            <span className="text-3xl">🚀</span>
            <h3 className="font-display text-lg font-bold text-foreground">Tu es prêt !</h3>
            <p className="text-xs text-muted-foreground">Voici comment profiter à fond de Weshkech</p>
          </div>
          <div className="space-y-2">
            {[
              { emoji: "🗺️", text: "Explore la carte pour trouver les spots" },
              { emoji: "📸", text: "Poste tes vibes — elles disparaissent après 6h" },
              { emoji: "⚡", text: "Like et boost pour monter dans le classement" },
            ].map((tip, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * (i + 1) }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface border border-border">
                <span className="text-base">{tip.emoji}</span>
                <p className="text-xs text-foreground">{tip.text}</p>
              </motion.div>
            ))}
          </div>
          <button onClick={() => finish(null)}
            className="cta-shimmer relative w-full overflow-hidden py-3.5 rounded-2xl font-bold text-primary-foreground text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_6px_20px_-4px_hsl(43_76%_52%/0.4)]"
            style={{ background: "linear-gradient(to bottom right, #BF953F, #FCF6BA, #B38728)" }}>
            C'est parti ! <Sparkles className="w-4 h-4" />
          </button>
        </motion.div>
      ),
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[4000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-gold/20 shadow-[0_8px_40px_-8px_hsl(43_76%_52%/0.25)]"
            style={{ background: "linear-gradient(135deg, hsl(0 0% 8% / 0.85), hsl(0 0% 5% / 0.9))", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
          >
            {/* Progress bar */}
            <div className="h-1 w-full bg-muted">
              <motion.div
                className="h-full"
                style={{ background: "linear-gradient(to right, #BF953F, #FCF6BA, #B38728)" }}
                animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
            <div className="p-6">
              <AnimatePresence mode="wait">
                {steps[step].content}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
