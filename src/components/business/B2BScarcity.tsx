import { motion } from "framer-motion";
import { Shield, Crown, Zap } from "lucide-react";

export default function B2BScarcity() {
  const spotsLeft = 37;

  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center space-y-2">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-xl md:text-2xl font-bold text-foreground"
          >
            Les <span className="text-gold">100 lieux fondateurs</span> de Marrakech
          </motion.h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Pour garantir la qualité, nous sélectionnons uniquement 100 établissements fondateurs à Marrakech.
          </p>
        </div>

        {/* Counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-surface border border-gold/20 rounded-2xl p-5 text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Places limitées</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "63%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="text-2xl font-display font-black text-gold">{spotsLeft}</span>
            <span className="text-foreground font-medium"> / 100</span> places restantes
          </p>
        </motion.div>

        {/* Founding benefits */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Shield, label: "Badge Fondateur", desc: "Exclusif & permanent" },
            { icon: Crown, label: "Visibilité prioritaire", desc: "En haut du radar" },
            { icon: Zap, label: "Featured au lancement", desc: "Page d'accueil" },
          ].map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-3 rounded-xl bg-surface-elevated border border-border space-y-1.5"
            >
              <b.icon className="w-5 h-5 text-gold mx-auto" />
              <p className="text-[11px] font-bold text-foreground leading-tight">{b.label}</p>
              <p className="text-[9px] text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
