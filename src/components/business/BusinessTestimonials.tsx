import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Youssef — Gérant, Coco Marrakech",
    text: "Depuis qu'on est sur WeshKech, on a vu une hausse de 40% de fréquentation les soirs de semaine. Les Vibes officielles sont un game changer.",
    stat: "+40% fréquentation",
    avatar: "/images/coco-logo.png",
  },
  {
    name: "Amine — Directeur, Kabana Beach",
    text: "Le Guest Pass VIP nous a permis d'attirer une clientèle premium qu'on n'aurait jamais touchée autrement. ROI immédiat.",
    stat: "ROI dès le 1er mois",
    avatar: "/images/kabana-logo.png",
  },
  {
    name: "Sarah — Marketing, Theatro",
    text: "On publie une Vibe avant chaque soirée et les réservations explosent. C'est devenu un réflexe pour notre équipe.",
    stat: "3x plus de réservations",
    avatar: "/images/theatro-logo.png",
  },
];

export default function BusinessTestimonials() {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === testimonials.length - 1 ? 0 : i + 1));
  const item = testimonials[idx];

  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground text-center">
          Ils remplissent grâce à WeshKech
        </h2>

        <div className="relative bg-surface border border-gold/15 rounded-2xl p-5 min-h-[180px]">
          <Quote className="absolute top-4 right-4 w-6 h-6 text-gold/15" />

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-gold fill-gold" />
                ))}
              </div>

              <p className="text-sm text-foreground leading-relaxed italic">
                "{item.text}"
              </p>

              {/* Stat badge */}
              <span className="inline-block text-[10px] font-bold text-gold bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-full">
                📈 {item.stat}
              </span>

              <div className="flex items-center gap-3 pt-1">
                <img
                  src={item.avatar}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border border-gold/30 bg-card"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-xs text-muted-foreground font-medium">{item.name}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav */}
          <div className="absolute top-1/2 -translate-y-1/2 left-2">
            <button onClick={prev} className="p-1.5 rounded-full bg-card/80 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-2">
            <button onClick={next} className="p-1.5 rounded-full bg-card/80 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-gold w-4" : "bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
