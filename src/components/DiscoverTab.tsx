import { useEffect, useState, useCallback } from "react";
import { Search, Play, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import UnifiedSearch from "./UnifiedSearch";

interface ExploreVibe {
  id: string;
  image_url: string;
  location: string | null;
  likes: number;
  super_vibes: number;
  mood: string | null;
  media_type: string;
  is_official: boolean;
  created_at: string;
}

export default function DiscoverTab({ onGoToMap, onStartChat }: { onGoToMap?: (lat: number, lng: number) => void; onStartChat?: (userId: string) => void }) {
  const [vibes, setVibes] = useState<ExploreVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const fetchVibes = async () => {
      const { data } = await supabase
        .from("vibes")
        .select("id, image_url, location, likes, super_vibes, mood, media_type, is_official, created_at")
        .order("likes", { ascending: false })
        .limit(120);
      if (data) {
        // Deduplicate: keep only the top vibe per location to avoid repetition
        const seen = new Set<string>();
        const unique = (data as ExploreVibe[]).filter((v) => {
          const key = v.location?.trim().toLowerCase();
          if (key && seen.has(key)) return false;
          if (key) seen.add(key);
          return true;
        });
        setVibes(unique.slice(0, 50));
      }
      setLoading(false);
    };
    fetchVibes();
  }, []);

  // Instagram Explore grid pattern: rows of 3, every 3rd row has a large item
  const renderGrid = () => {
    const cells: React.ReactNode[] = [];
    let idx = 0;
    let rowGroup = 0;

    while (idx < vibes.length) {
      const pattern = rowGroup % 2; // alternating pattern

      if (pattern === 0) {
        // 2 rows of 3 small squares
        for (let row = 0; row < 2 && idx < vibes.length; row++) {
          for (let col = 0; col < 3 && idx < vibes.length; col++) {
            const vibe = vibes[idx];
            cells.push(
              <GridCell key={vibe.id} vibe={vibe} span={1} />
            );
            idx++;
          }
        }
      } else {
        // 1 row: 2 small + 1 large (or 1 large + 2 small)
        const isLeftLarge = rowGroup % 4 === 1;
        if (isLeftLarge) {
          // 2 small stacked on left, 1 large on right
          const small1 = vibes[idx];
          const small2 = vibes[idx + 1];
          const large = vibes[idx + 2];
          if (small1) { cells.push(<GridCell key={small1.id} vibe={small1} span={1} />); idx++; }
          if (small2) { cells.push(<GridCell key={small2.id} vibe={small2} span={1} />); idx++; }
          // placeholder for grid positioning
          if (large) { cells.push(<GridCell key={large.id} vibe={large} span={1} />); idx++; }
          if (vibes[idx]) { cells.push(<GridCell key={vibes[idx].id} vibe={vibes[idx]} span={1} />); idx++; }
          if (vibes[idx]) { cells.push(<GridCell key={vibes[idx].id} vibe={vibes[idx]} span={1} />); idx++; }
          if (vibes[idx]) { cells.push(<GridCell key={vibes[idx].id} vibe={vibes[idx]} span={1} />); idx++; }
        } else {
          for (let i = 0; i < 6 && idx < vibes.length; i++) {
            cells.push(<GridCell key={vibes[idx].id} vibe={vibes[idx]} span={1} />);
            idx++;
          }
        }
      }
      rowGroup++;
    }

    return cells;
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20">
      {/* Search bar — Instagram style */}
      <div className="sticky top-0 z-10 bg-background px-4 pt-12 pb-2.5">
        {searchFocused ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <UnifiedSearch
                onSelectPlace={(lat, lng) => { onGoToMap?.(lat, lng); setSearchFocused(false); }}
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

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-[1px] px-[1px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-card animate-pulse" />
          ))}
        </div>
      ) : vibes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center px-8">
          <Search className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Aucune vibe pour le moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[2px]">
          {vibes.map((vibe) => (
            <GridCell key={vibe.id} vibe={vibe} span={1} />
          ))}
        </div>
      )}
    </div>
  );
}

function GridCell({ vibe, span }: { vibe: ExploreVibe; span: number }) {
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
    <Link
      to={`/vibe/${vibe.id}`}
      className="relative aspect-square overflow-hidden bg-card block group"
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
      {/* Video indicator */}
      {isVideo && (
        <div className="absolute top-2 right-2 transition-opacity group-hover:opacity-0">
          <Play className="w-4 h-4 text-white drop-shadow-lg" fill="white" />
        </div>
      )}
      {/* Hover overlay with stats */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
        <span className="flex items-center gap-1 text-white text-sm font-bold">
          <Heart className="w-4 h-4 fill-white" /> {vibe.likes}
        </span>
      </div>
    </Link>
  );
}
