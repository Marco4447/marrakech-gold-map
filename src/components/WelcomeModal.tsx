import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WelcomeModalProps {
  open: boolean;
  onComplete: (coords: { lat: number; lng: number } | null) => void;
  onOpenFlashPost?: () => void;
}

const INTERESTS = [
  { key: "cafe", emoji: "🍵", label: "Cafés" },
  { key: "restaurant", emoji: "🍽️", label: "Restos" },
  { key: "culture", emoji: "🏛️", label: "Culture" },
  { key: "nightlife", emoji: "🌙", label: "Soirées" },
];

interface SpotPreview {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  rating: number | null;
}

function logEvent(event: string) {
  supabase.from("acquisition_events").insert({
    event_type: event,
    source: "onboarding",
    campaign: new Date().toISOString().split("T")[0],
  } as any).then(() => {});
}

export default function WelcomeModal({ open, onComplete }: WelcomeModalProps) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [spots, setSpots] = useState<SpotPreview[]>([]);
  const [hasLogged, setHasLogged] = useState(false);

  // Log onboarding_started once
  useEffect(() => {
    if (open && !hasLogged) {
      logEvent("onboarding_started");
      setHasLogged(true);
    }
  }, [open, hasLogged]);

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const goToStep2 = () => {
    setStep(1);
  };

  const goToStep3 = async () => {
    logEvent("onboarding_preferences_set");
    // Save preferences
    const prefs = Array.from(selected);
    localStorage.setItem("wk_preferences", JSON.stringify(prefs));

    // Fetch 3 recommended spots
    const catMap: Record<string, string> = { cafe: "cafe", restaurant: "restaurant", culture: "culture", nightlife: "club" };
    const dbCats = prefs.map(p => catMap[p] || p);
    let query = supabase.from("places").select("id, name, category, image_url, rating").limit(3);
    if (dbCats.length > 0) {
      query = query.or(dbCats.map(c => `category.ilike.%${c}%`).join(","));
    }
    query = query.order("rating", { ascending: false });
    const { data } = await query;
    if (data) setSpots(data as SpotPreview[]);
    setStep(2);
  };

  const finish = (abandoned: boolean = false) => {
    if (abandoned) {
      logEvent("onboarding_abandoned");
    } else {
      logEvent("onboarding_completed");
    }
    localStorage.setItem("wk_welcome_seen", "1");
    onComplete(null);

    // Nudge toast after 3s
    if (!abandoned) {
      setTimeout(() => {
        toast("📍 Clique sur un spot pour voir l'offre VIP", {
          duration: 4000,
          style: {
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          },
        });
      }, 3000);
    }
  };

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[4000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-[var(--border-default)] shadow-2xl bg-[var(--bg-primary)]"
      >
        {/* Close X */}
        <button onClick={() => finish(true)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[rgba(248,238,224,0.07)] border border-[var(--border-subtle)] flex items-center justify-center">
          <X className="w-4 h-4 text-[var(--text-muted)]" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-5 pb-2">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-[var(--ochre)]" : i < step ? "w-1.5 bg-[var(--ochre)]/50" : "w-1.5 bg-[var(--text-muted)]/30"}`} />
          ))}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* ── ÉCRAN 1: Bienvenue ── */}
            {step === 0 && (
              <motion.div key="welcome" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col items-center text-center space-y-5">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }} className="text-5xl">🌙</motion.div>
                <div>
                  <h2 className="font-display text-2xl font-black tracking-tight text-[var(--text-primary)]">Marrakech comme les locaux</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-2">500 adresses vérifiées, zéro tourist trap.</p>
                </div>
                <button onClick={goToStep2}
                  className="w-full py-3.5 rounded-xl font-black uppercase text-sm text-[#0E0904] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform" style={{ background: "#D4921E" }}>
                  Commencer <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ── ÉCRAN 2: Préférences ── */}
            {step === 1 && (
              <motion.div key="prefs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                <div className="text-center">
                  <h2 className="font-display text-xl font-black text-[var(--text-primary)]">Tu es plutôt ?</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Sélectionne ce qui t'intéresse</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {INTERESTS.map(item => {
                    const active = selected.has(item.key);
                    return (
                      <motion.button key={item.key} whileTap={{ scale: 0.95 }}
                        onClick={() => { toggle(item.key); try { navigator.vibrate?.(5); } catch {} }}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${active ? "border-[var(--ochre)] bg-[var(--ochre)]/10" : "border-[var(--border-default)] bg-[var(--bg-card)]"}`}>
                        <span className="text-2xl">{item.emoji}</span>
                        <span className={`text-sm font-semibold ${active ? "text-[var(--ochre)]" : "text-[var(--text-primary)]"}`}>{item.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
                <button onClick={goToStep3}
                  className="w-full py-3.5 rounded-xl font-black uppercase text-sm text-[#0E0904] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform" style={{ background: "#D4921E" }}>
                  Continuer <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={goToStep3} className="w-full text-xs text-[var(--text-muted)] text-center py-1">Passer</button>
              </motion.div>
            )}

            {/* ── ÉCRAN 3: Spots recommandés ── */}
            {step === 2 && (
              <motion.div key="ready" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                <div className="text-center">
                  <span className="text-3xl">🎉</span>
                  <h2 className="font-display text-xl font-black text-[var(--text-primary)] mt-2">Ton feed est prêt</h2>
                </div>

                {spots.length > 0 && (
                  <div className="space-y-2">
                    {spots.map((s, i) => (
                      <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="flex gap-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-2.5">
                        {s.image_url ? (
                          <img src={s.image_url} alt={s.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-[var(--ochre)]/40" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="text-sm font-bold text-[var(--text-primary)] truncate">{s.name}</p>
                          <div className="flex items-center gap-2">
                            {s.category && <span className="text-[10px] text-[var(--ochre)] uppercase">{s.category}</span>}
                            {s.rating && <span className="flex items-center gap-0.5 text-[10px] text-[var(--ochre-light)]"><Star className="w-2.5 h-2.5 fill-[var(--ochre-light)]" /> {s.rating}</span>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <button onClick={() => finish(false)}
                  className="w-full py-3.5 rounded-xl font-black uppercase text-sm text-[#0E0904] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform" style={{ background: "#D4921E" }}>
                  Explorer Marrakech →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
