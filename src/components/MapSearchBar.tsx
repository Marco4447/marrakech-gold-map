import { useState, useRef, useMemo } from "react";
import { Search, X, MapPin } from "lucide-react";
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

const STOP_WORDS = new Set(["ou", "and", "the", "de", "du", "des", "la", "le", "les"]);

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const levenshteinDistance = (a: string, b: string) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
};

const tokenMatchScore = (token: string, text: string): number => {
  if (!token || !text) return 0;
  if (text.includes(token)) return 2;

  const words = text.split(" ").filter(Boolean);
  for (const word of words) {
    if (word.length < 3 || token.length < 3) continue;
    if (Math.abs(word.length - token.length) > 1) continue;
    if (levenshteinDistance(token, word) <= 1) return 1;
  }

  return 0;
};

export default function MapSearchBar({ places, onSelect }: MapSearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = normalizeText(query);

  const results = useMemo(() => {
    if (normalizedQuery.length < 1) return [];

    const tokens = normalizedQuery
      .split(" ")
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));

    return places
      .map((p) => {
        const name = normalizeText(p.name);
        const category = normalizeText(p.category || "");
        const neighborhood = normalizeText(p.neighborhood || "");
        const full = `${name} ${category} ${neighborhood}`.trim();

        let score = 0;
        if (name.includes(normalizedQuery)) score += 120;
        if (category.includes(normalizedQuery)) score += 80;
        if (neighborhood.includes(normalizedQuery)) score += 40;

        let tokenHits = 0;
        for (const token of tokens) {
          const inName = tokenMatchScore(token, name);
          const inCategory = tokenMatchScore(token, category);
          const inNeighborhood = tokenMatchScore(token, neighborhood);
          const best = Math.max(inName, inCategory, inNeighborhood);
          if (best > 0) {
            tokenHits += 1;
            score += (inName * 30) + (inCategory * 22) + (inNeighborhood * 14);
          }
        }

        if (tokens.length > 0) score += tokenHits * 10;

        // Keep broad fallback for short queries
        if (score === 0 && normalizedQuery.length >= 2 && full.includes(normalizedQuery)) {
          score = 15;
        }

        return { place: p, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name, "fr"))
      .slice(0, 8)
      .map((r) => r.place);
  }, [places, normalizedQuery]);

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
                onMouseDown={(e) => { e.preventDefault(); handleSelect(place); }}
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
