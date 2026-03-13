import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket } from "lucide-react";

const plans = [
  {
    name: "Découverte",
    price: "Gratuit",
    priceNote: "15 crédits offerts",
    icon: Zap,
    highlight: false,
    features: [
      "15 Vibes Officielles",
      "Fiche établissement complète",
      "1 offre Guest Pass VIP",
      "Visible sur la carte live",
      "Dashboard analytics basique",
    ],
    cta: "Commencer gratuitement",
  },
  {
    name: "Business",
    price: "499 MAD",
    priceNote: "/mois",
    icon: Crown,
    highlight: true,
    features: [
      "50 Vibes Officielles / mois",
      "Offres VIP illimitées",
      "Badge Certifié Premium",
      "Priorité sur le radar",
      "Analytics avancés + Visibility Score",
      "QR codes + affiches personnalisées",
      "Support WhatsApp dédié",
    ],
    cta: "Essai gratuit 30 jours",
  },
  {
    name: "Empire",
    price: "999 MAD",
    priceNote: "/mois",
    icon: Rocket,
    highlight: false,
    features: [
      "Vibes illimitées",
      "Boost automatique chaque soir",
      "Featured en page d'accueil",
      "Stories partenaire",
      "Multi-établissements",
      "Account manager dédié",
      "Tout le plan Business inclus",
    ],
    cta: "Nous contacter",
  },
];

export default function BusinessPricing({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-xl font-bold text-foreground">
            Un prix simple, des résultats réels
          </h2>
          <p className="text-xs text-muted-foreground">
            Commencez gratuitement. Upgradez quand vous voyez les résultats.
          </p>
        </div>

        <div className="space-y-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-4 border transition-all ${
                plan.highlight
                  ? "border-gold/40 bg-gold/5 shadow-lg shadow-gold/10"
                  : "border-border bg-surface"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold text-primary-foreground uppercase tracking-wider"
                  style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}>
                  Populaire
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.highlight ? "bg-gold/15" : "bg-muted"}`}>
                    <plan.icon className={`w-4 h-4 ${plan.highlight ? "text-gold" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{plan.name}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-display font-black ${plan.highlight ? "text-gold" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">{plan.priceNote}</span>
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${plan.highlight ? "text-gold" : "text-muted-foreground"}`} />
                    <span className="text-xs text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onCtaClick}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                  plan.highlight
                    ? "text-primary-foreground shadow-md shadow-gold/20"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
                style={plan.highlight ? { background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" } : undefined}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
