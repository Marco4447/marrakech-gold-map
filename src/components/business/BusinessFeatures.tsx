import { motion } from "framer-motion";
import { Camera, MapPin, Gift, BarChart3, Clock, Star, Zap, Users } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Vibes Officielles",
    desc: "Publiez des photos/vidéos visibles 6h sur la carte live. Badge OFFICIEL pour se démarquer.",
    highlight: "Épinglé en haut du feed",
    color: "from-amber-500/20 to-gold/5",
  },
  {
    icon: Gift,
    title: "Guest Pass VIP",
    desc: "Créez des offres exclusives (thé offert, -20%, accès rooftop) pour attirer de nouveaux clients.",
    highlight: "Génère du trafic qualifié",
    color: "from-purple-500/15 to-purple-500/5",
  },
  {
    icon: MapPin,
    title: "Fiche Établissement",
    desc: "Votre page dédiée avec photo, description, horaires, menus et avis. Visible par tous les insiders.",
    highlight: "Priorité sur la carte",
    color: "from-blue-500/15 to-blue-500/5",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analytics",
    desc: "Suivez vos vues, check-ins, rédemptions VIP et score de visibilité en temps réel.",
    highlight: "ROI mesurable",
    color: "from-green-500/15 to-green-500/5",
  },
];

const bonuses = [
  { icon: Clock, text: "Publications visibles 6h sur le radar" },
  { icon: Star, text: "Badge Certifié sur la carte" },
  { icon: Zap, text: "Boost automatique le soir" },
  { icon: Users, text: "Accès à la communauté d'insiders" },
];

export default function BusinessFeatures() {
  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-xl font-bold text-foreground">
            Ce que vous obtenez
          </h2>
          <p className="text-xs text-muted-foreground">
            Tout ce qu'il faut pour remplir votre établissement, chaque soir.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative overflow-hidden rounded-2xl border border-border p-4 bg-gradient-to-br ${f.color}`}
            >
              <div className="flex gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-gold" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  <span className="inline-block text-2xs font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full mt-1">
                    {f.highlight}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bonus strip */}
        <div className="grid grid-cols-2 gap-2">
          {bonuses.map((b, i) => (
            <motion.div
              key={b.text}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface border border-border"
            >
              <b.icon className="w-3.5 h-3.5 text-gold shrink-0" />
              <span className="text-xs text-foreground font-medium leading-tight">{b.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
