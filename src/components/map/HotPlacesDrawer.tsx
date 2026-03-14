import { useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Flame, ChevronUp } from "lucide-react";
import TopLivePlaces from "@/components/TopLivePlaces";

interface HotPlacesDrawerProps {
  onPlaceClick?: (name: string) => void;
  visible: boolean;
}

export default function HotPlacesDrawer({ onPlaceClick, visible }: HotPlacesDrawerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  return (
    <motion.div
      className="absolute bottom-14 left-0 right-0 z-[999]"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", damping: 20 }}
    >
      <div className="mx-2 bg-card/95 backdrop-blur-xl border border-border/60 rounded-t-2xl shadow-2xl shadow-black/30 overflow-hidden">
        {/* Handle bar */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex flex-col items-center pt-2 pb-1.5 active:opacity-70 transition-opacity"
        >
          <div className="w-8 h-1 rounded-full bg-muted-foreground/30 mb-2" />
          <div className="flex items-center gap-1.5 px-4 w-full">
            <Flame className="w-3.5 h-3.5 text-accent-warm" />
            <span className="text-[11px] font-bold text-foreground">What's Hot</span>
            <span className="text-[9px] text-muted-foreground ml-1">en ce moment</span>
            <div className="flex-1" />
            <ChevronUp className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${expanded ? "" : "rotate-180"}`} />
          </div>
        </button>

        {/* Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1">
                <TopLivePlaces onPlaceClick={onPlaceClick} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
