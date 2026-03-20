import { motion } from "framer-motion";

interface HotRankingBarProps {
  topPlaces: { name: string; score: number }[];
  onPlaceClick: (name: string) => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function HotRankingBar({ topPlaces, onPlaceClick }: HotRankingBarProps) {
  if (topPlaces.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="absolute bottom-16 left-3 right-3 z-[50]"
    >
      <div className="bg-card/95 backdrop-blur-xl border border-gold/20 rounded-2xl px-3 py-2.5 shadow-xl flex items-center gap-1 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold text-gold shrink-0 mr-1">TOP</span>
        {topPlaces.slice(0, 3).map((place, i) => (
          <button
            key={place.name}
            onClick={() => onPlaceClick(place.name)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/10 hover:bg-gold/20 transition-colors shrink-0 active:scale-95"
          >
            <span className="text-xs">{MEDALS[i]}</span>
            <span className="text-[10px] font-semibold text-foreground truncate max-w-[80px]">{place.name}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
