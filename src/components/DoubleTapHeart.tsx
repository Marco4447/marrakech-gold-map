import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface DoubleTapHeartProps {
  show: boolean;
  x?: number;
  y?: number;
}

export default function DoubleTapHeart({ show, x = 50, y = 50 }: DoubleTapHeartProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute z-50 pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
        >
          <Heart className="w-20 h-20 fill-gold text-gold drop-shadow-[0_0_30px_hsl(43,76%,52%,0.8)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
