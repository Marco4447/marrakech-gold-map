import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function BusinessHero({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section className="relative overflow-hidden pt-10 pb-14 px-5">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gold/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gold/4 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative max-w-lg mx-auto space-y-6"
      >
        {/* Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Application #1 — Marrakech Nightlife
          </span>
        </div>

        {/* Problem → Solution */}
        <div className="text-center space-y-4">
          <h1 className="font-display text-[28px] md:text-4xl font-bold text-foreground leading-[1.15]">
            Vos tables sont vides <br />
            <span className="text-gold">en semaine ?</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            WeshKech envoie des clients qualifiés directement dans votre établissement.
            <span className="text-foreground font-medium"> 3 000+ insiders</span> cherchent où sortir ce soir — soyez leur réponse.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCtaClick}
            className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm text-primary-foreground shadow-lg shadow-gold/25 transition-all hover:shadow-gold/35"
            style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
          >
            Essayer gratuitement
            <ArrowRight className="w-4 h-4" />
          </motion.button>
          <p className="text-xs text-gold/80 font-medium">🎁 15 crédits de visibilité offerts · Sans engagement</p>
        </div>

        {/* Mini social proof */}
        <div className="flex items-center justify-center gap-5 pt-2">
          {[
            { img: "/images/kabana-logo.png", name: "Kabana" },
            { img: "/images/theatro-logo.png", name: "Theatro" },
            { img: "/images/coco-logo.png", name: "Coco" },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-1.5 opacity-60">
              <img src={p.img} alt={p.name} className="w-6 h-6 rounded-full object-cover bg-card border border-border" 
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span className="text-2xs text-muted-foreground font-medium">{p.name}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
