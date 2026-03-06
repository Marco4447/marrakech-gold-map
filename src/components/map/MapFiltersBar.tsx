import { motion } from "framer-motion";
import { Moon, Flame } from "lucide-react";

interface FilterDef {
  key: string;
  emoji: string;
  label: string;
}

const QUICK_FILTERS: FilterDef[] = [
  { key: "rooftop", emoji: "🌅", label: "Rooftops" },
  { key: "party", emoji: "💃", label: "Clubs" },
  { key: "food", emoji: "🍽️", label: "Restos" },
  { key: "hot", emoji: "🔥", label: "Trending" },
  { key: "offers", emoji: "✨", label: "Offres" },
  { key: "near", emoji: "📍", label: "Près de moi" },
];

interface MapFiltersBarProps {
  activeFilter: string | null;
  onFilterChange: (key: string | null) => void;
  tonightMode: boolean;
  onTonightToggle: () => void;
}

export default function MapFiltersBar({
  activeFilter,
  onFilterChange,
  tonightMode,
  onTonightToggle,
}: MapFiltersBarProps) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar">
      {/* Tonight toggle */}
      <button
        onClick={onTonightToggle}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
          tonightMode
            ? "bg-gradient-to-r from-[hsl(280,60%,50%)] to-[hsl(320,70%,50%)] text-white border-[hsl(300,60%,50%)]"
            : "bg-card/80 backdrop-blur-md text-muted-foreground border-border"
        }`}
      >
        <Moon className="w-3 h-3" />
        Tonight
      </button>

      {/* All filter */}
      <button
        onClick={() => onFilterChange(null)}
        className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all border ${
          activeFilter === null && !tonightMode
            ? "bg-gold text-primary-foreground border-gold"
            : "bg-card/80 backdrop-blur-md text-muted-foreground border-border"
        }`}
      >
        Tous
      </button>

      {/* Category filters */}
      {QUICK_FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onFilterChange(activeFilter === f.key ? null : f.key)}
          className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all border ${
            activeFilter === f.key
              ? "bg-gold text-primary-foreground border-gold"
              : "bg-card/80 backdrop-blur-md text-muted-foreground border-border"
          }`}
        >
          <span className="text-[10px]">{f.emoji}</span>
          {f.label}
        </button>
      ))}
    </div>
  );
}
