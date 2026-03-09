import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const resultKeys = [
  "biz_result1" as const,
  "biz_result2" as const,
  "biz_result3" as const,
  "biz_result4" as const,
];

export default function BusinessResults() {
  const { t } = useLanguage();

  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-4">
        <h2 className="font-display text-lg font-bold text-foreground text-center">
          {t("biz_resultsTitle")}
        </h2>

        <div className="bg-surface border border-gold/15 rounded-2xl p-5 space-y-3">
          {resultKeys.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
              <p className="text-sm text-foreground">{t(key)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
