import { motion } from "framer-motion";
import { ClipboardCheck, Camera, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const steps = [
  { icon: ClipboardCheck, titleKey: "biz_step1Title" as const, descKey: "biz_step1Desc" as const },
  { icon: Camera, titleKey: "biz_step2Title" as const, descKey: "biz_step2Desc" as const },
  { icon: TrendingUp, titleKey: "biz_step3Title" as const, descKey: "biz_step3Desc" as const },
];

export default function BusinessHowItWorks() {
  const { t } = useLanguage();

  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-5">
        <h2 className="font-display text-lg font-bold text-foreground text-center">
          {t("biz_howItWorksTitle")}
        </h2>

        <div className="space-y-4">
          {steps.map(({ icon: Icon, titleKey, descKey }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex items-start gap-4"
            >
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-gold text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {i < steps.length - 1 && (
                  <div className="absolute top-11 left-1/2 -translate-x-1/2 w-px h-6 bg-gold/20" />
                )}
              </div>
              <div className="pt-1">
                <p className="text-sm font-semibold text-foreground">{t(titleKey)}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{t(descKey)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
