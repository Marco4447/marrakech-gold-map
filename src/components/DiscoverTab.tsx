import { useEffect, useState } from "react";
import { MapPin, Star, TrendingUp, Crown, Heart, Flame, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Place } from "@/types/models";
import { isBoosted } from "@/lib/boostedPlaces";
import { Link } from "react-router-dom";

interface TrendingVibe {
  id: string;
  image_url: string;
  location: string | null;
  likes: number;
  super_vibes: number;
  mood: string | null;
  is_official: boolean;
}

const MOOD_EMOJI: Record<string, string> = {
  hot: "🔥", chill: "🍸", secret: "✨", foodie: "🥗",
};

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍽️", rooftop: "🌇", club: "🎶", bar: "🍸", cafe: "☕", spa: "💆", experience: "🎭", hotel: "🏨",
};

export default function DiscoverTab({ onGoToMap }: { onGoToMap?: (lat: number, lng: number) => void }) {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [trendingVibes, setTrendingVibes] = useState<TrendingVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const [placesRes, vibesRes] = await Promise.all([
        supabase.from("places").select("*").order("name"),
        supabase.from("vibes").select("id, image_url, location, likes, super_vibes, mood, is_official").order("likes", { ascending: false }).limit(20),
      ]);
      if (placesRes.data) {
        const sorted = [...placesRes.data].sort((a, b) => {
          const aB = isBoosted(a.name);
          const bB = isBoosted(b.name);
          if (aB && !bB) return -1;
          if (!aB && bB) return 1;
          if (a.is_partner && !b.is_partner) return -1;
          if (!a.is_partner && b.is_partner) return 1;
          return 0;
        });
        setPlaces(sorted as Place[]);
      }
      if (vibesRes.data) setTrendingVibes(vibesRes.data as TrendingVibe[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const categories = [...new Set(places.map(p => p.category).filter(Boolean))] as string[];
  const filteredPlaces = selectedCategory ? places.filter(p => p.category === selectedCategory) : places;
  const partnerPlaces = filteredPlaces.filter(p => p.is_partner);
  const topPlaces = filteredPlaces.slice(0, 12);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto no-scrollbar pb-20">
        <div className="px-4 pt-14 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-card animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 pt-12 pb-3">
        <h1 className="text-xl font-bold text-foreground font-display mb-3">Discover</h1>
        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!selectedCategory ? "bg-foreground text-background" : "bg-card border border-border text-muted-foreground"}`}
          >
            Tout
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${cat === selectedCategory ? "bg-foreground text-background" : "bg-card border border-border text-muted-foreground"}`}
            >
              {CATEGORY_EMOJI[cat] || "📍"} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Vibes */}
      {trendingVibes.length > 0 && !selectedCategory && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gold" />
            <h2 className="text-sm font-semibold text-foreground">Trending Vibes</h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
            {trendingVibes.slice(0, 8).map((vibe, i) => (
              <Link
                key={vibe.id}
                to={`/vibe/${vibe.id}`}
                className="flex-shrink-0 w-[30vw] aspect-[3/4] rounded-xl overflow-hidden relative group"
              >
                <img src={vibe.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                {vibe.is_official && (
                  <div className="absolute top-2 left-2 bg-gold/90 text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded">
                    OFFICIEL
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-[10px] text-foreground truncate">{vibe.location || "Marrakech"}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Heart className="w-2.5 h-2.5 text-gold" />
                    <span className="text-[9px] text-foreground/70">{vibe.likes}</span>
                    {vibe.mood && <span className="text-[10px] ml-auto">{MOOD_EMOJI[vibe.mood] || ""}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Partner Highlights */}
      {partnerPlaces.length > 0 && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-gold" />
            <h2 className="text-sm font-semibold text-foreground">Partenaires</h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {partnerPlaces.map((place, i) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onGoToMap?.(place.latitude, place.longitude)}
                className="flex-shrink-0 w-[65vw] bg-card border border-gold/20 rounded-xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
              >
                {place.image_url && (
                  <img src={place.image_url} alt={place.name} className="w-full h-28 object-cover" loading="lazy" />
                )}
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{place.name}</p>
                    <span className="text-[8px] bg-gold/15 text-gold px-1.5 py-0.5 rounded font-bold flex-shrink-0">PARTENAIRE</span>
                  </div>
                  {place.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{place.description}</p>}
                  {place.vip_perk_description && (
                    <div className="mt-2 bg-gold/10 border border-gold/20 rounded-lg px-2.5 py-1.5">
                      <p className="text-[10px] text-gold font-semibold">🎁 VIP: {place.vip_perk_description}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Places Grid */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            {selectedCategory ? `${CATEGORY_EMOJI[selectedCategory] || ""} ${selectedCategory}` : "Tous les spots"}
          </h2>
          <span className="text-xs text-muted-foreground">({filteredPlaces.length})</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {topPlaces.map((place, i) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onGoToMap?.(place.latitude, place.longitude)}
              className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
            >
              {place.image_url ? (
                <img src={place.image_url} alt={place.name} className="w-full h-24 object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-24 bg-muted flex items-center justify-center">
                  <span className="text-2xl">{CATEGORY_EMOJI[place.category || ""] || "📍"}</span>
                </div>
              )}
              <div className="p-2.5">
                <p className="text-xs font-semibold text-foreground truncate">{place.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  {place.category && (
                    <span className="text-[10px] text-muted-foreground">{CATEGORY_EMOJI[place.category] || ""} {place.category}</span>
                  )}
                  {place.rating && (
                    <span className="text-[10px] text-gold flex items-center gap-0.5 ml-auto">
                      <Star className="w-2.5 h-2.5 fill-gold" />{place.rating}
                    </span>
                  )}
                </div>
                {place.is_partner && (
                  <span className="inline-block mt-1.5 text-[8px] bg-gold/15 text-gold px-1.5 py-0.5 rounded font-bold">PARTENAIRE</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        {filteredPlaces.length > 12 && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            {filteredPlaces.length - 12} spots supplémentaires sur la carte
          </p>
        )}
      </div>
    </div>
  );
}
