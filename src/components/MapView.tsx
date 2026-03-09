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
import { LocateFixed, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Place, VibePin } from "@/types/models";
import { MARRAKECH_CENTER, SIX_HOURS, THREE_HOURS, MOOD_COLORS, MOOD_EMOJIS, CATEGORY_CONFIG, createCategoryIcon } from "./map/mapConstants";
import { useMapData, useMapInstance } from "./map/useMapData";
import { FloatingBubble, CollapsibleLegend } from "./map/MapOverlays";
import { useMapTheme } from "./map/MapThemeManager";
import MapFiltersBar from "./map/MapFiltersBar";
import VenuePreviewCard from "./map/VenuePreviewCard";
import DistanceRings from "./map/DistanceRings";
import { isBoosted } from "@/lib/boostedPlaces";
import { computeEnergyScores, getEnergy, getDistanceMeters } from "@/lib/energy";

// Filter config for category matching
const FILTER_CATEGORIES: Record<string, string[]> = {
  rooftop: ["Rooftop"],
  party: ["Nightlife", "Night", "Dinner Show"],
  food: ["Restaurant", "Food"],
  chill: ["Chill", "Cocktail Bar", "Café"],
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
  const [showVibes, setShowVibes] = useState(true);
  const [vibePulse, setVibePulse] = useState(false);
  const prevVibeCountRef = useRef(vibePins.length);
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(() => !!localStorage.getItem("wk_bubble_dismissed"));
  const [tonightMode, setTonightMode] = useState(false);
  const [previewPlace, setPreviewPlace] = useState<Place | null>(null);

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

  // Delayed bubble appearance
  useEffect(() => {
    if (bubbleDismissed || onboardingStep >= 0) return;
    const timer = setTimeout(() => setShowBubble(true), 2500);
    return () => clearTimeout(timer);
  }, [bubbleDismissed, onboardingStep, placesLoading]);

  // Pulse when new vibes arrive
  useEffect(() => {
    if (vibePins.length > prevVibeCountRef.current) {
      setVibePulse(true);
      const t = setTimeout(() => setVibePulse(false), 1500);
      return () => clearTimeout(t);
    }
    prevVibeCountRef.current = vibePins.length;
  }, [vibePins.length]);

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

  // Auto-fit bounds when filter changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || places.length === 0) return;
    // Skip on initial load (handled by hasAutoFitted)
    if (!hasAutoFitted.current) return;

    const filtered = getFilteredPlaces();
    if (filtered.length === 0) return;

    const points: L.LatLngExpression[] = filtered.map(p => [p.latitude, p.longitude]);
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 0.6 });
  }, [activeFilter, tonightMode]);

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
        }, 1400);
      }
    }
  }, [deepLinkPlaceId, places]);

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
        const cats = FILTER_CATEGORIES[activeFilter];
        filtered = filtered.filter(p => cats.includes(p.category || ""));
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
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const filteredPlaces = getFilteredPlaces();
    const filteredIds = new Set(filteredPlaces.map(p => p.id));

    // Sort places so boosted ones render last (= on top visually)
    const sortedPlaces = [...filteredPlaces].sort((a, b) => {
      const aB = isBoosted(a.name);
      const bB = isBoosted(b.name);
      if (aB && !bB) return 1;
      if (!aB && bB) return -1;
      return 0;
    });

    const tryApplyRevealAnimation = (marker: L.Marker) => {
      const el = marker.getElement();
      if (!el) return false;
      el.style.transition = "opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.transform = "scale(0)";
      requestAnimationFrame(() => {
        if (!marker.getElement()) return;
        el.style.transform = "scale(1)";
      });
      return true;
    };

    sortedPlaces.forEach((place, index) => {
      const isTrending = trendingLocations.has(place.name.toLowerCase());
      const shouldBlur = isGuest && !place.is_partner && !isTrending && index % 5 < 2;
      const energy = getEnergy(energyMap, place.name);
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
      });
      const boosted = isBoosted(place.name);
      const zOffset = boosted ? 3000 : place.is_partner ? 2000 : isTrending ? 1000 : 0;
      const marker = L.marker([place.latitude, place.longitude], { icon, zIndexOffset: zOffset, opacity: 0 })
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
          // Show preview card instead of directly opening sheet
          setPreviewPlace(place);
          map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 16), { duration: 0.6 });
        });

      // Staggered discovery animation (robuste même si le DOM du marker n'est pas prêt immédiatement)
      const delay = Math.min(index * 60, 2500);
      const t = setTimeout(() => {
        if (!map.hasLayer(marker)) return;
        marker.setOpacity(1);
        if (!tryApplyRevealAnimation(marker)) {
          requestAnimationFrame(() => {
            if (!map.hasLayer(marker)) return;
            tryApplyRevealAnimation(marker);
          });
        }
      }, delay);
      timers.push(t);

      markers.push(marker);
    });

    return () => {
      timers.forEach(clearTimeout);
      markers.forEach((m) => m.remove());
    };
  }, [places, trendingLocations, activeFilter, isGuest, activeVipPlaceIds, tonightMode]);

  // Add vibe pins + heatmap
  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeFilter === "offers" || !showVibes) return;

    const markers: L.Marker[] = [];
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const heatPoints: [number, number, number][] = [];

    vibePins.forEach((vibe) => {
      if (vibe.latitude == null || vibe.longitude == null) return;
      const age = Date.now() - new Date(vibe.created_at).getTime();
      if (age > THREE_HOURS && !vibe.is_official) return;
      const freshness = Math.max(0.2, 1 - age / SIX_HOURS);
      heatPoints.push([vibe.latitude, vibe.longitude, freshness]);
    });

    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 35, blur: 25, maxZoom: 17, minOpacity: 0.25, max: 1.0,
      gradient: isNight ? {
        0.0: "rgba(0,0,0,0)",
        0.2: "hsla(30, 100%, 50%, 0.3)",
        0.4: "hsla(25, 100%, 50%, 0.5)",
        0.6: "hsla(15, 100%, 50%, 0.65)",
        0.8: "hsla(5, 90%, 50%, 0.8)",
        1.0: "hsla(0, 100%, 55%, 0.9)",
      } : {
        0.0: "rgba(0,0,0,0)",
        0.2: "hsla(45, 100%, 60%, 0.25)",
        0.4: "hsla(35, 100%, 55%, 0.4)",
        0.6: "hsla(25, 100%, 50%, 0.55)",
        0.8: "hsla(15, 90%, 50%, 0.7)",
        1.0: "hsla(5, 100%, 50%, 0.85)",
      },
    }).addTo(map);

    const heatCanvas = (heatLayer as any)._canvas as HTMLCanvasElement | undefined;
    if (heatCanvas) {
      heatCanvas.style.transition = "opacity 0.4s ease-out";
      heatCanvas.style.opacity = "0";
      requestAnimationFrame(() => { heatCanvas.style.opacity = "1"; });
    }

    const tryApplyVibeRevealAnimation = (marker: L.Marker) => {
      const el = marker.getElement();
      if (!el) return false;
      el.style.transition = "opacity 0.35s ease-out, transform 0.35s ease-out";
      el.style.transform = "scale(0.7)";
      requestAnimationFrame(() => { el.style.transform = "scale(1)"; });
      return true;
    };

    vibePins.forEach((vibe, idx) => {
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
          <div style="width:${size}px;height:${size}px;border-radius:50%;border:${isOfficial ? "3px" : "2.5px"} solid ${borderColor};overflow:hidden;position:relative;background:hsl(0,0%,8%);">
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
      const marker = L.marker([vibe.latitude, vibe.longitude], { icon, zIndexOffset: zOffset, opacity: 0 })
        .addTo(map)
        .on("click", () => {
          setSelectedVibe(vibe);
          setVibeSheetOpen(true);
        });

      const delay = Math.min(idx * 40, 800);
      const t = setTimeout(() => {
        if (!map.hasLayer(marker)) return;
        marker.setOpacity(1);
        if (!tryApplyVibeRevealAnimation(marker)) {
          requestAnimationFrame(() => {
            if (!map.hasLayer(marker)) return;
            tryApplyVibeRevealAnimation(marker);
          });
        }
      }, delay);
      timers.push(t);

      markers.push(marker);
    });

    return () => {
      timers.forEach(clearTimeout);
      if (heatCanvas) {
        heatCanvas.style.opacity = "0";
      }
      markers.forEach((m) => {
        const el = m.getElement();
        if (el) {
          el.style.transition = "opacity 0.25s ease-in, transform 0.25s ease-in";
          el.style.opacity = "0";
          el.style.transform = "scale(0.6)";
        }
      });
      const cleanupTimer = setTimeout(() => {
        markers.forEach((m) => m.remove());
        map.removeLayer(heatLayer);
      }, 280);
      timers.push(cleanupTimer);
    };
  }, [vibePins, activeFilter, showVibes, isNight]);

  // Close preview when opening sheet — fly to place with vertical offset so pin stays visible above the sheet
  const handleOpenSheet = useCallback((place: Place) => {
    setPreviewPlace(null);
    setSelectedPlace(place);
    setSheetOpen(true);
    const map = mapRef.current;
    if (map) {
      // Offset the center upward by ~30% of container height so pin sits above the bottom sheet
      const targetZoom = Math.max(map.getZoom(), 16);
      const targetPoint = map.project([place.latitude, place.longitude], targetZoom);
      const containerHeight = map.getSize().y;
      const offsetPoint = L.point(targetPoint.x, targetPoint.y + containerHeight * 0.15);
      const offsetLatLng = map.unproject(offsetPoint, targetZoom);
      map.flyTo(offsetLatLng, targetZoom, { duration: 0.7 });
    }
  }, []);

  const categories = Object.entries(CATEGORY_CONFIG);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className={`h-full w-full z-0 transition-[filter] duration-500 ease-out ${isNight ? "" : "map-day-mode"}`}
        style={{ filter: sheetOpen || vibeSheetOpen ? "blur(6px) brightness(0.7)" : "none" }}
      />

      {/* Distance rings */}
      <DistanceRings map={mapRef.current} userPosition={userPosition} isNight={isNight} />

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
            <div className="px-3 pt-10 pb-1 bg-gradient-to-b from-background via-background/90 to-transparent">
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
                        handleOpenSheet(fullPlace);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Night mode indicator */}
                  {isNight && (
                    <div className="flex items-center gap-1 bg-[hsl(280,50%,20%,0.6)] backdrop-blur-md border border-[hsl(280,60%,50%,0.3)] rounded-full px-2 py-0.5 shrink-0">
                      <span className="text-[9px]">🌙</span>
                      <span className="text-[hsl(280,60%,70%)] text-[9px] font-medium">Night</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 bg-card/60 backdrop-blur-md border border-border rounded-full px-2 py-0.5 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-foreground text-[9px] font-medium">
                      {placesLoading ? "…" : `${places.length}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter bar + recent vibes in one row */}
              <div className="mt-1.5 pointer-events-auto flex items-center gap-1.5">
                <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
                  <MapFiltersBar
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    tonightMode={tonightMode}
                    onTonightToggle={() => setTonightMode(t => !t)}
                  />
                </div>
                <div className="shrink-0 w-[140px]">
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
                      }
                      setSelectedVibe(vibe as any);
                      setVibeSheetOpen(true);
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Live Places — positioned below header */}
      <AnimatePresence>
        {!sheetOpen && !vibeSheetOpen && (
          <motion.div
            key="top-live-places"
            className="absolute top-[120px] left-0 right-0 z-[999] px-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <TopLivePlaces
              onPlaceClick={(name) => {
                const place = places.find(p => p.name === name);
                if (place) {
                  handleOpenSheet(place);
                  mapRef.current?.flyTo([place.latitude, place.longitude], 16, { duration: 0.8 });
                }
              }}
            />
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
              mapRef.current?.flyTo([p.latitude, p.longitude], Math.max(mapRef.current.getZoom(), 15), { duration: 0.6 });
            }}
            onOpenSheet={handleOpenSheet}
            userPosition={userPosition}
            activeVipPlaceIds={activeVipPlaceIds}
          />
        )}
      </AnimatePresence>

      {/* Floating bubble — hide when preview is showing */}
      <AnimatePresence>
        {showBubble && !bubbleDismissed && !sheetOpen && !vibeSheetOpen && !previewPlace && (
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
              onPlaceClick={(place) => { handleOpenSheet(place); }}
              onDismiss={() => {
                setBubbleDismissed(true);
                localStorage.setItem("wk_bubble_dismissed", "1");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
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
            {/* Geolocate */}
            <button
              onClick={handleGeolocate}
              className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-card/90 backdrop-blur-xl border border-border shadow-md active:scale-95 transition-transform"
              title="Ma position"
            >
              <Navigation className="w-3.5 h-3.5 text-gold" />
              <span className="text-[10px] font-semibold text-foreground">Position</span>
            </button>

            {/* Toggle vibes */}
            <button
              onClick={() => setShowVibes(v => !v)}
              className={`flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full backdrop-blur-xl border shadow-md active:scale-95 transition-all ${
                showVibes
                  ? "bg-gold/15 border-gold/30 text-gold"
                  : "bg-card/90 border-border text-muted-foreground"
              }`}
              title={showVibes ? "Masquer les vibes" : "Voir les vibes"}
            >
              <span className="text-xs">📸</span>
              <span className="text-[10px] font-semibold">
                Vibes{vibePins.length > 0 ? ` (${vibePins.length})` : ""}
              </span>
            </button>

            {/* Recenter */}
            <button
              onClick={handleRecenter}
              className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-card/90 backdrop-blur-xl border border-border shadow-md active:scale-95 transition-transform"
              title="Recentrer"
            >
              <LocateFixed className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-foreground">Recentrer</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      {bubbleDismissed && !previewPlace && (
        <CollapsibleLegend
          categories={categories}
          activeCategory={activeFilter}
          onCategoryClick={(cat) => {
            if (!cat) {
              setActiveFilter(null);
            } else {
              // Map category name to filter key if possible, otherwise filter by exact category
              const filterMap: Record<string, string> = {
                Nightlife: "party", Night: "party", "Dinner Show": "party",
                Restaurant: "food", Food: "food",
                Rooftop: "rooftop",
                Chill: "chill", "Cocktail Bar": "chill", Café: "chill", Hôtel: "chill",
              };
              setActiveFilter(filterMap[cat] || cat);
            }
          }}
        />
      )}

      {/* Tonight mode active indicator */}
      <AnimatePresence>
        {tonightMode && !sheetOpen && !vibeSheetOpen && (
          <motion.div
            key="tonight-indicator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-[88px] left-3 z-[999]"
          >
            <div className="flex items-center gap-1.5 bg-[hsl(280,50%,15%,0.9)] backdrop-blur-xl border border-[hsl(280,60%,50%,0.3)] rounded-full px-3 py-1.5 shadow-lg">
              <span className="text-xs">🌙</span>
              <span className="text-[10px] font-bold text-[hsl(280,60%,75%)]">Tonight Mode</span>
              <span className="text-[10px] text-[hsl(280,40%,60%)]">·</span>
              <span className="text-[10px] text-[hsl(280,40%,60%)]">{getFilteredPlaces().length} spots</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <PlaceSheet place={selectedPlace} open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) setPreviewPlace(null); }} />
      <VibeSheet vibe={selectedVibe} open={vibeSheetOpen} onOpenChange={setVibeSheetOpen} />
    </div>
  );
}
