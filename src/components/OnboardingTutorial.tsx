import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Map, Heart, Zap, ArrowRight, X, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface OnboardingTutorialProps {
  open: boolean;
  onComplete: () => void;
  onOpenFlashPost: () => void;
  onGoToTab: (tab: "map" | "live" | "profil") => void;
}

export default function OnboardingTutorial({
  open,
  onComplete,
  onOpenFlashPost,
  onGoToTab,
}: OnboardingTutorialProps) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const { t } = useLanguage();

  const STEPS = [
    {
      id: "explore",
      emoji: "🗺️",
      icon: Map,
      title: t("onboarding_exploreTitle"),
      desc: t("onboarding_exploreDesc"),
      highlight: "map",
      cta: t("onboarding_next"),
    },
    {
      id: "post",
      emoji: "📸",
      icon: Camera,
      title: t("onboarding_postTitle"),
      desc: t("onboarding_postDesc"),
      highlight: "plus",
      cta: t("onboarding_postCta"),
      action: "flash" as const,
    },
    {
      id: "engage",
      emoji: "🔥",
      icon: Heart,
      title: t("onboarding_engageTitle"),
      desc: t("onboarding_engageDesc"),
      highlight: "live",
      cta: t("onboarding_engageCta"),
      action: "live" as const,
    },
    {
      id: "rewards",
      emoji: "⚡",
      icon: Zap,
      title: t("onboarding_rewardsTitle"),
      desc: t("onboarding_rewardsDesc"),
      highlight: "profil",
      cta: t("onboarding_rewardsCta"),
      action: "complete" as const,
    },
  ];

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (current.action === "flash") {
      finishAndAct(() => onOpenFlashPost());
    } else if (current.action === "live") {
      finishAndAct(() => onGoToTab("live"));
    } else if (current.action === "complete" || isLast) {
      finishAndAct(() => {});
    } else {
      setStep((s) => s + 1);
    }
  };

  const finishAndAct = (action: () => void) => {
    setExiting(true);
    localStorage.setItem("wk_onboarding_done", "1");
    setTimeout(() => {
      onComplete();
      action();
    }, 300);
  };

  const handleSkip = () => {
    localStorage.setItem("wk_onboarding_done", "1");
    setExiting(true);
    setTimeout(onComplete, 300);
  };

  const getSpotlightStyle = (): React.CSSProperties => {
    const positions: Record<string, string> = {
      map: "25%",
      plus: "50%",
      live: "65%",
      profil: "85%",
    };
    return {
      left: positions[current.highlight] || "50%",
      transform: "translateX(-50%)",
    };
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[5000]"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          <motion.div
            key={current.highlight}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="absolute bottom-3 w-16 h-16 rounded-full"
            style={{
              ...getSpotlightStyle(),
              background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />

          <div className="absolute inset-x-0 bottom-24 flex justify-center px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-sm rounded-3xl overflow-hidden border border-primary/20 shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.3)]"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.95) 100%)",
                  backdropFilter: "blur(24px)",
                }}
              >
                <div className="h-1 w-full bg-muted">
                  <motion.div
                    className="h-full"
                    style={{ background: "linear-gradient(to right, #BF953F, #FCF6BA, #B38728)" }}
                    initial={{ width: `${(step / STEPS.length) * 100}%` }}
                    animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {STEPS.map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            i === step
                              ? "bg-primary w-6"
                              : i < step
                              ? "bg-primary/50"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleSkip}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      {t("onboarding_skip")}
                    </button>
                  </div>

                  <div className="flex items-start gap-4">
                    <motion.div
                      initial={{ rotate: -10, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                      className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))",
                        border: "1px solid hsl(var(--primary) / 0.2)",
                      }}
                    >
                      <span className="text-2xl">{current.emoji}</span>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground">
                        {current.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {current.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    className="cta-shimmer relative w-full overflow-hidden py-3.5 rounded-2xl font-bold text-primary-foreground text-sm tracking-wide transition-all active:scale-[0.98] shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.4)] flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(to bottom right, #BF953F, #FCF6BA, #B38728)",
                    }}
                  >
                    {current.cta}
                    {!isLast && !current.action && (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {(isLast || current.action === "complete") && (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
