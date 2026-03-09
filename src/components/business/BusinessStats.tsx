import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, Camera, MapPin, Eye } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

const stats = [
  { key: "biz_statInsiders" as const, target: 2800, icon: Users, suffix: "+" },
  { key: "biz_statVibes" as const, target: 1200, icon: Camera, suffix: "+" },
  { key: "biz_statPartners" as const, target: 25, icon: MapPin, suffix: "" },
  { key: "biz_statViews" as const, target: 15000, icon: Eye, suffix: "+" },
];

export default function BusinessStats() {
  const { t } = useLanguage();

  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
        {stats.map(({ key, target, icon: Icon, suffix }, i) => {
          const { value, ref } = useCountUp(target);
          return (
            <motion.div
              key={key}
              ref={ref}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface border border-border rounded-2xl p-4 text-center space-y-1"
            >
              <Icon className="w-5 h-5 text-gold mx-auto" />
              <p className="text-2xl font-display font-black text-foreground tabular-nums">
                {value.toLocaleString("fr-FR")}{suffix}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                {t(key)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
