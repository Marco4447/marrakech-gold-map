import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Bell, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { requestNotificationPermission } from "@/lib/pushNotifications";
import { toast } from "sonner";

interface OnboardingPreferencesProps {
  open: boolean;
  userId: string;
  onComplete: () => void;
}

const INTERESTS = [
  { key: "rooftops", emoji: "🍸", label: "Rooftops" },
  { key: "food", emoji: "🍽️", label: "Food" },
  { key: "party", emoji: "🎵", label: "Party" },
  { key: "culture", emoji: "🕌", label: "Culture" },
  { key: "chill", emoji: "☀️", label: "Chill" },
  { key: "shopping", emoji: "🛍️", label: "Shopping" },
];

export default function OnboardingPreferences({ open, userId, onComplete }: OnboardingPreferencesProps) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (open) {
      setClosed(false);
      setStep(0);
    }
  }, [open]);

  if (!open || closed) return null;

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const persistLocalOnboarding = (prefs: string[]) => {
    try {
      localStorage.setItem("wk_preferences", JSON.stringify(prefs));
      localStorage.setItem("wk_onboarding_prefs_done", "1");
      localStorage.setItem("wk_welcome_seen", "1");
    } catch {
      // Ignore storage failures, backend flag is source of truth
    }
  };

  const finish = async () => {
    setLoading(true);
    const prefs = Array.from(selected);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: userId, preferences: prefs, onboarding_completed: true } as any, { onConflict: "user_id" });

      if (error) throw error;
      persistLocalOnboarding(prefs);
    } catch {
      persistLocalOnboarding(prefs);
      toast.info("Préférences sauvegardées localement.");
    } finally {
      setLoading(false);
      setClosed(true);
      onComplete();
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La localisation n'est pas disponible sur cet appareil.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        toast.success("Localisation activée !");
        setLocationLoading(false);
      },
      () => {
        toast.error("Localisation refusée. Tu peux continuer sans.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const steps = [
    // Step 0: Welcome
    <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center text-center space-y-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }} className="text-6xl">🌙</motion.div>
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Bienvenue à Marrakech</h2>
        <p className="text-sm text-muted-foreground mt-2">Découvre la ville rouge en temps réel.<br />Les meilleurs spots, les meilleures vibes.</p>
      </div>
      <button onClick={() => setStep(1)}
        className="w-full py-3.5 rounded-2xl font-bold text-sm text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
        C'est parti <ArrowRight className="w-4 h-4" />
      </button>
      <button onClick={finish} className="w-full text-xs text-muted-foreground text-center py-1">Passer</button>
    </motion.div>,

    // Step 1: Interests
    <motion.div key="interests" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-foreground">Tu cherches quoi ?</h2>
        <p className="text-xs text-muted-foreground mt-1">Sélectionne tes centres d'intérêt</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {INTERESTS.map((item) => {
          const active = selected.has(item.key);
          return (
            <motion.button key={item.key} whileTap={{ scale: 0.95 }}
              onClick={() => { toggle(item.key); try { navigator.vibrate?.(5); } catch {} }}
              className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${active ? "border-gold bg-gold/10" : "border-border bg-card hover:border-gold/30"}`}>
              <span className="text-2xl">{item.emoji}</span>
              <span className={`text-sm font-semibold ${active ? "text-gold" : "text-foreground"}`}>{item.label}</span>
              {active && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-gold" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      <button onClick={() => setStep(2)} disabled={selected.size === 0}
        className="w-full py-3.5 rounded-2xl font-bold text-sm text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
        Continuer ({selected.size} choix) <ArrowRight className="w-4 h-4" />
      </button>
      <button onClick={() => { setStep(2); }} className="w-full text-xs text-muted-foreground text-center py-1">Passer</button>
    </motion.div>,

    // Step 2: Permissions
    <motion.div key="permissions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-foreground">Reste connecté</h2>
        <p className="text-xs text-muted-foreground mt-1">Pour ne rien manquer des meilleurs spots</p>
      </div>
      <div className="space-y-3">
        <button onClick={async () => {
          await requestNotificationPermission();
          try { navigator.vibrate?.(10); } catch {}
          toast.success("Notifications activées !");
        }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-gold/30 transition-colors text-left">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 text-gold" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-xs text-muted-foreground">Sois alerté des événements et offres près de toi</p>
          </div>
        </button>
        <button onClick={requestLocation} disabled={locationLoading} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-gold/30 transition-colors text-left disabled:opacity-60">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-gold" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{locationLoading ? "Activation..." : "Localisation"}</p>
            <p className="text-xs text-muted-foreground">Trouve les spots autour de toi sur la carte</p>
          </div>
        </button>
      </div>
      <button onClick={finish} disabled={loading}
        className="w-full py-3.5 rounded-2xl font-bold text-sm text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
        {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : "Découvrir Marrakech 🔥"}
      </button>
    </motion.div>,
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-onboarding flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-gold/20 shadow-[0_8px_40px_-8px_hsl(43_76%_52%/0.25)]"
        style={{ background: "linear-gradient(135deg, hsl(0 0% 8% / 0.9), hsl(0 0% 5% / 0.95))", backdropFilter: "blur(24px)" }}>
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-5 pb-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-gold" : i < step ? "w-1.5 bg-gold/50" : "w-1.5 bg-muted-foreground/30"}`} />
          ))}
        </div>
        <div className="p-6">
          <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
