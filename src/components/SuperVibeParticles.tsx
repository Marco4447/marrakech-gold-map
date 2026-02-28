import { motion, AnimatePresence } from "framer-motion";

interface SuperVibeParticlesProps {
  active: boolean;
  onComplete?: () => void;
}

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (i * 30) * (Math.PI / 180),
  distance: 30 + Math.random() * 40,
  size: 4 + Math.random() * 6,
  delay: Math.random() * 0.15,
}));

export default function SuperVibeParticles({ active, onComplete }: SuperVibeParticlesProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {active && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: `hsl(43, ${50 + Math.random() * 30}%, ${50 + Math.random() * 20}%)`,
                boxShadow: `0 0 ${p.size * 2}px hsl(43, 56%, 52%, 0.8)`,
              }}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: [1, 1, 0],
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                scale: [1, 1.5, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: p.delay, ease: "easeOut" }}
            />
          ))}
          {/* Central flash */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 20,
              height: 20,
              background: "radial-gradient(circle, hsl(43,60%,70%) 0%, transparent 70%)",
            }}
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 3 }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
