import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import PlaceSheet from "./PlaceSheet";
import { Plus, Minus, LocateFixed, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MARRAKECH_CENTER: [number, number] = [31.6295, -7.9811];
const SIX_HOURS = 6 * 60 * 60 * 1000;

interface VibePin {
  id: string;
  image_url: string;
  mood: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  location: string | null;
  media_type?: string;
  is_official?: boolean;
}

const MOOD_COLORS: Record<string, string> = {
  hot: "hsl(15,80%,50%)",
  chill: "hsl(200,60%,50%)",
  secret: "hsl(280,60%,55%)",
  deal: "hsl(43,76%,52%)",
};

const MOOD_EMOJIS: Record<string, string> = {
  hot: "🔥",
  chill: "🍸",
  secret: "✨",
  deal: "🎁",
};

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  Food: { emoji: "🍽️", color: "hsl(25,90%,55%)" },
  Rooftop: { emoji: "🌅", color: "hsl(43,56%,52%)" },
  Night: { emoji: "🎶", color: "hsl(280,60%,60%)" },
  Hôtel: { emoji: "🏨", color: "hsl(200,70%,55%)" },
  Secret: { emoji: "✨", color: "hsl(340,65%,55%)" },
};

const MOOD_FILTERS: { key: string; emoji: string; label: string; categories: string[] }[] = [
  { key: "hot", emoji: "🔥", label: "Hot Now", categories: [] },
  { key: "offers", emoji: "✨", label: "Offres Insider", categories: [] },
  { key: "party", emoji: "💃", label: "Party", categories: ["Night"] },
  { key: "chill", emoji: "🍸", label: "Chill", categories: ["Rooftop", "Hôtel"] },
];

const DEFAULT_CAT = { emoji: "📍", color: "hsl(43,56%,52%)" };

const createCategoryIcon = (category: string | null, options: { trending?: boolean; isPartner?: boolean; hasOffer?: boolean } = {}) => {
  const cat = CATEGORY_CONFIG[category || ""] || DEFAULT_CAT;
  const { trending = false, isPartner = false, hasOffer = false } = options;
  const size = isPartner ? 46 : trending ? 46 : 36;
  const emojiSize = isPartner ? 20 : trending ? 20 : 16;

  const borderColor = isPartner ? "hsl(43,76%,52%)" : cat.color;
  const borderWidth = isPartner ? "3.5px" : "2.5px";
  const glow = isPartner
    ? "0 0 16px hsl(43,76%,52%,0.6), 0 0 4px hsl(43,76%,52%,0.3)"
    : `0 2px ${trending ? 16 : 8}px ${cat.color.replace(")", ",0.4)")}`;

  const partnerBadge = isPartner
    ? `<div style="position:absolute;top:-8px;right:-8px;width:20px;height:20px;border-radius:50%;background:hsl(43,76%,52%);display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 6px hsl(43,76%,52%,0.5)">${hasOffer ? "🎁" : "⭐"}</div>`
    : "";

  const trendingBadge = trending && !isPartner
    ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:hsl(43,56%,52%);color:hsl(30,20%,95%);font-size:8px;font-weight:800;padding:1px 5px;border-radius:4px;white-space:nowrap;letter-spacing:0.05em">TRENDING</div>`
    : "";

  return L.divIcon({
    className: trending ? "trending-marker" : isPartner ? "gold-marker" : "",
    html: `
      <div class="category-marker" style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:hsl(30,20%,95%);
        border:${borderWidth} solid ${borderColor};
        box-shadow:${glow};
        display:flex;align-items:center;justify-content:center;
        position:relative;
      ">
        <span style="font-size:${emojiSize}px;line-height:1">${cat.emoji}</span>
        ${partnerBadge}
        ${trendingBadge}
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
  is_partner: boolean;
  has_active_offer: boolean;
}

interface BubbleItem {
  emoji: string;
  tag: string;
  text: string;
  place?: Place;
}

function FloatingBubble({ places, bubbleIndex, setBubbleIndex, onPlaceClick }: {
  places: Place[];
  bubbleIndex: number;
  setBubbleIndex: (fn: (n: number) => number) => void;
  onPlaceClick: (p: Place) => void;
}) {
  const items: BubbleItem[] = [];

  // Hot Now - most popular partner
  const hotPlace = places.find(p => p.is_partner && p.has_active_offer);
  if (hotPlace) {
    items.push({ emoji: "🔥", tag: "HOT NOW", text: `${hotPlace.name} — Offre exclusive en cours !`, place: hotPlace });
  }

  // Partner ad
  const partnerAd = places.find(p => p.is_partner && p !== hotPlace);
  if (partnerAd) {
    items.push({ emoji: "⭐", tag: "PARTENAIRE", text: `Découvrez ${partnerAd.name}`, place: partnerAd });
  }

  // Tip
  items.push({ emoji: "🌅", tag: "TIP", text: "Coucher de soleil à 18h42 — direction Kabana Rooftop !" });

  // Partner with offer
  const offerPlace = places.find(p => p.has_active_offer && p !== hotPlace);
  if (offerPlace) {
    items.push({ emoji: "🎁", tag: "DEAL", text: `Pass Invité chez ${offerPlace.name}`, place: offerPlace });
  }

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setBubbleIndex(i => (i + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  const current = items[bubbleIndex % items.length];
  if (!current) return null;

  return (
    <div className="absolute bottom-44 left-4 right-16 z-[1000]">
      <AnimatePresence mode="wait">
        <motion.button
          key={bubbleIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          onClick={() => current.place && onPlaceClick(current.place)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-[hsl(30,15%,95%,0.95)] backdrop-blur-xl border border-[hsl(30,15%,80%)] shadow-lg text-left"
        >
          <span className="text-lg flex-shrink-0">{current.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-gold-dark font-bold uppercase tracking-wider">{current.tag}</p>
            <p className="text-[11px] text-[hsl(30,20%,25%)] font-medium truncate">{current.text}</p>
          </div>
          {current.place && <ChevronRight className="w-3.5 h-3.5 text-gold-dark flex-shrink-0" />}
          {/* Progress dots */}
          <div className="flex gap-1 flex-shrink-0">
            {items.map((_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full transition-colors ${i === bubbleIndex % items.length ? "bg-gold-dark" : "bg-[hsl(30,15%,75%)]"}`} />
            ))}
          </div>
        </motion.button>
      </AnimatePresence>
    </div>
  );
}

