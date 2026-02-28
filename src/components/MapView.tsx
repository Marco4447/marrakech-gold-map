import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import PlaceSheet from "./PlaceSheet";
import { Plus, Minus, LocateFixed } from "lucide-react";

const MARRAKECH_CENTER: [number, number] = [31.6295, -7.9811];
const SIX_HOURS = 6 * 60 * 60 * 1000;

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  Food: { emoji: "🍽️", color: "hsl(25,90%,55%)" },
  Rooftop: { emoji: "🌅", color: "hsl(43,56%,52%)" },
  Night: { emoji: "🎶", color: "hsl(280,60%,60%)" },
  Hôtel: { emoji: "🏨", color: "hsl(200,70%,55%)" },
  Secret: { emoji: "✨", color: "hsl(340,65%,55%)" },
};

const DEFAULT_CAT = { emoji: "📍", color: "hsl(43,56%,52%)" };

const createCategoryIcon = (category: string | null, trending = false) => {
  const cat = CATEGORY_CONFIG[category || ""] || DEFAULT_CAT;
  const size = trending ? 46 : 36;
  const emojiSize = trending ? 20 : 16;

  return L.divIcon({
    className: trending ? "trending-marker" : "",
    html: `
      <div class="category-marker" style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:hsl(220,18%,10%);
        border:2.5px solid ${cat.color};
        box-shadow:0 0 ${trending ? 20 : 10}px ${cat.color.replace(")", ",0.5)")};
        display:flex;align-items:center;justify-content:center;
        position:relative;
      ">
        <span style="font-size:${emojiSize}px;line-height:1">${cat.emoji}</span>
        ${trending ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:hsl(43,56%,52%);color:hsl(220,20%,6%);font-size:8px;font-weight:800;padding:1px 5px;border-radius:4px;white-space:nowrap;letter-spacing:0.05em">TRENDING</div>` : ""}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

interface Place {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  address: string | null;
  rating: number | null;
}

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [trendingLocations, setTrendingLocations] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MARRAKECH_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch places
  useEffect(() => {
    const fetchPlaces = async () => {
      const { data, error } = await supabase.from("places").select("*");
      if (!error && data) setPlaces(data);
    };
    fetchPlaces();
  }, []);

  // Fetch trending locations from top 5 vibes
  useEffect(() => {
    const fetchTrending = async () => {
      const sixHoursAgo = new Date(Date.now() - SIX_HOURS).toISOString();
      const { data } = await supabase
        .from("vibes")
        .select("location, likes, super_vibes")
        .gte("created_at", sixHoursAgo)
        .not("location", "is", null);
      if (data) {
        const scored = data
          .filter((v: any) => v.location)
          .map((v: any) => ({ location: v.location as string, score: (v.likes || 0) + (v.super_vibes || 0) * 5 }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        setTrendingLocations(new Set(scored.map((s) => s.location.toLowerCase())));
      }
    };
    fetchTrending();
  }, []);

  // Add markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || places.length === 0) return;

    const markers: L.Marker[] = [];

    places.forEach((place) => {
      if (activeFilter && place.category !== activeFilter) return;
      const isTrending = trendingLocations.has(place.name.toLowerCase());
      const icon = createCategoryIcon(place.category, isTrending);
      const marker = L.marker([place.latitude, place.longitude], { icon, zIndexOffset: isTrending ? 1000 : 0 })
        .addTo(map)
        .on("click", () => {
          setSelectedPlace(place);
          setSheetOpen(true);
        });
      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [places, trendingLocations, activeFilter]);

  const handleZoom = (delta: number) => {
    mapRef.current?.zoomIn(delta);
  };

  const handleRecenter = () => {
    mapRef.current?.flyTo(MARRAKECH_CENTER, 14, { duration: 0.8 });
  };

  const categories = Object.entries(CATEGORY_CONFIG);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full z-0" />

      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="px-5 pt-12 pb-2 bg-gradient-to-b from-background via-background/80 to-transparent">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="text-gold">Wesh</span>
            <span className="text-foreground">kech</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">Explore Marrakech · {places.length} spots</p>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="absolute top-[88px] left-0 right-0 z-[1000] px-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveFilter(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeFilter === null
                ? "bg-gold text-primary-foreground border-gold"
                : "bg-card/90 backdrop-blur-xl text-foreground/70 border-border hover:border-gold/40"
            }`}
          >
            Tous
          </button>
          {categories.map(([key, { emoji }]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(activeFilter === key ? null : key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                activeFilter === key
                  ? "bg-gold text-primary-foreground border-gold"
                  : "bg-card/90 backdrop-blur-xl text-foreground/70 border-border hover:border-gold/40"
              }`}
            >
              <span>{emoji}</span>
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Conseil du Jour */}
      <div className="absolute top-[128px] left-4 right-4 z-[1000]">
        <div className="bg-card/90 backdrop-blur-xl border border-gold/20 rounded-xl px-4 py-3 shadow-lg shadow-gold/5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🌅</span>
            <p className="text-[10px] text-gold font-semibold uppercase tracking-wider">Conseil du jour</p>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            Coucher de soleil à <span className="text-gold font-semibold">18h42</span> — le meilleur spot est le <span className="text-gold font-medium">Kabana Rooftop</span>. Réservez votre table avant 17h !
          </p>
        </div>
      </div>

      {/* Zoom & recenter controls */}
      <div className="absolute bottom-24 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => handleZoom(1)}
          className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center text-foreground hover:border-gold/40 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-1)}
          className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center text-foreground hover:border-gold/40 transition-colors shadow-lg"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleRecenter}
          className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-xl border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors shadow-lg"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-24 left-4 z-[1000]">
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-xl px-3 py-2.5 shadow-lg">
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Légende</p>
          <div className="flex flex-col gap-1">
            {categories.map(([key, { emoji, color }]) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                  style={{ border: `2px solid ${color}`, background: "hsl(220,18%,10%)" }}
                >
                  {emoji}
                </span>
                <span className="text-[10px] text-foreground/70">{key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PlaceSheet place={selectedPlace} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
