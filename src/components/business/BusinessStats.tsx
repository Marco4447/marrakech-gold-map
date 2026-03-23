import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, Eye, TrendingUp, MapPin } from "lucide-react";

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
  { label: "Insiders actifs", target: 3000, icon: Users, suffix: "+" },
  { label: "Vues / semaine", target: 15000, icon: Eye, suffix: "+" },
  { label: "Hausse fréquentation", target: 40, icon: TrendingUp, suffix: "%" },
  { label: "Spots partenaires", target: 25, icon: MapPin, suffix: "" },
];

export default function BusinessStats() {
  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto">
        <div className="grid grid-cols-4 gap-2">
          {stats.map(({ label, target, icon: Icon, suffix }, i) => {
            const { value, ref } = useCountUp(target);
            return (
              <motion.div
                key={label}
                ref={ref}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center space-y-1 py-3"
              >
                <Icon className="w-4 h-4 text-gold mx-auto" />
                <p className="text-lg font-display font-black text-foreground tabular-nums">
                  {value.toLocaleString("fr-FR")}{suffix}
                </p>
                <p className="text-2xs uppercase tracking-widest text-muted-foreground font-medium leading-tight">
                  {label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
