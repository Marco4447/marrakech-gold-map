import { motion } from "framer-motion";
import { MapPin, Flame, Users, ArrowRight } from "lucide-react";

export default function B2BSolution({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] font-semibold uppercase tracking-wider">
              ✨ La solution
            </span>
          </motion.div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Instagram… mais <span className="text-gold">uniquement pour Marrakech</span>
          </h2>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            WeshKech connecte <span className="text-foreground font-medium">3 000+ insiders</span> aux meilleurs lieux de la ville en temps réel.
          </p>
        </div>

        {/* Visual cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: MapPin, label: "Carte Live", desc: "Découvrez les lieux en temps réel" },
            { icon: Flame, label: "Vibes Feed", desc: "L'ambiance du moment en photo & vidéo" },
            { icon: Users, label: "Insiders", desc: "Communauté de passionnés de Marrakech" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-3.5 rounded-2xl bg-surface border border-border space-y-2"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-gold" />
              </div>
              <p className="text-[11px] font-bold text-foreground">{item.label}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Mid-page CTA */}
        <div className="text-center">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCtaClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-primary-foreground shadow-md shadow-gold/20 transition-all"
            style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
          >
            Rejoindre le réseau
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
