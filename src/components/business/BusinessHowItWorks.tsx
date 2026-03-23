import { motion } from "framer-motion";
import { ClipboardCheck, Camera, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    num: "1",
    title: "Inscrivez-vous en 30 sec",
    desc: "Nom + WhatsApp. Notre équipe active votre compte sous 24h.",
  },
  {
    icon: Camera,
    num: "2",
    title: "Publiez votre 1ère Vibe",
    desc: "Photo ou vidéo de votre ambiance → visible 6h sur la carte live pour 3 000+ insiders.",
  },
  {
    icon: TrendingUp,
    num: "3",
    title: "Recevez des clients",
    desc: "Les insiders vous découvrent, utilisent vos offres VIP et reviennent en habitués.",
  },
];

export default function BusinessHowItWorks() {
  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-5">
        <h2 className="font-display text-xl font-bold text-foreground text-center">
          3 étapes pour remplir votre salle
        </h2>

        <div className="space-y-3">
          {steps.map(({ icon: Icon, num, title, desc }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex items-start gap-4 bg-surface border border-border rounded-2xl p-4"
            >
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full text-2xs font-bold flex items-center justify-center text-primary-foreground"
                  style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}>
                  {num}
                </span>
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
