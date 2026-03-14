import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";

export default function B2BFinalScarcity({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-gold/25 p-6 text-center space-y-4"
          style={{ background: "linear-gradient(135deg, hsl(43 76% 52% / 0.06), hsl(43 70% 62% / 0.03))" }}
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-gold/15 flex items-center justify-center">
            <Clock className="w-6 h-6 text-gold" />
          </div>

          <h2 className="font-display text-lg font-bold text-foreground">
            Les places fondateurs se remplissent <span className="text-gold">rapidement</span>
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Chaque semaine, de nouveaux établissements rejoignent le réseau. Ne laissez pas vos concurrents prendre votre place.
          </p>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCtaClick}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-primary-foreground shadow-lg shadow-gold/25 transition-all"
            style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
          >
            Réserver ma place
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
