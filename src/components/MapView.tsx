import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import PlaceSheet from "./PlaceSheet";
import VibeSheet from "./VibeSheet";
import MapSearchBar from "./MapSearchBar";
import { Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Place, VibePin } from "@/types/models";
import { MARRAKECH_CENTER, SIX_HOURS, THREE_HOURS, MOOD_COLORS, MOOD_EMOJIS, CATEGORY_CONFIG, createCategoryIcon } from "./map/mapConstants";
import { useMapData, useMapInstance } from "./map/useMapData";
import { useMapTheme } from "./map/MapThemeManager";
import MapFiltersBar from "./map/MapFiltersBar";
import VenuePreviewCard from "./map/VenuePreviewCard";
import { isBoosted } from "@/lib/boostedPlaces";
import { computeEnergyScores, getEnergy, getDistanceMeters } from "@/lib/energy";

// Filter config for category matching
const FILTER_CATEGORIES: Record<string, string[]> = {
  rooftop: ["rooftop", "roof top", "terrace"],
  party: ["nightlife", "night", "club", "dinner show", "bar"],
  food: ["restaurant", "resto", "food", "street food", "snack"],
  cafe: ["cafe", "coffee", "coffee shop", "cafeteria"],
  street_food: ["street food", "streetfood", "snack", "fast casual"],
  chill: ["chill", "cocktail bar", "lounge", "cafe"],
  attraction: ["attraction", "activity", "museum", "landmark"],
};

