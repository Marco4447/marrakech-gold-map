import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Place {
  id: string;
  name: string;
  category: string | null;
  latitude: number;
  longitude: number;
  neighborhood?: string | null;
}

interface MapSearchBarProps {
  places: Place[];
  onSelect: (place: Place) => void;
}

export default function MapSearchBar({ places, onSelect }: MapSearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length >= 1
    ? places.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.category?.toLowerCase().includes(q)) ||
          (p.neighborhood?.toLowerCase().includes(q))
        );
      }).slice(0, 5)
    : [];

  const showResults = focused && results.length > 0;

  const handleSelect = (place: Place) => {
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
    onSelect(place);
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 350)}
          placeholder="Rechercher…"
          className="w-full pl-7 pr-7 py-1.5 rounded-lg bg-card/90 backdrop-blur-xl border border-border text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/40 transition-colors"
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="absolute right-2.5">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1 left-0 right-0 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-[2000] max-h-[50dvh] overflow-y-auto"
          >
            {results.map((place) => (
              <button
                key={place.id}
                onMouseDown={() => handleSelect(place)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-secondary transition-colors border-b border-border last:border-0"
              >
                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{place.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {[place.category, place.neighborhood].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
