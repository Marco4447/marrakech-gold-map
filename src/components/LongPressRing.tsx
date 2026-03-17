import { motion, AnimatePresence } from "framer-motion";

const R = 35;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function LongPressRing({ active, duration = 800 }: { active: boolean; duration?: number }) {
  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
          <svg width="80" height="80">
            <circle cx="40" cy="40" r={R} fill="none" stroke="hsl(var(--gold) / 0.3)" strokeWidth="3" />
            <motion.circle
              cx="40" cy="40" r={R}
              fill="none"
              stroke="hsl(var(--gold))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE}
              style={{ rotate: -90, transformOrigin: "40px 40px" }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          </svg>
          <span className="absolute text-xs text-gold font-bold">⚡</span>
        </div>
      )}
    </AnimatePresence>
  );
}