const FILTER_EMOJIS: Record<string, string> = {
  rooftop: "🌅", party: "💃", food: "🍽️", cafe: "☕",
  street_food: "🧆", attraction: "📸", chill: "🍸",
  hot: "🔥", offers: "✨", near: "📍",
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const splitNormalizedCategories = (category: string | null) =>
  normalizeText(category || "")
    .split(/[,/|;&-]+/)
    .map((c) => c.trim())
    .filter(Boolean);

const categoryMatchesFilter = (category: string | null, targetCategories: string[]) => {
  const normalizedCategory = normalizeText(category || "");
  if (!normalizedCategory) return false;

  const chunks = splitNormalizedCategories(category);
  const words = new Set(normalizedCategory.split(" ").filter(Boolean));

  return targetCategories.some((rawTarget) => {
    const target = normalizeText(rawTarget);
    if (!target) return false;

    if (normalizedCategory.includes(target)) return true;

    if (chunks.some((chunk) => chunk === target || chunk.includes(target) || target.includes(chunk))) {
      return true;
    }

    const targetWords = target.split(" ").filter(Boolean);
    return targetWords.length > 0 && targetWords.every((word) => words.has(word));
  });
};

export default function MapView({ refreshSignal = 0, flyToCoords, deepLinkPlaceId, isGuest = false }: { refreshSignal?: number; flyToCoords?: { lat: number; lng: number } | null; deepLinkPlaceId?: string | null; isGuest?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { places, vibePins, trendingLocations, placesLoading, placesError, activeVipPlaceIds } = useMapData(refreshSignal);
  const { mapRef, userMarkerRef, userPosition, handleGeolocate, handleRecenter } = useMapInstance(containerRef);

  // Stable refs to avoid re-triggering place markers effect
  const vibePinsRef = useRef(vibePins);
  vibePinsRef.current = vibePins;
  const userPositionRef = useRef(userPosition);
  userPositionRef.current = userPosition;
  const hasAutoFitted = useRef(false);

  // Day/Night theme
  const { isNight } = useMapTheme(mapRef.current);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<VibePin | null>(null);
  const [vibeSheetOpen, setVibeSheetOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  // Auto tonight mode: 8pm–6am
  const [tonightMode] = useState(() => {
    const h = new Date().getHours();
    return h >= 20 || h < 6;
  });
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null);
  const lastFocusedPlaceRef = useRef<Place | null>(null);

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

  // (bubble + vibe pulse removed — visual noise)

  // Auto-fit bounds on first load to center on places/vibes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || hasAutoFitted.current || deepLinkPlaceId) return;
    if (places.length === 0 && vibePins.length === 0) return;

    const points: L.LatLngExpression[] = [];
    
    // Add partner/boosted places first, then all places
    const priorityPlaces = places.filter(p => p.is_partner || isBoosted(p.name) || trendingLocations.has(p.name.toLowerCase()));
    const sourcePlaces = priorityPlaces.length > 0 ? priorityPlaces : places;
    sourcePlaces.forEach(p => points.push([p.latitude, p.longitude]));

    // Add recent vibes
    vibePins.forEach(v => {
      if (v.latitude != null && v.longitude != null) {
        const age = Date.now() - new Date(v.created_at).getTime();
        if (age < SIX_HOURS) points.push([v.latitude, v.longitude]);
      }
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true, duration: 0.8 });
      hasAutoFitted.current = true;
    }
  }, [places, vibePins, trendingLocations, deepLinkPlaceId]);

  // Auto-fit bounds when filter changes — prioritize paid partners
  useEffect(() => {
    const map = mapRef.current;
    if (!map || places.length === 0) return;
    if (!hasAutoFitted.current) return;

    const filtered = getFilteredPlaces();
    if (filtered.length === 0) return;

    // Category/UX centering: include all filtered spots so no venue is hidden off-screen
    if (filtered.length === 1) {
      map.flyTo([filtered[0].latitude, filtered[0].longitude], 16, { duration: 0.6 });
    } else {
      const points: L.LatLngExpression[] = filtered.map((p) => [p.latitude, p.longitude]);
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 0.6 });
    }
  }, [activeFilter, tonightMode]);

  // Fly to coordinates — retry until map is ready
  const flyToPending = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!flyToCoords) return;
    flyToPending.current = flyToCoords;

    const tryFly = () => {
      if (mapRef.current && flyToPending.current) {
        mapRef.current.flyTo([flyToPending.current.lat, flyToPending.current.lng], 17, { duration: 1.2 });
        const target = flyToPending.current;
        flyToPending.current = null;
        // If deepLinkPlaceId is set, let that effect handle sheet opening
        if (!deepLinkPlaceId && places.length > 0) {
          const match = places.find(p =>
            Math.abs(p.latitude - target.lat) < 0.0005 &&
            Math.abs(p.longitude - target.lng) < 0.0005
          );
          if (match) {
            setTimeout(() => handleOpenSheet(match), 800);
          }
        }
        return true;
      }
      return false;
    };

    if (!tryFly()) {
      const interval = setInterval(() => {
        if (tryFly()) clearInterval(interval);
      }, 100);
      setTimeout(() => clearInterval(interval), 5000);
      return () => clearInterval(interval);
    }
  }, [flyToCoords, places, deepLinkPlaceId]);

  // Auto-open place sheet from deep link (moved after handleOpenSheet definition)
  const deepLinkHandled = useRef<string | null>(null);

  // Filter places based on active filter + tonight mode
  const getFilteredPlaces = useCallback(() => {
    let filtered = [...places];

    // Tonight mode: only show venues with official vibe, VIP offer, or recent checkins
    if (tonightMode) {
      const currentVibePins = vibePinsRef.current;
      const vibeLocations = new Set(
        currentVibePins.filter(v => {
          const age = Date.now() - new Date(v.created_at).getTime();
          return age < SIX_HOURS || v.is_official;
        }).map(v => v.location?.toLowerCase()).filter(Boolean)
      );
      filtered = filtered.filter(p =>
        vibeLocations.has(p.name.toLowerCase()) ||
        activeVipPlaceIds.has(p.id) ||
        p.has_active_offer
      );
    }

    // Category / special filters
    if (activeFilter) {
      if (activeFilter === "hot") {
        filtered = filtered.filter(p => trendingLocations.has(p.name.toLowerCase()));
      } else if (activeFilter === "offers") {
        filtered = filtered.filter(p => p.is_partner && p.has_active_offer);
      } else if (activeFilter === "near" && userPositionRef.current) {
        const uPos = userPositionRef.current;
        filtered = filtered
          .map(p => ({ ...p, _dist: getDistanceMeters(uPos.lat, uPos.lng, p.latitude, p.longitude) }))
          .filter(p => (p as any)._dist < 1500)
          .sort((a, b) => (a as any)._dist - (b as any)._dist);
      } else if (FILTER_CATEGORIES[activeFilter]) {
        const targetCats = FILTER_CATEGORIES[activeFilter];
        filtered = filtered.filter((p) => categoryMatchesFilter(p.category || null, targetCats));
      }
    }

    return filtered;
  }, [places, activeFilter, tonightMode, activeVipPlaceIds, trendingLocations]);

  // Add place markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || places.length === 0) return;

    const currentVibePins = vibePinsRef.current;
    const vibesForEnergy = currentVibePins.map(v => ({
      location: v.location,
      likes: 0,
      super_vibes: 0,
      created_at: v.created_at,
      is_official: v.is_official,
    }));
    const energyMap = computeEnergyScores(vibesForEnergy);

    const markers: L.Marker[] = [];
    const filteredPlaces = getFilteredPlaces();

    // Sort places so boosted ones render last (= on top visually)
    const sortedPlaces = [...filteredPlaces].sort((a, b) => {
      const aB = isBoosted(a.name);
      const bB = isBoosted(b.name);
      if (aB && !bB) return 1;
      if (!aB && bB) return -1;
      return 0;
    });

    sortedPlaces.forEach((place) => {
      const isTrending = trendingLocations.has(place.name.toLowerCase());
      const shouldBlur = false; // All pins visible — no guest blur
      const energy = getEnergy(energyMap, place.name);
      const isFilterHighlighted = !!activeFilter && activeFilter !== "hot" && activeFilter !== "offers" && activeFilter !== "near";
      const icon = createCategoryIcon(place.category, {
        trending: isTrending,
        isPartner: place.is_partner,
        hasOffer: place.has_active_offer,
        blurred: shouldBlur,
        placeName: place.name,
        imageUrl: place.image_url,
        energyLabel: energy?.label || null,
        energyEmoji: energy?.emoji || null,
        listingTier: place.listing_tier || null,
        hasActiveVipOffer: activeVipPlaceIds.has(place.id),
        highlighted: isFilterHighlighted,
        highlightEmoji: isFilterHighlighted && activeFilter ? FILTER_EMOJIS[activeFilter] : undefined,
      });
      const boosted = isBoosted(place.name);
      const zOffset = boosted ? 3000 : place.is_partner ? 2000 : isTrending ? 1000 : 0;
      const marker = L.marker([place.latitude, place.longitude], { icon, zIndexOffset: zOffset })
        .addTo(map)
        .on("click", () => {
          if (shouldBlur) {
            L.popup({ closeButton: false, className: "guest-lock-popup", offset: [0, -10] })
              .setLatLng([place.latitude, place.longitude])
              .setContent('<div style="text-align:center;font-size:12px;font-weight:600;color:hsl(43,76%,52%)">🔒 Inscris-toi pour voir ce spot</div>')
              .openOn(map);
            setTimeout(() => map.closePopup(), 2500);
            return;
          }
          setPreviewPlace(place);
          focusPlaceOnMap(place, { withSheetOffset: false, duration: 0.6 });
        });

      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [places, trendingLocations, activeFilter, isGuest, activeVipPlaceIds, tonightMode]);

  // Add vibe pins (no heatmap — cleaner)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeFilter === "offers") return;

    const markers: L.Marker[] = [];

    // Deduplicate vibe pins by location name AND skip vibes that overlap with a place marker
    const placeLocationKeys = new Set(places.map(p => p.name.trim().toLowerCase()));
    const seenLocations = new Set<string>();
    const deduped = vibePins.filter(v => {
      if (v.latitude == null || v.longitude == null) return false;
      const key = v.location?.trim().toLowerCase();
      if (!key) return true;
      if (placeLocationKeys.has(key)) return false;
      if (seenLocations.has(key)) return false;
      seenLocations.add(key);
      return true;
    });

    deduped.forEach((vibe) => {
      const isOfficial = vibe.is_official === true;
      const age = Date.now() - new Date(vibe.created_at).getTime();
      if (age > THREE_HOURS && !isOfficial) return;

      const remaining = isOfficial ? 1 : Math.max(0, 1 - age / SIX_HOURS);
      const size = isOfficial ? 38 : Math.round(24 + remaining * 10);
      const borderColor = isOfficial ? "hsl(43,76%,52%)" : (MOOD_COLORS[vibe.mood || ""] || "hsl(43,56%,52%)");
      const moodEmoji = MOOD_EMOJIS[vibe.mood || ""] || "";
      const pinClass = isOfficial ? "gold-marker" : "";

      const officialBadge = isOfficial
        ? `<div style="position:absolute;top:-4px;right:-4px;font-size:9px;background:hsl(43,76%,52%);border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px hsl(43,76%,52%,0.4)">⭐</div>`
        : "";

      const icon = L.divIcon({
        className: pinClass,
        html: `
          <div style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${borderColor};overflow:hidden;position:relative;background:hsl(0,0%,8%);">
            <img src="${vibe.image_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" loading="lazy" />
            ${moodEmoji ? `<div style="position:absolute;bottom:-2px;right:-2px;font-size:9px;background:hsl(0,0%,5%,0.8);border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center">${moodEmoji}</div>` : ""}
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
    };
  }, [vibePins, activeFilter, places]);

  const focusPlaceOnMap = useCallback(
    (
      place: Place,
      options: { withSheetOffset?: boolean; zoomMin?: number; duration?: number } = {},
    ) => {
      const map = mapRef.current;
      if (!map) return;

      const { withSheetOffset = false, zoomMin = 16, duration = 0.6 } = options;
      const targetZoom = Math.max(map.getZoom(), zoomMin);

      if (!withSheetOffset) {
        // Offset slightly upward so marker sits above preview card on mobile
        const targetPoint = map.project([place.latitude, place.longitude], targetZoom);
        const containerHeight = map.getSize().y;
        const offsetPoint = L.point(targetPoint.x, targetPoint.y + containerHeight * 0.08);
        const offsetLatLng = map.unproject(offsetPoint, targetZoom);
        map.flyTo(offsetLatLng, targetZoom, { duration });
        return;
      }

      // Keep marker visible above the bottom sheet
      const targetPoint = map.project([place.latitude, place.longitude], targetZoom);
      const containerHeight = map.getSize().y;
      const offsetPoint = L.point(targetPoint.x, targetPoint.y + containerHeight * 0.15);
      const offsetLatLng = map.unproject(offsetPoint, targetZoom);
      map.flyTo(offsetLatLng, targetZoom, { duration });
    },
    [],
  );

  // Close preview when opening sheet — focus with vertical offset so pin stays visible above the sheet
  const handleOpenSheet = useCallback((place: Place) => {
    setPreviewPlace(null);
    setSelectedPlace(place);
    lastFocusedPlaceRef.current = place;
    setSheetOpen(true);
    focusPlaceOnMap(place, { withSheetOffset: true, duration: 0.7 });
  }, [focusPlaceOnMap]);

  // Auto-open place sheet from deep link
  useEffect(() => {
    if (deepLinkPlaceId && places.length > 0 && deepLinkHandled.current !== deepLinkPlaceId) {
      const place = places.find(p => p.id === deepLinkPlaceId);
      if (place) {
        deepLinkHandled.current = deepLinkPlaceId;
        setTimeout(() => {
          handleOpenSheet(place);
        }, 600);
      }
    }
  }, [deepLinkPlaceId, places, handleOpenSheet]);

  // Reset deepLinkPlaceId after sheet closes so next Discover click works
  useEffect(() => {
    if (!sheetOpen && deepLinkPlaceId && deepLinkHandled.current === deepLinkPlaceId) {
      // Allow re-triggering by clearing the handled ref after a short delay
      const t = setTimeout(() => { deepLinkHandled.current = null; }, 300);
      return () => clearTimeout(t);
    }
  }, [sheetOpen, deepLinkPlaceId]);


  // Tap ripple effect on map click
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const container = map.getContainer();
      const point = map.latLngToContainerPoint(e.latlng);
      const ripple = document.createElement("div");
      ripple.className = "map-tap-ripple";
      ripple.style.left = `${point.x}px`;
      ripple.style.top = `${point.y}px`;
      container.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    };
    map.on("click", handleMapClick);
    return () => { map.off("click", handleMapClick); };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className={`h-full w-full z-0 transition-[filter] duration-500 ease-out ${isNight ? "" : "map-day-mode"}`}
        style={{ filter: sheetOpen || vibeSheetOpen ? "blur(6px) brightness(0.7)" : "none" }}
      />

      {/* Distance rings removed — cleaner map */}

      {/* ===== UNIFIED HEADER ===== */}
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
            <div className="px-3 pt-10 pb-1 bg-gradient-to-b from-background via-background/80 to-transparent">
              {/* Row 1: Logo + Search */}
              <div className="flex items-center gap-2 pointer-events-auto">
                <motion.div
                  className="flex items-center gap-1 shrink-0"
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
                        handleOpenSheet(fullPlace);
                      }
                    }}
                  />
                </div>
                {isNight && (
                  <div className="flex items-center gap-1 bg-card/60 backdrop-blur-md border border-border rounded-full px-2 py-0.5 shrink-0">
                    <span className="text-[9px]">🌙</span>
                    <span className="text-foreground text-[9px] font-medium">Night</span>
                  </div>
                )}
              </div>

              {/* Row 2: Category filters only — clean horizontal scroll */}
              <div className="mt-1.5 pointer-events-auto">
                <MapFiltersBar
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Venue Preview Card (swipeable) */}
      <AnimatePresence>
        {previewPlace && !sheetOpen && !vibeSheetOpen && (
          <VenuePreviewCard
            places={getFilteredPlaces()}
            selectedPlace={previewPlace}
            onSelect={(p) => {
              setPreviewPlace(p);
              focusPlaceOnMap(p, { withSheetOffset: false, zoomMin: 15, duration: 0.6 });
            }}
            onOpenSheet={handleOpenSheet}
            userPosition={userPosition}
            activeVipPlaceIds={activeVipPlaceIds}
          />
        )}
      </AnimatePresence>

      {/* Controls — simplified */}
      <AnimatePresence>
        {!sheetOpen && !vibeSheetOpen && (
          <motion.div
            key="map-controls"
            className="absolute bottom-20 right-3 z-[1000] flex flex-col gap-1.5"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <button
              onClick={handleGeolocate}
              className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-xl border border-border shadow-md flex items-center justify-center active:scale-95 transition-transform"
              title="Ma position"
            >
              <Navigation className="w-4 h-4 text-gold" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tonight mode subtle indicator (auto) */}
      {tonightMode && !sheetOpen && !vibeSheetOpen && (
        <div className="absolute bottom-[88px] left-3 z-[999]">
          <div className="flex items-center gap-1 bg-card/70 backdrop-blur-md border border-border/40 rounded-full px-2.5 py-1 shadow-sm">
            <span className="text-[10px]">🌙</span>
            <span className="text-[9px] font-medium text-muted-foreground">Night · {getFilteredPlaces().length} spots</span>
          </div>
        </div>
      )}

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

      {/* Error state */}
      {placesError && !placesLoading && (
        <div className="absolute top-24 left-4 right-4 z-[1001] bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-center gap-2">
          <span className="text-sm">⚠️</span>
          <div className="flex-1">
            <p className="text-xs font-medium text-destructive">{placesError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[10px] text-gold font-semibold mt-1 underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      <PlaceSheet place={selectedPlace} open={sheetOpen} onRecenter={() => {
        const target = selectedPlace ?? lastFocusedPlaceRef.current;
        if (target) {
          focusPlaceOnMap(target, { withSheetOffset: true, duration: 0.6 });
        }
      }} onOpenChange={(open) => {
        setSheetOpen(open);
        if (!open) {
          const targetPlace = selectedPlace ?? lastFocusedPlaceRef.current;

          if (targetPlace) {
            setPreviewPlace(targetPlace);

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                mapRef.current?.invalidateSize({ animate: false });
                focusPlaceOnMap(targetPlace, { withSheetOffset: false, duration: 0.55 });
              });
            });
          } else {
            setPreviewPlace(null);
          }
        }
      }} />
      <VibeSheet vibe={selectedVibe} open={vibeSheetOpen} onOpenChange={setVibeSheetOpen} />
    </div>
  );
}
