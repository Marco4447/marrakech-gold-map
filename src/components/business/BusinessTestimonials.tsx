import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const testimonials = [
  {
    nameKey: "biz_testimonial1Name" as const,
    textKey: "biz_testimonial1Text" as const,
    avatar: "/images/coco-logo.png",
  },
  {
    nameKey: "biz_testimonial2Name" as const,
    textKey: "biz_testimonial2Text" as const,
    avatar: "/images/kabana-logo.png",
  },
  {
    nameKey: "biz_testimonial3Name" as const,
    textKey: "biz_testimonial3Text" as const,
    avatar: "/images/theatro-logo.png",
  },
];

export default function BusinessTestimonials() {
  const { t } = useLanguage();
  const [idx, setIdx] = useState(0);

  const prev = () => setIdx((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  const item = testimonials[idx];

  return (
    <section className="px-5">
      <div className="max-w-lg mx-auto space-y-4">
        <h2 className="font-display text-lg font-bold text-foreground text-center">
          {t("biz_socialProofTitle")}
        </h2>

        <div className="relative bg-surface border border-gold/15 rounded-2xl p-6 min-h-[180px]">
          <Quote className="absolute top-4 right-4 w-6 h-6 text-gold/20" />

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <p className="text-sm text-foreground leading-relaxed italic">
                "{t(item.textKey)}"
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={item.avatar}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-gold/30 bg-card"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-xs text-muted-foreground font-medium">
                  {t(item.nameKey)}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          <div className="absolute top-1/2 -translate-y-1/2 left-2">
            <button onClick={prev} className="p-1 rounded-full bg-card/80 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-2">
            <button onClick={next} className="p-1 rounded-full bg-card/80 text-muted-foreground hover:text-foreground transition-colors">
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
