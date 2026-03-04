import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { supabase } from "@/integrations/supabase/client";
import PlaceSheet from "./PlaceSheet";
import VibeSheet from "./VibeSheet";
import TopLivePlaces from "./TopLivePlaces";
import RecentVibesPanel from "./RecentVibesPanel";
import MapSearchBar from "./MapSearchBar";
import { LocateFixed, ChevronRight, ChevronDown, ChevronUp, Navigation, Building2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const MARRAKECH_CENTER: [number, number] = [31.6295, -7.9811];
const SIX_HOURS = 6 * 60 * 60 * 1000;
const THREE_HOURS = 3 * 60 * 60 * 1000;

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
  Nightlife: { emoji: "🎶", color: "hsl(280,60%,60%)" },
  Luxury: { emoji: "🏨", color: "hsl(200,70%,55%)" },
  Restaurant: { emoji: "🍽️", color: "hsl(25,90%,55%)" },
  Rooftop: { emoji: "🌅", color: "hsl(43,56%,52%)" },
  "Pool Party": { emoji: "🏖️", color: "hsl(190,70%,50%)" },
  "Dinner Show": { emoji: "🎭", color: "hsl(340,65%,55%)" },
  Chill: { emoji: "🍸", color: "hsl(160,50%,45%)" },
  "Cocktail Bar": { emoji: "🍹", color: "hsl(320,60%,55%)" },
  Café: { emoji: "☕", color: "hsl(30,50%,45%)" },
  Food: { emoji: "🍽️", color: "hsl(25,90%,55%)" },
  Night: { emoji: "🎶", color: "hsl(280,60%,60%)" },
  Hôtel: { emoji: "🏨", color: "hsl(200,70%,55%)" },
  Secret: { emoji: "✨", color: "hsl(340,65%,55%)" },
};

const MOOD_FILTERS: { key: string; emoji: string; label: string; categories: string[] }[] = [
  { key: "hot", emoji: "🔥", label: "Hot", categories: [] },
  { key: "offers", emoji: "✨", label: "Offres", categories: [] },
  { key: "party", emoji: "💃", label: "Party", categories: ["Nightlife", "Night", "Dinner Show"] },
  { key: "chill", emoji: "🍸", label: "Chill", categories: ["Rooftop", "Chill", "Cocktail Bar", "Café", "Hôtel"] },
  { key: "pool", emoji: "🏖️", label: "Pool", categories: ["Pool Party"] },
  { key: "food", emoji: "🍽️", label: "Food", categories: ["Restaurant", "Food"] },
];

const DEFAULT_CAT = { emoji: "📍", color: "hsl(43,56%,52%)" };

