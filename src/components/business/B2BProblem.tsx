import { motion } from "framer-motion";
import { AlertTriangle, Instagram, Search, Ghost } from "lucide-react";

const problems = [
  { icon: Instagram, text: "Les touristes découvrent Marrakech sur Instagram" },
  { icon: Search, text: "Mais Instagram mélange tout : influenceurs, pubs, faux avis" },
  { icon: Ghost, text: "Résultat : les meilleurs établissements restent invisibles" },
];

export default function B2BProblem() {
  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center space-y-2">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-semibold uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" />
              Le problème
            </span>
          </motion.div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Votre salle est vide <span className="text-gold">en semaine ?</span>
          </h2>
        </div>

        <div className="space-y-3">
          {problems.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex items-start gap-3.5 p-4 rounded-2xl bg-surface border border-border"
            >
              <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <p.icon className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-sm text-foreground leading-relaxed pt-1.5">{p.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-muted-foreground italic"
        >
          Vous méritez une vitrine dédiée, pas un algorithme générique.
        </motion.p>
      </div>
    </section>
  );
}
