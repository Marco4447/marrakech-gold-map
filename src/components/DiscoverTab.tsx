import { toast } from "sonner";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Play, Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import UnifiedSearch from "./UnifiedSearch";
import HallOfFame from "./HallOfFame";
import { useAuth } from "@/hooks/useAuth";

const HOODS = [
  { slug: "medina", label: "Médina", emoji: "🕌" },
  { slug: "gueliz", label: "Guéliz", emoji: "🏙️" },
  { slug: "hivernage", label: "Hivernage", emoji: "🌴" },
  { slug: "palmeraie", label: "Palmeraie", emoji: "🏝️" },
];

interface ExploreVibe {
  id: string;
  image_url: string;
  insider_tip: string | null;
  location: string | null;
  likes: number;
  super_vibes: number;
  mood: string | null;
  media_type: string;
  is_official: boolean;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  place_id?: string;
}

interface PlaceMatch {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export default function DiscoverTab({ onGoToMap, onStartChat }: { onGoToMap?: (lat: number, lng: number, placeId?: string) => void; onStartChat?: (userId: string) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vibes, setVibes] = useState<ExploreVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const [placesByName, setPlacesByName] = useState<Map<string, PlaceMatch>>(new Map());
  const [placesById, setPlacesById] = useState<Map<string, PlaceMatch>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      const [vibesRes, placesRes] = await Promise.all([
        supabase
          .from("vibes")
          .select("id, image_url, location, likes, super_vibes, mood, media_type, is_official, created_at, latitude, longitude, insider_tip")
          .order("likes", { ascending: false })
          .limit(120),
        supabase
          .from("places")
          .select("id, name, latitude, longitude")
      ]);

      if (vibesRes.error || placesRes.error) { toast.error("Erreur chargement données"); return; }
      // Build place lookups (by name + by id)
      const pMapByName = new Map<string, PlaceMatch>();
      const pMapById = new Map<string, PlaceMatch>();
      if (placesRes.data) {
        for (const p of placesRes.data) {
          pMapByName.set(p.name.trim().toLowerCase(), p);
          pMapById.set(p.id, p);
        }
      }
      setPlacesByName(pMapByName);
      setPlacesById(pMapById);

      if (vibesRes.data) {
        const seen = new Set<string>();
        const unique = (vibesRes.data as ExploreVibe[]).filter((v) => {
          const key = v.location?.trim().toLowerCase();
          if (key && seen.has(key)) return false;
          if (key) seen.add(key);
          return true;
        });
        // Enrich with place_id
        const enriched = unique.map(v => {
          const key = v.location?.trim().toLowerCase();
          const match = key ? pMapByName.get(key) : undefined;
          return { ...v, place_id: match?.id };
        });
        setVibes(enriched.slice(0, 50));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleVibeClick = useCallback((vibe: ExploreVibe) => {
    try { navigator.vibrate?.(5); } catch {}
    if (vibe.place_id) {
      const matchById = placesById.get(vibe.place_id);
      if (matchById) {
        onGoToMap?.(matchById.latitude, matchById.longitude, matchById.id);
        return;
      }

      const fallbackByName = placesByName.get(vibe.location?.trim().toLowerCase() || "");
      if (fallbackByName) {
        onGoToMap?.(fallbackByName.latitude, fallbackByName.longitude, fallbackByName.id);
        return;
      }
    }

    if (vibe.latitude != null && vibe.longitude != null) {
      onGoToMap?.(vibe.latitude, vibe.longitude);
    }
  }, [onGoToMap, placesById, placesByName]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20">
      {/* Search bar — Instagram style */}
      <div className="sticky top-0 z-10 bg-background px-4 pt-12 pb-2.5">
        {searchFocused ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <UnifiedSearch
                onSelectPlace={(lat, lng, placeId) => { onGoToMap?.(lat, lng, placeId); setSearchFocused(false); }}
                onSelectUser={(userId) => { onStartChat?.(userId); setSearchFocused(false); }}
              />
            </div>
            <button
              onClick={() => setSearchFocused(false)}
              className="text-[14px] font-medium text-foreground active:opacity-60"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchFocused(true)}
            className="w-full flex items-center gap-2.5 bg-card border border-border/50 rounded-xl px-4 py-2.5"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-[15px] text-muted-foreground">Rechercher</span>
          </button>
        )}
      </div>

      {/* Neighborhood pills */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        {HOODS.map(h => (
          <button
            key={h.slug}
            onClick={() => navigate(`/quartier/${h.slug}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-semibold text-foreground whitespace-nowrap active:scale-95 transition-transform"
          >
            <span>{h.emoji}</span> {h.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div>
          {/* Skeleton pills */}
          <div className="flex gap-2 px-4 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full skeleton-shimmer" />
            ))}
          </div>
          {/* Skeleton grid */}
          <div className="grid grid-cols-3 gap-[1px] px-[1px]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square skeleton-shimmer" />
            ))}
          </div>
        </div>
      ) : vibes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center px-8">
          <Search className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Aucune vibe pour le moment</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("wk:open-flash-post"))}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-primary-foreground active:scale-[0.97] transition-transform"
            style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
          >
            Poste la première !
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[2px]">
          {vibes.map((vibe) => (
            <GridCell key={vibe.id} vibe={vibe} onVibeClick={handleVibeClick} />
          ))}
        </div>
      )}

      {/* Hall of Fame */}
      <div className="py-6">
        <HallOfFame currentUserId={user?.id} />
      </div>
    </div>
  );
}

function GridCell({ vibe, onVibeClick }: { vibe: ExploreVibe; span?: number; onVibeClick: (vibe: ExploreVibe) => void }) {
  const isVideo = vibe.media_type === "video";
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEnter = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleLeave = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <button
      onClick={() => onVibeClick(vibe)}
      className="relative aspect-square overflow-hidden bg-card block group w-full"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchStart={handleEnter}
      onTouchEnd={handleLeave}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={vibe.image_url}
          className="w-full h-full object-cover"
          muted
          playsInline
          loop
          preload="metadata"
        />
      ) : (
        <img
          src={vibe.image_url}
          alt={vibe.location || ""}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
      {isVideo && (
        <div className="absolute top-2 right-2 transition-opacity group-hover:opacity-0">
          <Play className="w-4 h-4 text-white drop-shadow-lg" fill="white" />
        </div>
      )}
      {vibe.insider_tip && (
        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-gold/80 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
        <span className="flex items-center gap-1 text-white text-sm font-bold">
          <Heart className="w-4 h-4 fill-white" /> {vibe.likes}
        </span>
      </div>
    </button>
  );
}
