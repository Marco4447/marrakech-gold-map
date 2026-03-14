import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star, Users, TrendingUp, Eye } from "lucide-react";

const testimonials = [
  {
    name: "Youssef",
    role: "Gérant — Coco Marrakech",
    text: "Depuis qu'on est sur WeshKech, on a vu +40% de fréquentation les soirs de semaine. Les Vibes Officielles sont un game changer.",
    stat: "+40% fréquentation",
    avatar: "/images/coco-logo.png",
  },
  {
    name: "Amine",
    role: "Directeur — Kabana Beach",
    text: "Le Guest Pass VIP nous a permis d'attirer une clientèle premium qu'on n'aurait jamais touchée autrement. ROI immédiat.",
    stat: "ROI dès le 1er mois",
    avatar: "/images/kabana-logo.png",
  },
  {
    name: "Sarah",
    role: "Marketing — Theatro",
    text: "On publie une Vibe avant chaque soirée et les réservations explosent. C'est devenu un réflexe pour notre équipe.",
    stat: "3x plus de réservations",
    avatar: "/images/theatro-logo.png",
  },
];

const metrics = [
  { icon: Users, value: "3 000+", label: "Insiders actifs" },
  { icon: TrendingUp, value: "+40%", label: "Fréquentation" },
  { icon: Eye, value: "15K+", label: "Vues / semaine" },
];

export default function B2BProof() {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === testimonials.length - 1 ? 0 : i + 1));
  const item = testimonials[idx];

  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-5">
        <h2 className="font-display text-xl font-bold text-foreground text-center">
          Ils remplissent grâce à <span className="text-gold">WeshKech</span>
        </h2>

        {/* Testimonial card */}
        <div className="relative bg-surface border border-gold/15 rounded-2xl p-5 min-h-[200px]">
          <Quote className="absolute top-4 right-4 w-6 h-6 text-gold/10" />

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed italic">"{item.text}"</p>
              <span className="inline-block text-[10px] font-bold text-gold bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-full">
                📈 {item.stat}
              </span>
              <div className="flex items-center gap-3 pt-1">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover border border-gold/30 bg-card"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div>
                  <p className="text-xs font-bold text-foreground">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button onClick={prev} className="absolute top-1/2 -translate-y-1/2 left-2 p-1.5 rounded-full bg-card/80 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-full bg-card/80 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-gold w-5" : "bg-muted-foreground/30"}`}
            />
          ))}
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-3 gap-2">
          {metrics.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center p-3 rounded-xl bg-surface-elevated border border-border">
              <Icon className="w-4 h-4 text-gold mx-auto mb-1" />
              <p className="text-lg font-display font-black text-foreground">{value}</p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
