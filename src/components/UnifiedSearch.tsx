import { useState, useRef } from "react";
import { Search, X, MapPin, User, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

interface SearchResult {
  type: "place" | "user";
  id: string;
  name: string;
  subtitle?: string;
  imageUrl?: string | null;
  latitude?: number;
  longitude?: number;
  isVip?: boolean;
}

interface UnifiedSearchProps {
  onSelectPlace?: (lat: number, lng: number, placeId?: string) => void;
  onSelectUser?: (userId: string) => void;
}

export default function UnifiedSearch({ onSelectPlace, onSelectUser }: UnifiedSearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const [placesRes, usersRes] = await Promise.all([
        supabase
          .from("places")
          .select("id, name, category, neighborhood, image_url, latitude, longitude")
          .or(`name.ilike.%${q}%,category.ilike.%${q}%,neighborhood.ilike.%${q}%`)
          .limit(5),
        supabase
          .from("profiles_public" as any)
          .select("user_id, full_name, avatar_url, is_vip")
          .ilike("full_name", `%${q}%`)
          .limit(5),
      ]);

      const placeResults: SearchResult[] = (placesRes.data || []).map((p: any) => ({
        type: "place" as const,
        id: p.id,
        name: p.name,
        subtitle: [p.category, p.neighborhood].filter(Boolean).join(" · "),
        imageUrl: p.image_url,
        latitude: p.latitude,
        longitude: p.longitude,
      }));

      const userResults: SearchResult[] = (usersRes.data || [])
        .filter((u: any) => u.user_id !== user?.id)
        .map((u: any) => ({
          type: "user" as const,
          id: u.user_id,
          name: u.full_name || "Utilisateur",
          imageUrl: u.avatar_url,
          isVip: u.is_vip,
        }));

      setResults([...placeResults, ...userResults]);
      setLoading(false);
    }, 250);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
    if (result.type === "place" && result.latitude && result.longitude) {
      onSelectPlace?.(result.latitude, result.longitude);
    } else if (result.type === "user") {
      onSelectUser?.(result.id);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Rechercher lieux, personnes…"
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/40 transition-colors"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }} className="absolute right-3">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {focused && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-1.5 left-0 right-0 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-[2000] max-h-[50dvh] overflow-y-auto"
          >
            {results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onMouseDown={() => handleSelect(r)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors border-b border-border last:border-0"
              >
                {r.type === "place" ? (
                  <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-gold" />
                  </div>
                ) : (
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarImage src={r.imageUrl || undefined} />
                    <AvatarFallback className="bg-gold/10 text-gold text-xs">
                      {r.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                    {r.name}
                    {r.isVip && <Crown className="w-3 h-3 text-gold" />}
                  </p>
                  {r.subtitle && (
                    <p className="text-[10px] text-muted-foreground truncate">{r.subtitle}</p>
                  )}
                  <p className="text-[9px] text-muted-foreground/70 uppercase tracking-wider">
                    {r.type === "place" ? "Lieu" : "Utilisateur"}
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
