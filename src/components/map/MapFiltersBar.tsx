interface FilterDef {
  key: string;
  emoji: string;
  label: string;
}

const QUICK_FILTERS: FilterDef[] = [
  { key: "hot", emoji: "🔥", label: "Hot" },
  { key: "rooftop", emoji: "🌅", label: "Rooftops" },
  { key: "party", emoji: "💃", label: "Clubs" },
  { key: "food", emoji: "🍽️", label: "Restos" },
  { key: "cafe", emoji: "☕", label: "Cafés" },
  { key: "offers", emoji: "✨", label: "Offres" },
  { key: "near", emoji: "📍", label: "Près de moi" },
  { key: "attraction", emoji: "📸", label: "Lieux" },
];

interface MapFiltersBarProps {
  activeFilter: string | null;
  onFilterChange: (key: string | null) => void;
}

export default function MapFiltersBar({ activeFilter, onFilterChange }: MapFiltersBarProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
      <button
        onClick={() => onFilterChange(null)}
        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 ${
          activeFilter === null
            ? "bg-gold text-primary-foreground shadow-md shadow-gold/30"
            : "bg-card/90 backdrop-blur-md text-muted-foreground border border-border/60"
        }`}
      >
        Tous
      </button>
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
