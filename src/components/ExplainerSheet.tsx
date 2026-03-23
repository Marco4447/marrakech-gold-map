import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, ChevronRight, Crown, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

interface ExplainerSheetProps {
  open: boolean;
  onClose: () => void;
  initialTab?: "insider" | "partner";
  showAuthCta?: boolean;
  onEnter?: () => void;
}

const insiderPerkKeys: { icon: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: "🗺️", titleKey: "explainer_interactiveMap", descKey: "explainer_interactiveMapDesc" },
  { icon: "📸", titleKey: "explainer_ephemeralVibes", descKey: "explainer_ephemeralVibesDesc" },
  { icon: "🎁", titleKey: "explainer_guestPass", descKey: "explainer_guestPassDesc" },
  { icon: "⚡", titleKey: "explainer_liveAlerts", descKey: "explainer_liveAlertsDesc" },
  { icon: "👑", titleKey: "explainer_vipPass", descKey: "explainer_vipPassDesc" },
];

const partnerPerkKeys: { icon: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: "📍", titleKey: "explainer_bizListing", descKey: "explainer_bizListingDesc" },
  { icon: "📸", titleKey: "explainer_officialPosts", descKey: "explainer_officialPostsDesc" },
  { icon: "📊", titleKey: "explainer_analytics", descKey: "explainer_analyticsDesc" },
  { icon: "🎁", titleKey: "explainer_exclusiveOffers", descKey: "explainer_exclusiveOffersDesc" },
  { icon: "🚀", titleKey: "explainer_boost", descKey: "explainer_boostDesc" },
];

export default function ExplainerSheet({ open, onClose, initialTab = "insider", showAuthCta = false, onEnter }: ExplainerSheetProps) {
  const [tab, setTab] = useState<"insider" | "partner">(initialTab);
  const { t } = useLanguage();

  if (!open) return null;

  const perkKeys = tab === "insider" ? insiderPerkKeys : partnerPerkKeys;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-explainer flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="relative z-10 w-full max-w-md bg-card border-t border-border rounded-t-3xl max-h-[85dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <button aria-label="Fermer" onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>

            <div className="px-6 pb-8 pt-2">
              <div className="flex gap-2 mb-6">
                <button onClick={() => setTab("insider")} className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === "insider" ? "bg-gold text-primary-foreground shadow-[0_4px_20px_hsl(43,76%,52%,0.3)]" : "bg-secondary text-secondary-foreground"}`}>
                  <Crown className="w-4 h-4" /> {t("explainer_insider")}
                </button>
                <button onClick={() => setTab("partner")} className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === "partner" ? "bg-gold text-primary-foreground shadow-[0_4px_20px_hsl(43,76%,52%,0.3)]" : "bg-secondary text-secondary-foreground"}`}>
                  <BadgeCheck className="w-4 h-4" /> {t("explainer_partner")}
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, x: tab === "insider" ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: tab === "insider" ? 20 : -20 }} transition={{ duration: 0.25 }}>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-1">{tab === "insider" ? t("explainer_becomeInsider") : t("explainer_becomePartner")}</h2>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{tab === "insider" ? t("explainer_insiderDesc") : t("explainer_partnerDesc")}</p>

                  <div className="space-y-3">
                    {perkKeys.map((perk, i) => (
                      <motion.div key={perk.titleKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/50 border border-border">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-base">{perk.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{t(perk.titleKey)}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{t(perk.descKey)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    {tab === "insider" ? (
                      showAuthCta ? (
                        <button onClick={onEnter} className="w-full py-3.5 rounded-2xl bg-gold hover:bg-gold-light text-primary-foreground font-bold text-sm transition-all shadow-[0_6px_24px_hsl(43,76%,52%,0.3)] flex items-center justify-center gap-2">
                          {t("explainer_signupFree")} <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <Link to="/pricing" className="w-full py-3.5 rounded-2xl bg-gold hover:bg-gold-light text-primary-foreground font-bold text-sm transition-all shadow-[0_6px_24px_hsl(43,76%,52%,0.3)] flex items-center justify-center gap-2">
                          <Star className="w-4 h-4" /> {t("explainer_discoverPass")}
                        </Link>
                      )
                    ) : (
                      <Link to="/business" className="w-full py-3.5 rounded-2xl bg-gold hover:bg-gold-light text-primary-foreground font-bold text-sm transition-all shadow-[0_6px_24px_hsl(43,76%,52%,0.3)] flex items-center justify-center gap-2">
                        {t("explainer_registerBiz")} <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>

                  <p className="text-center text-2xs text-muted-foreground mt-4">
                    {tab === "insider" ? t("explainer_insiderTrust") : t("explainer_partnerTrust")}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