function CollapsibleLegend({ categories }: { categories: [string, { emoji: string; color: string }][] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute bottom-24 left-4 z-[1000]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-[hsl(30,15%,95%,0.95)] backdrop-blur-xl border border-[hsl(30,15%,80%)] rounded-xl px-3 py-2 shadow-lg text-left"
      >
        <p className="text-[9px] text-[hsl(30,10%,45%)] font-semibold uppercase tracking-wider">Légende</p>
        {open ? <ChevronDown className="w-3 h-3 text-[hsl(30,10%,45%)]" /> : <ChevronUp className="w-3 h-3 text-[hsl(30,10%,45%)]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 5, height: 0 }}
            className="mt-1 bg-[hsl(30,15%,95%,0.95)] backdrop-blur-xl border border-[hsl(30,15%,80%)] rounded-xl px-3 py-2.5 shadow-lg overflow-hidden"
          >
            <div className="flex flex-col gap-1">
              {categories.map(([key, { emoji, color }]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ border: `2px solid ${color}`, background: "hsl(30,20%,95%)" }}>{emoji}</span>
                  <span className="text-[10px] text-[hsl(30,20%,30%)]">{key}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[hsl(30,15%,85%)]">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px]" style={{ border: "3px solid hsl(43,76%,52%)", background: "hsl(30,20%,95%)" }}>⭐</span>
                <span className="text-[10px] text-gold-dark font-medium">Partenaire</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px]" style={{ border: "3px solid hsl(43,76%,52%)", background: "hsl(30,20%,95%)" }}>🎁</span>
                <span className="text-[10px] text-gold-dark font-medium">Offre active</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MapView({ refreshSignal = 0, flyToCoords }: { refreshSignal?: number; flyToCoords?: { lat: number; lng: number } | null }) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [vibePins, setVibePins] = useState<VibePin[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [trendingLocations, setTrendingLocations] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Map onboarding tooltips
  const [onboardingStep, setOnboardingStep] = useState(() => {
    return localStorage.getItem("weshkech_map_onboarding_done") ? -1 : 0;
  });

  const onboardingTips = [
    { emoji: "📍", text: "Touche un pin pour découvrir un spot ou un deal partenaire." },
    { emoji: "🔥", text: "Utilise les filtres en haut pour trier par ambiance : Hot, Chill, Party…" },
    { emoji: "📸", text: "Les vibes live apparaissent sur la carte — les photos disparaissent après 6h !" },
  ];

  const advanceOnboarding = () => {
    if (onboardingStep < onboardingTips.length - 1) {
      setOnboardingStep((s) => s + 1);
    } else {
      localStorage.setItem("weshkech_map_onboarding_done", "1");
      setOnboardingStep(-1);
    }
  };

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MARRAKECH_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    // Use CARTO Voyager with no labels, then add custom Latin-only labels via OSM France
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to coordinates when triggered from Live Stories
  useEffect(() => {
    if (flyToCoords && mapRef.current) {
      mapRef.current.flyTo([flyToCoords.lat, flyToCoords.lng], 17, { duration: 1.2 });
    }
  }, [flyToCoords]);

  // Fetch places via REST (timeout-safe) + retry when auth session changes
  useEffect(() => {
    const fetchPlaces = async () => {
      setPlacesError(null);
      setPlacesLoading(true);

      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!baseUrl || !apiKey) {
        console.error("Missing backend env vars for places fetch");
        setPlaces([]);
        setPlacesError("Configuration backend manquante pour charger la carte.");
        setPlacesLoading(false);
        return;
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${baseUrl}/rest/v1/places?select=*`, {
          method: "GET",
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`PLACES_FETCH_FAILED_${response.status}`);
        }

        const rows = await response.json();
        setPlaces(Array.isArray(rows) ? (rows as Place[]) : []);
      } catch (error) {
        console.error("Failed to fetch places via REST:", error);
        setPlaces([]);
        setPlacesError("Impossible de charger les spots pour le moment.");
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        setPlacesLoading(false);
      }
    };

    fetchPlaces();

    // Re-fetch when auth session changes (after refresh/login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchPlaces();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch trending locations + vibe pins from vibes with coordinates
  useEffect(() => {
    const fetchVibeData = async () => {
      const sixHoursAgo = new Date(Date.now() - SIX_HOURS).toISOString();
      const { data } = await supabase
        .from("vibes")
        .select("id, location, likes, super_vibes, image_url, mood, latitude, longitude, created_at, media_type, is_official")
        .gte("created_at", sixHoursAgo);
      if (data) {
        // Trending
        const scored = (data as any[])
          .filter((v) => v.location)
          .map((v) => ({ location: v.location as string, score: (v.likes || 0) + (v.super_vibes || 0) * 5 }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        setTrendingLocations(new Set(scored.map((s) => s.location.toLowerCase())));
        // Vibe pins (only those with coordinates)
        setVibePins((data as any[]).filter((v) => v.latitude && v.longitude));
      }
    };
    fetchVibeData();

    // Realtime updates
    const channel = supabase
      .channel("vibes-map")
      .on("postgres_changes", { event: "*", schema: "public", table: "vibes" }, () => {
        fetchVibeData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refreshSignal]);

  // Add place markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || places.length === 0) return;

    const markers: L.Marker[] = [];

    places.forEach((place) => {
      if (activeFilter) {
        const mood = MOOD_FILTERS.find(m => m.key === activeFilter);
        if (mood) {
          if (mood.key === "hot") {
            if (!trendingLocations.has(place.name.toLowerCase())) return;
          } else if (mood.key === "offers") {
            if (!place.is_partner || !place.has_active_offer) return;
          } else if (mood.categories.length > 0 && !mood.categories.includes(place.category || "")) {
            return;
          }
        }
      }
      const isTrending = trendingLocations.has(place.name.toLowerCase());
      const icon = createCategoryIcon(place.category, {
        trending: isTrending,
        isPartner: place.is_partner,
        hasOffer: place.has_active_offer,
      });
      const zOffset = place.is_partner ? 2000 : isTrending ? 1000 : 0;
      const marker = L.marker([place.latitude, place.longitude], { icon, zIndexOffset: zOffset })
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

  // Add vibe photo pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers: L.Marker[] = [];

    vibePins.forEach((vibe) => {
      if (!vibe.latitude || !vibe.longitude) return;
      const isOfficial = vibe.is_official === true;
      const age = Date.now() - new Date(vibe.created_at).getTime();
      const remaining = isOfficial ? 1 : Math.max(0, 1 - age / SIX_HOURS);
      const size = isOfficial ? 50 : Math.round(28 + remaining * 16);
      const borderColor = isOfficial ? "hsl(43,76%,52%)" : (MOOD_COLORS[vibe.mood || ""] || "hsl(43,56%,52%)");
      const moodEmoji = MOOD_EMOJIS[vibe.mood || ""] || "";

      const officialBadge = isOfficial
        ? `<div style="position:absolute;top:-6px;right:-6px;font-size:12px;background:hsl(43,76%,52%);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px hsl(43,76%,52%,0.5)">⭐</div>`
        : "";

      const icon = L.divIcon({
        className: isOfficial ? "gold-marker" : "",
        html: `
          <div style="
            width:${size}px;height:${size}px;border-radius:50%;
            border:${isOfficial ? "3.5px" : "3px"} solid ${borderColor};
            box-shadow:0 0 ${isOfficial ? 16 : Math.round(remaining * 12)}px ${borderColor.replace(")", isOfficial ? ",0.6)" : ",0.5)")};
            overflow:hidden;position:relative;
            background:hsl(30,20%,95%);
          ">
            <img src="${vibe.image_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
            ${moodEmoji ? `<div style="position:absolute;bottom:-4px;right:-4px;font-size:12px;background:hsl(0,0%,5%,0.7);border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center">${moodEmoji}</div>` : ""}
            ${vibe.media_type === "video" ? `<div style="position:absolute;top:-4px;left:-4px;font-size:10px;background:hsl(0,70%,50%,0.85);border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center">🎥</div>` : ""}
            ${officialBadge}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const zOffset = isOfficial ? 1500 : 500;
      const marker = L.marker([vibe.latitude, vibe.longitude], { icon, zIndexOffset: zOffset }).addTo(map);
      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [vibePins]);

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
        <div className="px-5 pt-12 pb-2 bg-gradient-to-b from-[hsl(30,15%,95%)] via-[hsl(30,15%,95%,0.85)] to-transparent">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="text-gold-dark">Wesh</span>
            <span className="text-[hsl(30,20%,20%)]">kech</span>
          </h1>
          <p className="text-[hsl(30,10%,45%)] text-xs mt-0.5">
            {placesLoading ? "Chargement des spots…" : placesError ? placesError : `Explore Marrakech · ${places.length} spots`}
          </p>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="absolute top-[88px] left-0 right-0 z-[1000] px-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveFilter(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeFilter === null
                ? "bg-gold-dark text-[hsl(30,20%,95%)] border-gold-dark shadow-sm"
                : "bg-[hsl(30,15%,95%,0.95)] backdrop-blur-xl text-[hsl(30,20%,30%)] border-[hsl(30,15%,80%)] hover:border-gold/50"
            }`}
          >
            Tous
          </button>
          {MOOD_FILTERS.map((mood) => (
            <button
              key={mood.key}
              onClick={() => setActiveFilter(activeFilter === mood.key ? null : mood.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                activeFilter === mood.key
                  ? "bg-gold-dark text-[hsl(30,20%,95%)] border-gold-dark shadow-sm"
                  : "bg-[hsl(30,15%,95%,0.95)] backdrop-blur-xl text-[hsl(30,20%,30%)] border-[hsl(30,15%,80%)] hover:border-gold/50"
              }`}
            >
              <span>{mood.emoji}</span>
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {/* Floating info bubble - rotates every 5s */}
      <FloatingBubble
        places={places}
        bubbleIndex={bubbleIndex}
        setBubbleIndex={setBubbleIndex}
        onPlaceClick={(place) => { setSelectedPlace(place); setSheetOpen(true); }}
      />

      {/* Zoom & recenter controls */}
      <div className="absolute bottom-24 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => handleZoom(1)}
          className="w-10 h-10 rounded-full bg-[hsl(30,15%,95%,0.95)] backdrop-blur-xl border border-[hsl(30,15%,80%)] flex items-center justify-center text-[hsl(30,20%,30%)] hover:border-gold/50 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-1)}
          className="w-10 h-10 rounded-full bg-[hsl(30,15%,95%,0.95)] backdrop-blur-xl border border-[hsl(30,15%,80%)] flex items-center justify-center text-[hsl(30,20%,30%)] hover:border-gold/50 transition-colors shadow-lg"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleRecenter}
          className="w-10 h-10 rounded-full bg-[hsl(30,15%,95%,0.95)] backdrop-blur-xl border border-gold-dark/40 flex items-center justify-center text-gold-dark hover:bg-gold/10 transition-colors shadow-lg"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsible Legend */}
      <CollapsibleLegend categories={categories} />

      {/* Map Onboarding Tooltips */}
      <AnimatePresence>
        {onboardingStep >= 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] flex items-end justify-center pb-28 px-4 pointer-events-none"
          >
            <motion.div
              key={onboardingStep}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="pointer-events-auto bg-card/95 backdrop-blur-xl border border-gold/30 rounded-2xl px-5 py-4 shadow-xl max-w-sm w-full"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{onboardingTips[onboardingStep].emoji}</span>
                <p className="text-sm text-foreground leading-relaxed flex-1">
                  {onboardingTips[onboardingStep].text}
                </p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-1.5">
                  {onboardingTips.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === onboardingStep ? "w-4 bg-gold" : "w-1.5 bg-foreground/20"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={advanceOnboarding}
                  className="text-xs font-bold text-primary-foreground px-4 py-1.5 rounded-lg"
                  style={{ background: "linear-gradient(to bottom right, #BF953F, #FCF6BA, #B38728)" }}
                >
                  {onboardingStep < onboardingTips.length - 1 ? "Suivant" : "C'est parti !"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PlaceSheet place={selectedPlace} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
