import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const REACTIONS = [
  { emoji: "🔥", label: "Hot" },
  { emoji: "😍", label: "Love" },
  { emoji: "🤤", label: "Foodie" },
  { emoji: "💀", label: "Dead" },
];

interface VibeReactionsProps {
  show: boolean;
  onReact: (emoji: string) => void;
  onClose: () => void;
}

export default function VibeReactions({ show, onReact, onClose }: VibeReactionsProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 400 }}
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card/95 backdrop-blur-xl border border-border rounded-full px-2 py-1.5 shadow-xl z-50"
          onMouseLeave={onClose}
        >
          {REACTIONS.map((r, i) => (
            <motion.button
              key={r.emoji}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 500 }}
              onClick={(e) => { e.stopPropagation(); onReact(r.emoji); }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gold/10 active:scale-125 transition-all"
              title={r.label}
            >
              <span className="text-2xl">{r.emoji}</span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Floating emoji animation when reacting
export function FloatingReaction({ emoji, show }: { emoji: string | null; show: boolean }) {
  return (
    <AnimatePresence>
      {show && emoji && (
        <motion.div
          initial={{ scale: 0, y: 0, opacity: 1 }}
          animate={{ scale: [0, 1.5, 1.2], y: -80, opacity: [1, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none z-50"
        >
          <span className="text-5xl drop-shadow-lg">{emoji}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
