import { motion } from "framer-motion";
import { MapPin, Camera, Gift } from "lucide-react";
import heroImage from "@/assets/marrakech-hero.jpg";

interface LandingPageProps {
  onEnter: () => void;
}

const pillars = [
  { icon: MapPin, label: "Explorez", desc: "La sélection des 30 meilleurs spots." },
  { icon: Camera, label: "Vibrez", desc: "Le flux photo live des dernières 6 heures." },
  { icon: Gift, label: "Profitez", desc: "Votre Pass Invité pour des avantages exclusifs." },
];

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[3000] flex flex-col items-center justify-end bg-background"
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Vue aérienne de Marrakech au coucher du soleil"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6 pb-12 space-y-8">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-3"
        >
          <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
            Marrakech.<br />
            <span className="text-gold">En Live. En Exclusif.</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Découvrez les spots les plus stylés, voyez l'ambiance en temps réel et accédez à des avantages réservés aux membres.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          onClick={onEnter}
          className="w-full bg-gold hover:bg-gold-light text-primary-foreground font-semibold py-4 rounded-2xl transition-colors shadow-lg shadow-gold/25 text-base"
        >
          Découvrir la ville
        </motion.button>

        {/* 3 Pillars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          {pillars.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex flex-col items-center text-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-gold" />
              </div>
              <span className="text-xs font-semibold text-foreground">{label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
