import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MapPin } from "lucide-react";

export default function B2BHero({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 px-5">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gold/4 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative max-w-lg mx-auto space-y-7"
      >
        {/* Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Plateforme #1 · Marrakech Nightlife
          </span>
        </div>

        {/* Headline */}
        <div className="text-center space-y-5">
          <h1 className="font-display text-[30px] md:text-[42px] font-bold text-foreground leading-[1.12]">
            Remplissez votre établissement avec les{" "}
            <span className="text-gold">insiders de Marrakech</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Restaurants, rooftops, bars et hôtels utilisent WeshKech pour attirer des clients{" "}
            <span className="text-foreground font-medium">en temps réel</span>.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCtaClick}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm text-primary-foreground shadow-lg shadow-gold/30 transition-all hover:shadow-gold/40"
            style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}
          >
            Activer mes crédits gratuits
            <ArrowRight className="w-4 h-4" />
          </motion.button>
          <p className="text-xs text-muted-foreground">
            Activation en 30 secondes · Sans engagement
          </p>
        </div>

        {/* Social proof logos */}
        <div className="pt-4">
          <p className="text-2xs text-muted-foreground text-center uppercase tracking-widest mb-3">
            Ils nous font confiance
          </p>
          <div className="flex items-center justify-center gap-6">
            {[
              { img: "/images/kabana-logo.png", name: "Kabana" },
              { img: "/images/theatro-logo.png", name: "Theatro" },
              { img: "/images/coco-logo.png", name: "Coco" },
              { img: "/images/mazel-logo.png", name: "Mazel" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity">
                <img src={p.img} alt={p.name} className="w-7 h-7 rounded-full object-cover bg-card border border-border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-2xs text-muted-foreground font-medium hidden sm:inline">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
