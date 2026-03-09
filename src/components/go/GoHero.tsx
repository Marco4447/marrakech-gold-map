import { motion } from "framer-motion";
import type { Lang } from "@/i18n/translations";

interface GoHeroProps {
  heroImage: string;
  isEvening: boolean;
  liveStats: { activeNow: number; vibesToday: number; totalPlaces: number } | undefined;
  animatedUsers: number;
  animatedPlaces: number;
  lang: Lang;
  t: (key: string) => string;
  onCtaClick: () => void;
}

export default function GoHero({ heroImage, isEvening, liveStats, lang, onCtaClick }: GoHeroProps) {
  return (
    <header className="relative w-full min-h-[75vh] flex items-end overflow-hidden">
      <img src={heroImage} alt="Marrakech nightlife rooftop view" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

      {/* Live badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full px-3 py-1.5"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
        <span className="text-[11px] font-semibold text-foreground">
          {liveStats?.activeNow || "…"} {lang === "fr" ? "connectés" : "online"}
        </span>
      </motion.div>

      {/* Hero content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full px-5 pb-8 max-w-lg mx-auto"
      >
        <h1 className="text-[28px] sm:text-[34px] font-black leading-tight text-foreground mb-3">
          {lang === "fr"
            ? <>Découvrez les <span className="text-primary">meilleurs spots</span> à Marrakech</>
            : <>Discover the <span className="text-primary">Best Spots</span> in Marrakech</>
          }
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-5 max-w-sm">
          {lang === "fr"
            ? "WeshKech vous aide à trouver les meilleurs rooftops, restaurants, bars et pépites cachées de Marrakech."
            : "WeshKech helps you find the best rooftops, restaurants, nightlife and hidden gems in Marrakech."
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button onClick={onCtaClick}
            className="flex-1 py-3.5 rounded-2xl bg-foreground text-background font-bold text-[15px] active:scale-[0.98] transition-transform shadow-lg">
            {lang === "fr" ? "Rejoindre la communauté" : "Join the Community"}
          </button>
          <button onClick={onCtaClick}
            className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] active:scale-[0.98] transition-transform">
            {lang === "fr" ? "Découvrir les spots" : "Discover Spots"}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2.5">
          {lang === "fr" ? "⚡ Gratuit · 10 secondes · Pas d'app à installer" : "⚡ Free · 10 seconds · No app to install"}
        </p>
      </motion.div>
    </header>
  );
}
