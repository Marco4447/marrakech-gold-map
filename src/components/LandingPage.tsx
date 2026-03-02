import { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Camera, Gift } from "lucide-react";
import { Link } from "react-router-dom";
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

const LandingPage = forwardRef<HTMLDivElement, LandingPageProps>(({ onEnter }, ref) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [insiderCount] = useState(() => Math.floor(Math.random() * 34) + 12);

  return (
    <motion.div
      ref={ref}
      className="fixed inset-0 z-[3000] flex flex-col items-center justify-end bg-background"
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Fallback static image (shown until video loads) */}
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
        {/* Dark overlay 60% */}
        <div className="absolute inset-0 bg-background/60" />
        {/* Bottom gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6 pb-12 space-y-8">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-3"
        >
          <h1 className="font-display text-4xl font-bold text-foreground leading-tight tracking-tight drop-shadow-lg">
            Weshkech
          </h1>
          <h2 className="font-body text-lg font-light text-gold tracking-wide drop-shadow-md">
            Marrakech Live Vibes
          </h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="font-body text-sm font-light text-foreground/80 leading-relaxed pt-2 max-w-[280px]"
            style={{ textShadow: "0 1px 3px hsl(0 0% 0% / 0.5)" }}
          >
            L'énergie de Marrakech, sans filtre et en temps réel. Découvrez les spots les plus chauds du moment et profitez de vos avantages Pass Invité.
          </motion.p>

          {/* Simulated insider counter */}
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-foreground/80 font-medium">
              <span className="text-gold font-semibold">{insiderCount}</span> Insiders partagent l'ambiance en direct
            </span>
          </div>
        </motion.div>

        {/* CTA with glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <button
            onClick={onEnter}
            className="cta-shimmer relative w-full overflow-hidden bg-gold hover:bg-gold-light active:scale-[0.98] text-primary-foreground font-bold py-4 rounded-2xl transition-all duration-200 shadow-[0_8px_30px_-6px_hsl(43_76%_52%/0.4)] text-base tracking-wide"
          >
            Devenir Insider
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

        {/* Footer link */}
        <div className="text-center pt-2">
          <Link to="/business" className="text-[10px] text-muted-foreground hover:text-gold transition-colors">
            Business / Partenaires
          </Link>
        </div>
      </div>
    </motion.div>
  );
});

LandingPage.displayName = "LandingPage";

export default LandingPage;
