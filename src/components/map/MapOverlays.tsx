import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, ChevronUp, X, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Place } from "@/types/models";
import { CATEGORY_CONFIG } from "./mapConstants";

interface BubbleItem {
  emoji: string;
  tag: string;
  text: string;
  place?: Place;
}

export function FloatingBubble({ places, bubbleIndex, setBubbleIndex, onPlaceClick, onDismiss }: {
  places: Place[];
  bubbleIndex: number;
  setBubbleIndex: (fn: (n: number) => number) => void;
  onPlaceClick: (p: Place) => void;
  onDismiss: () => void;
}) {
  const items: BubbleItem[] = [];

  const hotPlace = places.find(p => p.is_partner && p.has_active_offer);
  if (hotPlace) {
    items.push({ emoji: "🔥", tag: "HOT NOW", text: `${hotPlace.name} — Offre exclusive !`, place: hotPlace });
  }

  const partnerAd = places.find(p => p.is_partner && p !== hotPlace);
  if (partnerAd) {
    items.push({ emoji: "⭐", tag: "PARTENAIRE", text: `Découvrez ${partnerAd.name}`, place: partnerAd });
  }

  items.push({ emoji: "🌅", tag: "TIP", text: "Coucher de soleil — direction Kabana Rooftop !" });

  const offerPlace = places.find(p => p.has_active_offer && p !== hotPlace);
  if (offerPlace) {
    items.push({ emoji: "🎁", tag: "DEAL", text: `Offre chez ${offerPlace.name}`, place: offerPlace });
  }

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setBubbleIndex(i => (i + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  const current = items[bubbleIndex % items.length];
  if (!current) return null;

  return (
    <div className="absolute bottom-20 left-3 right-14 z-[1000]">
      <AnimatePresence mode="wait">
        <motion.div
          key={bubbleIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <button
            onClick={() => current.place && onPlaceClick(current.place)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(0,0%,10%,0.92)] backdrop-blur-xl border border-[hsl(0,0%,20%)] shadow-lg text-left"
          >
            <span className="text-base flex-shrink-0">{current.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-gold font-bold uppercase tracking-wider">{current.tag}</p>
              <p className="text-[11px] text-[hsl(30,20%,85%)] font-medium truncate">{current.text}</p>
            </div>
            {current.place && <ChevronRight className="w-3 h-3 text-gold flex-shrink-0" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[hsl(0,0%,20%)] border border-[hsl(0,0%,30%)] flex items-center justify-center"
          >
            <X className="w-3 h-3 text-[hsl(30,20%,70%)]" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function CollapsibleLegend({ categories, activeCategory, onCategoryClick }: {
  categories: [string, { emoji: string; color: string }][];
  activeCategory?: string | null;
  onCategoryClick?: (category: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute bottom-20 left-3 z-[1000]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-card/90 backdrop-blur-xl border border-border rounded-lg px-2.5 py-1.5 shadow-lg text-left"
      >
        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Légende</p>
        {open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronUp className="w-3 h-3 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 5, height: 0 }}
            className="mt-1 bg-card/90 backdrop-blur-xl border border-border rounded-xl px-3 py-2.5 shadow-lg overflow-hidden"
          >
            <div className="flex flex-col gap-0.5">
              {/* "Tous" reset button */}
              <button
                onClick={() => onCategoryClick?.(null)}
                className={`flex items-center gap-2 px-1.5 py-1 rounded-lg text-left transition-colors ${
                  !activeCategory ? "bg-gold/15" : "hover:bg-secondary/60"
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] border-2 border-gold bg-secondary">📍</span>
                <span className={`text-[10px] font-medium ${!activeCategory ? "text-gold" : "text-foreground/80"}`}>Tous</span>
              </button>

              {categories.map(([key, { emoji, color }]) => {
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => onCategoryClick?.(isActive ? null : key)}
                    className={`flex items-center gap-2 px-1.5 py-1 rounded-lg text-left transition-colors ${
                      isActive ? "bg-gold/15" : "hover:bg-secondary/60"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                      style={{ border: `2px solid ${color}`, background: isActive ? `${color}22` : "hsl(var(--secondary))" }}
                    >
                      {emoji}
                    </span>
                    <span className={`text-[10px] ${isActive ? "text-gold font-semibold" : "text-foreground/80"}`}>{key}</span>
                  </button>
                );
              })}

              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-border">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px]" style={{ border: "3px solid hsl(var(--gold))", background: "hsl(var(--secondary))" }}>⭐</span>
                <span className="text-[10px] text-gold font-medium">Partenaire</span>
              </div>
              <Link
                to="/business"
                className="flex items-center gap-2 mt-1 pt-1 border-t border-border text-[10px] text-muted-foreground hover:text-gold transition-colors"
              >
                <Building2 className="w-3 h-3" />
                Vous êtes un établissement ?
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
