import { motion } from "framer-motion";
import type { Lang } from "@/i18n/translations";
import GoAuthForm from "./GoAuthForm";

interface GoHeroProps {
  heroImage: string;
  isEvening: boolean;
  liveStats: { activeNow: number; vibesToday: number; totalPlaces: number } | undefined;
  animatedUsers: number;
  animatedPlaces: number;
  lang: Lang;
  t: (key: string) => string;
  onCtaClick: () => void;
  isInApp: boolean;
  isTikTok: boolean;
  utmSource: string;
  utmCampaign: string;
}

export default function GoHero({ heroImage, isEvening, liveStats, lang, t, isInApp, isTikTok, utmSource, utmCampaign }: GoHeroProps) {
  return (
    <header className="relative w-full min-h-[100dvh] flex items-center overflow-hidden">
      <img src={heroImage} alt="Marrakech nightlife rooftop view" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />

      {/* Live badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-background/80 backdrop-blur-md border border-border rounded-full px-3 py-1.5"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
        <span className="text-xs font-semibold text-foreground">
          {liveStats?.activeNow || "…"} {lang === "fr" ? "connectés" : "online"}
        </span>
      </motion.div>

      {/* Hero content with form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full px-5 pt-16 pb-8 max-w-md mx-auto"
      >
        <h1 className="text-[26px] sm:text-[32px] font-black leading-tight text-foreground mb-2 text-center">
          {lang === "fr"
            ? <>Les <span className="text-primary">meilleurs spots</span> de Marrakech</>
            : <>The <span className="text-primary">Best Spots</span> in Marrakech</>
          }
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 text-center max-w-xs mx-auto">
          {lang === "fr"
            ? "Rooftops, restaurants, bars, pépites cachées. Gratuit, pas de mot de passe."
            : "Rooftops, restaurants, bars, hidden gems. Free, no password needed."
          }
        </p>

        {/* AUTH FORM — directly in hero */}
        <div id="go-signup">
          <GoAuthForm
            lang={lang}
            t={t}
            isInApp={isInApp}
            isTikTok={isTikTok}
            utmSource={utmSource}
            utmCampaign={utmCampaign}
          />
        </div>

        <p className="text-2xs text-muted-foreground text-center mt-3">
          ⚡ {lang === "fr" ? "10 secondes · Gratuit · Pas d'app" : "10 seconds · Free · No app"}
        </p>
      </motion.div>
    </header>
  );
}
