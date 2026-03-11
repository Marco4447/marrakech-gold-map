import { Moon } from "lucide-react";

interface FilterDef {
  key: string;
  emoji: string;
  label: string;
}

const QUICK_FILTERS: FilterDef[] = [
  { key: "rooftop", emoji: "🌅", label: "Rooftops" },
  { key: "party", emoji: "💃", label: "Clubs" },
  { key: "food", emoji: "🍽️", label: "Restos" },
  { key: "attraction", emoji: "📸", label: "Attractions" },
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
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
      {/* Tonight toggle */}
      <button
        onClick={onTonightToggle}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shrink-0 ${
          tonightMode
            ? "bg-gradient-to-r from-[hsl(280,60%,50%)] to-[hsl(320,70%,50%)] text-white shadow-md shadow-[hsl(300,60%,50%,0.3)]"
            : "bg-card/90 backdrop-blur-md text-muted-foreground border border-border/60"
        }`}
      >
        <Moon className="w-3 h-3" />
        Tonight
      </button>

      {/* All filter */}
      <button
        onClick={() => onFilterChange(null)}
        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 ${
          activeFilter === null && !tonightMode
            ? "bg-gold text-primary-foreground shadow-md shadow-gold/30"
            : "bg-card/90 backdrop-blur-md text-muted-foreground border border-border/60"
        }`}
      >
        Tous
      </button>

      {/* Category filters */}
      {QUICK_FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onFilterChange(activeFilter === f.key ? null : f.key)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 ${
            activeFilter === f.key
              ? "bg-gold text-primary-foreground shadow-md shadow-gold/30"
              : "bg-card/90 backdrop-blur-md text-muted-foreground border border-border/60"
          }`}
        >
          <span className="text-xs leading-none">{f.emoji}</span>
          {f.label}
        </button>
      ))}
    </div>
  );
}