const createCategoryIcon = (category: string | null, options: { trending?: boolean; isPartner?: boolean; hasOffer?: boolean } = {}) => {
  const cat = CATEGORY_CONFIG[category || ""] || DEFAULT_CAT;
  const { trending = false, isPartner = false, hasOffer = false } = options;
  const size = isPartner ? 42 : trending ? 42 : 34;
  const emojiSize = isPartner ? 18 : trending ? 18 : 15;

  const borderColor = isPartner ? "hsl(43,76%,52%)" : cat.color;
  const borderWidth = isPartner ? "3px" : "2px";
  const glow = isPartner
    ? "0 0 12px hsl(43,76%,52%,0.5)"
    : `0 2px ${trending ? 12 : 6}px ${cat.color.replace(")", ",0.35)")}`;

  const partnerBadge = isPartner
    ? `<div style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:hsl(43,76%,52%);display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 2px 4px hsl(43,76%,52%,0.4)">${hasOffer ? "🎁" : "⭐"}</div>`
    : "";

  const trendingBadge = trending && !isPartner
    ? `<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:hsl(43,56%,52%);color:hsl(30,20%,95%);font-size:7px;font-weight:800;padding:1px 4px;border-radius:3px;white-space:nowrap;letter-spacing:0.05em">LIVE</div>`
    : "";

  return L.divIcon({
    className: trending ? "trending-marker" : isPartner ? "gold-marker" : "",
    html: `
      <div class="category-marker" style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:hsl(0,0%,8%);
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
  neighborhood: string | null;
}

interface BubbleItem {
  emoji: string;
  tag: string;
  text: string;
  place?: Place;
}

function FloatingBubble({ places, bubbleIndex, setBubbleIndex, onPlaceClick, onDismiss }: {
  places: Place[];
  bubbleIndex: number;
  setBubbleIndex: (fn: (n: number) => number) => void;
  onPlaceClick: (p: Place) => void;
  onDismiss: () => void;
}) {
  const items: BubbleItem[] = [];

  const hotPlace = places.find(p => p.is_partner && p.has_active_offer);
  if (hotPlace) {
    items.push({ emoji: "🔥", tag: "HOT NOW", text: `${hotPlace.name} — Offre exclusive !`, place: hotPlace });
  }

  const partnerAd = places.find(p => p.is_partner && p !== hotPlace);
  if (partnerAd) {
    items.push({ emoji: "⭐", tag: "PARTENAIRE", text: `Découvrez ${partnerAd.name}`, place: partnerAd });
  }

  items.push({ emoji: "🌅", tag: "TIP", text: "Coucher de soleil — direction Kabana Rooftop !" });

  const offerPlace = places.find(p => p.has_active_offer && p !== hotPlace);
  if (offerPlace) {
    items.push({ emoji: "🎁", tag: "DEAL", text: `Offre chez ${offerPlace.name}`, place: offerPlace });
  }

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setBubbleIndex(i => (i + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  const current = items[bubbleIndex % items.length];
  if (!current) return null;

  return (
    <div className="absolute bottom-20 left-3 right-14 z-[1000]">
      <AnimatePresence mode="wait">
        <motion.div
          key={bubbleIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <button
            onClick={() => current.place && onPlaceClick(current.place)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(0,0%,10%,0.92)] backdrop-blur-xl border border-[hsl(0,0%,20%)] shadow-lg text-left"
          >
            <span className="text-base flex-shrink-0">{current.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-gold font-bold uppercase tracking-wider">{current.tag}</p>
              <p className="text-[11px] text-[hsl(30,20%,85%)] font-medium truncate">{current.text}</p>
            </div>
            {current.place && <ChevronRight className="w-3 h-3 text-gold flex-shrink-0" />}
          </button>
          {/* Dismiss button */}
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[hsl(0,0%,20%)] border border-[hsl(0,0%,30%)] flex items-center justify-center"
          >
            <X className="w-3 h-3 text-[hsl(30,20%,70%)]" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CollapsibleLegend({ categories }: { categories: [string, { emoji: string; color: string }][] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute bottom-20 left-3 z-[1000]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-[hsl(0,0%,10%,0.92)] backdrop-blur-xl border border-[hsl(0,0%,20%)] rounded-lg px-2.5 py-1.5 shadow-lg text-left"
      >
        <p className="text-[9px] text-[hsl(30,10%,65%)] font-semibold uppercase tracking-wider">Légende</p>
        {open ? <ChevronDown className="w-3 h-3 text-[hsl(30,10%,65%)]" /> : <ChevronUp className="w-3 h-3 text-[hsl(30,10%,65%)]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 5, height: 0 }}
            className="mt-1 bg-[hsl(0,0%,10%,0.92)] backdrop-blur-xl border border-[hsl(0,0%,20%)] rounded-xl px-3 py-2.5 shadow-lg overflow-hidden"
          >
            <div className="flex flex-col gap-1">
              {categories.map(([key, { emoji, color }]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ border: `2px solid ${color}`, background: "hsl(0,0%,15%)" }}>{emoji}</span>
                  <span className="text-[10px] text-[hsl(30,20%,80%)]">{key}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[hsl(0,0%,25%)]">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px]" style={{ border: "3px solid hsl(43,76%,52%)", background: "hsl(0,0%,15%)" }}>⭐</span>
                <span className="text-[10px] text-gold-dark font-medium">Partenaire</span>
              </div>
              <Link
                to="/business"
                className="flex items-center gap-2 mt-1 pt-1 border-t border-[hsl(0,0%,25%)] text-[10px] text-muted-foreground hover:text-gold transition-colors"
              >
                <Building2 className="w-3 h-3" />
                Vous êtes un établissement ?
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MapView({ refreshSignal = 0, flyToCoords, deepLinkPlaceId }: { refreshSignal?: number; flyToCoords?: { lat: number; lng: number } | null; deepLinkPlaceId?: string | null }) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [vibePins, setVibePins] = useState<VibePin[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<VibePin | null>(null);
  const [vibeSheetOpen, setVibeSheetOpen] = useState(false);
  const [trendingLocations, setTrendingLocations] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(() => !!localStorage.getItem("wk_bubble_dismissed"));
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Map onboarding tooltips
  const [onboardingStep, setOnboardingStep] = useState(() => {
    return localStorage.getItem("weshkech_map_onboarding_done") ? -1 : 0;
  });

  const onboardingTips = [
    { emoji: "📍", text: "Touche un pin pour découvrir un spot." },
    { emoji: "🔥", text: "Filtre par ambiance : Hot, Chill, Party…" },
    { emoji: "📸", text: "Les vibes live apparaissent sur la carte — elles disparaissent après 6h !" },
  ];

  const advanceOnboarding = () => {
    if (onboardingStep < onboardingTips.length - 1) {
      setOnboardingStep((s) => s + 1);
    } else {
      localStorage.setItem("weshkech_map_onboarding_done", "1");
      setOnboardingStep(-1);
    }
  };

  // Delayed bubble appearance (2s after map loads)
  useEffect(() => {
    if (bubbleDismissed || onboardingStep >= 0) return;
    const timer = setTimeout(() => setShowBubble(true), 2500);
    return () => clearTimeout(timer);
  }, [bubbleDismissed, onboardingStep, placesLoading]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MARRAKECH_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    mapRef.current = map;

    // Invalidate size after mount to fix grey tiles
    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Watch user GPS position
  useEffect(() => {
    if (!navigator.geolocation) return;

    const userIcon = L.divIcon({
      className: "",
      html: '<div class="user-gps-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng(latlng);
        } else if (mapRef.current) {
          userMarkerRef.current = L.marker(latlng, { icon: userIcon, zIndexOffset: 5000 }).addTo(mapRef.current);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, []);

  // Fly to coordinates
  useEffect(() => {
    if (flyToCoords && mapRef.current) {
      mapRef.current.flyTo([flyToCoords.lat, flyToCoords.lng], 17, { duration: 1.2 });
    }
  }, [flyToCoords]);

  // Auto-open place sheet from deep link
  useEffect(() => {
    if (deepLinkPlaceId && places.length > 0) {
      const place = places.find(p => p.id === deepLinkPlaceId);
      if (place) {
        setTimeout(() => {
          setSelectedPlace(place);
          setSheetOpen(true);
        }, 1400); // wait for flyTo animation
      }
    }
  }, [deepLinkPlaceId, places]);

  // Fetch places
  useEffect(() => {
    const fetchPlaces = async () => {
      setPlacesError(null);
      setPlacesLoading(true);

      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!baseUrl || !apiKey) {
        setPlaces([]);
        setPlacesError("Configuration manquante.");
        setPlacesLoading(false);
        return;
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${baseUrl}/rest/v1/places?select=*`, {
          method: "GET",
          headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`PLACES_FETCH_FAILED_${response.status}`);
        const rows = await response.json();
        setPlaces(Array.isArray(rows) ? (rows as Place[]) : []);
      } catch (error) {
        console.error("Failed to fetch places:", error);
        setPlaces([]);
        setPlacesError("Impossible de charger les spots.");
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        setPlacesLoading(false);
      }
    };

    fetchPlaces();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchPlaces();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch trending + vibe pins
  useEffect(() => {
    const fetchVibeData = async () => {
      const { data } = await supabase
        .from("vibes")
        .select("id, location, likes, super_vibes, image_url, mood, latitude, longitude, created_at, media_type, is_official");
      if (data) {
        const scored = (data as any[])
          .filter((v) => v.location)
          .map((v) => ({ location: v.location as string, score: (v.likes || 0) + (v.super_vibes || 0) * 3 }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        setTrendingLocations(new Set(scored.map((s) => s.location.toLowerCase())));
        setVibePins((data as any[]).filter((v) => v.latitude !== null && v.longitude !== null));
      }
    };
    fetchVibeData();

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

    return () => { markers.forEach((m) => m.remove()); };
  }, [places, trendingLocations, activeFilter]);

  // Add vibe pins + real heatmap layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers: L.Marker[] = [];

    // Build heatmap data from recent vibes (last 3h for performance)
    const heatPoints: [number, number, number][] = [];
    vibePins.forEach((vibe) => {
      if (vibe.latitude == null || vibe.longitude == null) return;
      const age = Date.now() - new Date(vibe.created_at).getTime();
      if (age > THREE_HOURS && !vibe.is_official) return;
      const freshness = Math.max(0.2, 1 - age / SIX_HOURS);
      // Intensity based on freshness — newer vibes = hotter
      heatPoints.push([vibe.latitude, vibe.longitude, freshness]);
    });

    // Create leaflet.heat layer with red/orange gradient
    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      minOpacity: 0.25,
      max: 1.0,
      gradient: {
        0.0: "rgba(0,0,0,0)",
        0.2: "hsla(30, 100%, 50%, 0.3)",   // orange low
        0.4: "hsla(25, 100%, 50%, 0.5)",    // orange
        0.6: "hsla(15, 100%, 50%, 0.65)",   // red-orange
        0.8: "hsla(5, 90%, 50%, 0.8)",      // red
        1.0: "hsla(0, 100%, 55%, 0.9)",     // bright red
      },
    }).addTo(map);

    // Photo pins
    vibePins.forEach((vibe) => {
      if (vibe.latitude == null || vibe.longitude == null) return;
      const isOfficial = vibe.is_official === true;
      const age = Date.now() - new Date(vibe.created_at).getTime();
      const remaining = isOfficial ? 1 : Math.max(0, 1 - age / SIX_HOURS);
      const isHot = age < 2 * 60 * 60 * 1000;
      const size = isOfficial ? 44 : Math.round(26 + remaining * 14);
      const borderColor = isOfficial ? "hsl(43,76%,52%)" : (MOOD_COLORS[vibe.mood || ""] || "hsl(43,56%,52%)");
      const moodEmoji = MOOD_EMOJIS[vibe.mood || ""] || "";
      const pinClass = isOfficial ? "gold-marker" : isHot ? "vibe-pin-hot" : "vibe-pin-fading";

      const officialBadge = isOfficial
        ? `<div style="position:absolute;top:-5px;right:-5px;font-size:10px;background:hsl(43,76%,52%);border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px hsl(43,76%,52%,0.4)">⭐</div>`
        : "";

      const icon = L.divIcon({
        className: pinClass,
        html: `
          <div style="
            width:${size}px;height:${size}px;border-radius:50%;
            border:${isOfficial ? "3px" : "2.5px"} solid ${borderColor};
            overflow:hidden;position:relative;
            background:hsl(0,0%,8%);
          ">
            <img src="${vibe.image_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" loading="lazy" />
            ${moodEmoji ? `<div style="position:absolute;bottom:-3px;right:-3px;font-size:10px;background:hsl(0,0%,5%,0.8);border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center">${moodEmoji}</div>` : ""}
            ${vibe.media_type === "video" ? `<div style="position:absolute;top:-3px;left:-3px;font-size:9px;background:hsl(0,70%,50%,0.85);border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center">🎥</div>` : ""}
            ${officialBadge}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const zOffset = isOfficial ? 1500 : 500;
      const marker = L.marker([vibe.latitude, vibe.longitude], { icon, zIndexOffset: zOffset })
        .addTo(map)
        .on("click", () => {
          setSelectedVibe(vibe);
          setVibeSheetOpen(true);
        });
      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
      map.removeLayer(heatLayer);
    };
  }, [vibePins]);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    if (userMarkerRef.current) {
      const pos = userMarkerRef.current.getLatLng();
      mapRef.current?.flyTo([pos.lat, pos.lng], 16, { duration: 0.6 });
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 0.6 });
      },
      () => {
        if (!userMarkerRef.current) mapRef.current?.flyTo(MARRAKECH_CENTER, 14, { duration: 0.8 });
      },
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 3000 }
    );
  }, []);

  const handleRecenter = useCallback(() => {
    mapRef.current?.flyTo(MARRAKECH_CENTER, 14, { duration: 0.8 });
  }, []);

  const categories = Object.entries(CATEGORY_CONFIG);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full z-0 transition-[filter] duration-500 ease-out"
        style={{ filter: sheetOpen || vibeSheetOpen ? "blur(6px) brightness(0.7)" : "none" }}
      />

      {/* ===== UNIFIED HEADER: Logo + Search + Filters ===== */}
      <AnimatePresence>
        {!sheetOpen && !vibeSheetOpen && (
          <motion.div
            key="unified-header"
            className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="px-3 pt-10 pb-1 bg-gradient-to-b from-background via-background/90 to-transparent">
              {/* Row 1: Logo + Search */}
              <div className="flex items-center gap-2 pointer-events-auto">
                <motion.div
                  className="flex items-center gap-1.5 shrink-0"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                >
                  <img src="/logo_72.png" alt="Weshkech" className="w-6 h-6 rounded-md" />
                  <span className="font-display text-base font-bold tracking-tight">
                    <span className="text-gold">W</span>
                    <span className="text-foreground/90">K</span>
                  </span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <MapSearchBar
                    places={places}
                    onSelect={(searchPlace) => {
                      const fullPlace = places.find((p) => p.id === searchPlace.id);
                      if (fullPlace) {
                        setSelectedPlace(fullPlace);
                        setSheetOpen(true);
                        mapRef.current?.flyTo([fullPlace.latitude, fullPlace.longitude], 17, { duration: 1 });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 bg-card/60 backdrop-blur-md border border-border rounded-full px-2 py-0.5 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-foreground text-[9px] font-medium">
                    {placesLoading ? "…" : `${places.length}`}
                  </span>
                </div>
              </div>

              {/* Row 2: Filter chips — inline, compact */}
              <div className="flex gap-1 overflow-x-auto no-scrollbar mt-1.5 pointer-events-auto">
                <button
                  onClick={() => setActiveFilter(null)}
                  className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all border ${
                    activeFilter === null
                      ? "bg-gold text-primary-foreground border-gold"
                      : "bg-card/80 backdrop-blur-md text-muted-foreground border-border"
                  }`}
                >
                  Tous
                </button>
                {MOOD_FILTERS.map((mood) => (
                  <button
                    key={mood.key}
                    onClick={() => setActiveFilter(activeFilter === mood.key ? null : mood.key)}
                    className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all border ${
                      activeFilter === mood.key
                        ? "bg-gold text-primary-foreground border-gold"
                        : "bg-card/80 backdrop-blur-md text-muted-foreground border-border"
                    }`}
                  >
                    <span className="text-[10px]">{mood.emoji}</span>
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent vibes panel — animated fade in/out */}
      <AnimatePresence>
        {!sheetOpen && !vibeSheetOpen && (
          <motion.div
            key="recent-vibes-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <RecentVibesPanel
              onVibeClick={(vibe) => {
                if (navigator.vibrate) navigator.vibrate(30);
                try {
                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.type = "sine";
                  osc.frequency.setValueAtTime(880, ctx.currentTime);
                  osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.06);
                  gain.gain.setValueAtTime(0.15, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
                  osc.connect(gain).connect(ctx.destination);
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 0.12);
                } catch {}

                if (vibe.latitude && vibe.longitude && mapRef.current) {
                  mapRef.current.flyTo([vibe.latitude, vibe.longitude], 17, { duration: 1 });
                  if ((mapRef.current as any)._pulseMarker) {
                    (mapRef.current as any)._pulseMarker.remove();
                  }
                  const pulseIcon = L.divIcon({
                    className: "",
                    html: `<div style="width:48px;height:48px;position:relative;display:flex;align-items:center;justify-content:center">
                      <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,hsla(43,80%,55%,0.5),transparent 70%);animation:vibe-pulse 1.5s ease-out infinite"></div>
                      <div style="position:absolute;inset:4px;border-radius:50%;background:radial-gradient(circle,hsla(43,80%,55%,0.35),transparent 70%);animation:vibe-pulse 1.5s ease-out 0.3s infinite"></div>
                      <div style="width:14px;height:14px;border-radius:50%;background:hsl(43,80%,55%);border:2px solid white;box-shadow:0 0 12px hsla(43,80%,55%,0.8);z-index:1"></div>
                    </div>`,
                    iconSize: [48, 48],
                    iconAnchor: [24, 24],
                  });
                  const pulseMarker = L.marker([vibe.latitude, vibe.longitude], {
                    icon: pulseIcon,
                    zIndexOffset: 9000,
                  }).addTo(mapRef.current);
                  (mapRef.current as any)._pulseMarker = pulseMarker;
                  setTimeout(() => {
                    pulseMarker.remove();
                    if ((mapRef.current as any)?._pulseMarker === pulseMarker) {
                      (mapRef.current as any)._pulseMarker = null;
                    }
                  }, 5000);
                }
                setSelectedVibe(vibe as any);
                setVibeSheetOpen(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Live Places — animated fade in/out */}
      <AnimatePresence>
        {!sheetOpen && !vibeSheetOpen && (
          <motion.div
            key="top-live-places"
            className="absolute top-[100px] left-0 right-0 z-[999] px-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <TopLivePlaces
              onPlaceClick={(name) => {
                const place = places.find(p => p.name === name);
                if (place) {
                  setSelectedPlace(place);
                  setSheetOpen(true);
                  mapRef.current?.flyTo([place.latitude, place.longitude], 16, { duration: 0.8 });
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bubble — delayed + dismissible, hidden when sheet open */}
      <AnimatePresence>
        {showBubble && !bubbleDismissed && !sheetOpen && !vibeSheetOpen && (
          <motion.div
            key="floating-bubble"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <FloatingBubble
              places={places}
              bubbleIndex={bubbleIndex}
              setBubbleIndex={setBubbleIndex}
              onPlaceClick={(place) => { setSelectedPlace(place); setSheetOpen(true); }}
              onDismiss={() => {
                setBubbleDismissed(true);
                localStorage.setItem("wk_bubble_dismissed", "1");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls — 2 buttons only: GPS + Recenter */}
      <div className="absolute bottom-20 right-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleGeolocate}
          className="w-10 h-10 rounded-full bg-gold/90 backdrop-blur-xl border border-gold-dark/40 flex items-center justify-center text-primary-foreground shadow-lg active:scale-95 transition-transform"
          title="Ma position"
        >
          <Navigation className="w-4 h-4" />
        </button>
        <button
          onClick={handleRecenter}
          className="w-10 h-10 rounded-full bg-[hsl(0,0%,10%,0.92)] backdrop-blur-xl border border-gold/30 flex items-center justify-center text-gold shadow-lg active:scale-95 transition-transform"
          title="Marrakech"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      </div>

      {/* Legend — only when bubble is dismissed */}
      {bubbleDismissed && <CollapsibleLegend categories={categories} />}

      {/* Onboarding tooltips */}
      <AnimatePresence>
        {onboardingStep >= 0 && !sheetOpen && !vibeSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] flex items-end justify-center pb-24 px-4 pointer-events-none"
          >
            <motion.div
              key={onboardingStep}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="pointer-events-auto bg-card/95 backdrop-blur-xl border border-gold/30 rounded-2xl px-4 py-3 shadow-xl max-w-sm w-full"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{onboardingTips[onboardingStep].emoji}</span>
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
      <VibeSheet vibe={selectedVibe} open={vibeSheetOpen} onOpenChange={setVibeSheetOpen} />
    </div>
  );
}
