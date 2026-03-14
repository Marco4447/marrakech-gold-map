import { motion } from "framer-motion";
import { Camera, Gift, MapPin, BarChart3, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Vibes Officielles",
    benefit: "Publiez une photo ou vidéo de votre ambiance.",
    result: "Visible 6h sur la carte live → les insiders viennent immédiatement.",
  },
  {
    icon: Gift,
    title: "Guest Pass VIP",
    benefit: "Créez des offres exclusives pour attirer de nouveaux clients.",
    result: "Thé offert, -20%, accès rooftop… convertissez la curiosité en visite.",
  },
  {
    icon: MapPin,
    title: "Fiche Établissement",
    benefit: "Page dédiée visible par tous les insiders.",
    result: "Photos, horaires, menus, avis — tout au même endroit.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analytics",
    benefit: "Suivez vos vues, check-ins et performances.",
    result: "ROI mesurable chaque semaine. Score de visibilité en temps réel.",
  },
];

export default function B2BFeatures({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-xl font-bold text-foreground">
            Ce que vous <span className="text-gold">obtenez</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Chaque fonctionnalité = plus de clients dans votre salle.
          </p>
        </div>

        <div className="space-y-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-surface p-4 space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{f.benefit}</p>
              <p className="text-[11px] text-gold font-medium">→ {f.result}</p>
            </motion.div>
          ))}
        </div>

        {/* Mid CTA */}
        <div className="text-center">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCtaClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-primary-foreground shadow-md shadow-gold/20 transition-all"
            style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
          >
            Activer mes crédits gratuits
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
