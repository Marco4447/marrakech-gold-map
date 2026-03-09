import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function BusinessHero({ onCtaClick }: { onCtaClick: () => void }) {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden py-16 px-5">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-lg mx-auto text-center space-y-5"
      >
        <span className="inline-block px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[11px] font-semibold uppercase tracking-widest">
          {t("biz_heroTagline")}
        </span>

        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">
          {t("biz_heroTitle2")}
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          {t("biz_heroDesc2")}
        </p>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCtaClick}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-primary-foreground shadow-lg shadow-gold/20 transition-all"
          style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
        >
          {t("biz_ctaJoin")}
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.button>

        <p className="text-xs text-gold font-medium">{t("biz_freeToStart")}</p>
      </motion.div>
    </section>
  );
}
