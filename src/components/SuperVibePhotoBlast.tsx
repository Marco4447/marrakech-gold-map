import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  angle: (i / 20) * Math.PI * 2,
  distance: 50 + Math.random() * 80,
  size: 3 + Math.random() * 8,
  delay: Math.random() * 0.2,
  emoji: ["✨", "⚡", "🔥", "💫", "⭐"][Math.floor(Math.random() * 5)],
}));

export default function SuperVibePhotoBlast({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden rounded-inherit">
          {/* Flash overlay */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "radial-gradient(circle, hsl(var(--gold) / 0.6) 0%, transparent 70%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5 }}
          />

          {/* Particles */}
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute text-base select-none"
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: [1, 1, 0],
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                scale: [0.5, 1.5, 0],
              }}
              transition={{ duration: 0.8, delay: p.delay, ease: "easeOut" }}
            >
              {p.emoji}
            </motion.div>
          ))}

          {/* Central label */}
          <motion.div
            className="absolute flex flex-col items-center gap-1"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1, times: [0, 0.3, 0.6, 1] }}
          >
            <Zap className="w-10 h-10 fill-gold text-gold drop-shadow-[0_0_20px_hsl(43,76%,52%)]" />
            <span
              className="text-xs font-black tracking-widest uppercase text-gold"
              style={{ textShadow: "0 0 20px hsl(43,76%,52%,0.8)", letterSpacing: "0.2em" }}
            >
              Super Vibe !
            </span>
          </motion.div>

          {/* Shockwave ring */}
          <motion.div
            className="absolute rounded-full border-2 border-gold/60"
            initial={{ width: 40, height: 40, opacity: 1 }}
            animate={{ width: 200, height: 200, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
