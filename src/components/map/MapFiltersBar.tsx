interface FilterDef {
  key: string;
  emoji: string;
  label: string;
}

const QUICK_FILTERS: FilterDef[] = [
  { key: "partners", emoji: "★", label: "Partenaires" },
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
            ? "bg-[#C8821E] text-[#120B05] shadow-md shadow-[#C8821E]/30"
            : "bg-card/90 backdrop-blur-md text-[rgba(245,237,216,0.6)] border border-[rgba(200,130,30,0.3)]"
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
              ? f.key === "partners"
                ? "bg-[#C44A2A] text-[#F5EDD8] font-bold shadow-md shadow-[#C44A2A]/30"
                : "bg-[#C8821E] text-[#120B05] shadow-md shadow-[#C8821E]/30"
              : "bg-card/90 backdrop-blur-md text-[rgba(245,237,216,0.6)] border border-[rgba(200,130,30,0.3)]"
          }`}
        >
          <span className="text-xs leading-none">{f.emoji}</span>
          {f.label}
        </button>
      ))}
    </div>
  );
}
