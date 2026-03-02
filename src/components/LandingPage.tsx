import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Camera, Gift, ChevronRight, Zap, Star, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/marrakech-hero.jpg";
import ambientVideo from "@/assets/marrakech-ambiance.mp4";

interface LandingPageProps {
  onEnter: () => void;
}

const pillars = [
  { icon: MapPin, label: "Explorez", desc: "La sélection des 30 meilleurs spots." },
  { icon: Camera, label: "Vibrez", desc: "Le flux photo live des dernières 6 heures." },
  { icon: Gift, label: "Profitez", desc: "Votre Pass Invité pour des avantages exclusifs." },
];

const previewSlides = [
  {
    icon: Map,
    title: "Carte interactive",
    desc: "Découvrez les meilleurs spots de Marrakech en un coup d'œil. Pins live, deals partenaires et vibes géolocalisées.",
    emoji: "🗺️",
  },
  {
    icon: Camera,
    title: "Vibes éphémères",
    desc: "Un flux photo/vidéo en temps réel. Les posts disparaissent après 6h — que du frais, zéro filtre.",
    emoji: "📸",
  },
  {
    icon: Gift,
    title: "Pass Invité",
    desc: "Des avantages exclusifs chez nos partenaires : réductions, accès prioritaires, surprises.",
    emoji: "🎁",
  },
];

const LandingPage = forwardRef<HTMLDivElement, LandingPageProps>(({ onEnter }, ref) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [insiderCount, setInsiderCount] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => {
      setInsiderCount(count ?? 0);
    });
  }, []);

  // Auto-advance preview carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % previewSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      ref={ref}
      className="fixed inset-0 z-[3000] flex flex-col items-center justify-end bg-background overflow-y-auto"
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Fallback static image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Vue aérienne de Marrakech au coucher du soleil"
          className={`w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-0" : "opacity-100"}`}
        />
      </div>

      {/* Background video */}
      <div className="absolute inset-0">
        <video
          src={ambientVideo}
          autoPlay
          loop
          muted
          playsInline
          onCanPlayThrough={() => setVideoLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6 pb-10 space-y-6">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-2"
        >
          <h1 className="font-display text-4xl font-bold text-foreground leading-tight tracking-tight drop-shadow-lg">
            Weshkech
          </h1>
          <h2 className="font-body text-base font-light text-gold tracking-wide drop-shadow-md">
            Partagez vos spots · Découvrez en live · Profitez de deals exclusifs
          </h2>

          {/* Real-time insider counter */}
          <div className="flex items-center gap-2 pt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
            </span>
            <span className="text-xs text-foreground/80 font-medium">
              <span className="text-gold font-semibold">{insiderCount !== null ? insiderCount : "…"}</span> Insiders connectés
            </span>
          </div>
        </motion.div>

        {/* ===== PREVIEW CAROUSEL ===== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative"
        >
          <div className="bg-card/40 backdrop-blur-xl border border-gold/20 rounded-2xl p-4 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
                className="flex items-start gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/15 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{previewSlides[activeSlide].emoji}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gold">{previewSlides[activeSlide].title}</p>
                  <p className="text-xs text-foreground/70 leading-relaxed mt-0.5">
                    {previewSlides[activeSlide].desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 mt-3">
              {previewSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeSlide ? "w-5 bg-gold" : "w-1.5 bg-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <button
            onClick={onEnter}
            className="cta-shimmer relative w-full overflow-hidden bg-gold hover:bg-gold-light active:scale-[0.98] text-primary-foreground font-bold py-4 rounded-2xl transition-all duration-200 shadow-[0_8px_30px_-6px_hsl(43_76%_52%/0.4)] text-base tracking-wide flex items-center justify-center gap-2"
          >
            Devenir Insider
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* 3 Pillars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          {pillars.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center backdrop-blur-sm">
                <Icon className="w-4.5 h-4.5 text-gold" />
              </div>
              <span className="text-xs font-semibold text-foreground">{label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
            </div>
          ))}
        </motion.div>

        {/* Partner CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="text-center pt-1"
        >
          <Link
            to="/business"
            className="inline-flex items-center gap-2 text-xs text-gold/80 hover:text-gold transition-colors border border-gold/20 rounded-xl px-4 py-2 bg-gold/5"
          >
            <Gift className="w-3.5 h-3.5" />
            Vous êtes partenaire ? Inscrivez votre établissement
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
});

LandingPage.displayName = "LandingPage";

export default LandingPage;
