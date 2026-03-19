import { motion } from "framer-motion";

interface TonightModeButtonProps {
  active: boolean;
  count: number;
  onToggle: () => void;
}

export default function TonightModeButton({
  active,
  count,
  onToggle,
}: TonightModeButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`
        relative flex items-center gap-2 px-4 py-2.5 rounded-full
        backdrop-blur-xl shadow-lg transition-all duration-300
        text-sm font-semibold select-none
        ${
          active
            ? "bg-gold/15 border border-gold/60 text-gold shadow-[0_0_18px_rgba(212,175,55,0.25)]"
            : "bg-card/80 border border-border/40 text-foreground/80 hover:border-gold/30 hover:text-foreground"
        }
      `}
    >
      <span className="text-base">🔥</span>
      <span>Ce soir</span>
      {active && count > 0 && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          className="flex items-center gap-1 text-gold/90"
        >
          <span className="text-gold/40">·</span>
          <span>
            {count} spot{count > 1 ? "s" : ""}
          </span>
        </motion.span>
      )}
    </motion.button>
  );
}
