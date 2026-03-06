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
  pool: ["Pool Party"],
};

export default function MapView({ refreshSignal = 0, flyToCoords, deepLinkPlaceId, isGuest = false }: { refreshSignal?: number; flyToCoords?: { lat: number; lng: number } | null; deepLinkPlaceId?: string | null; isGuest?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { places, vibePins, trendingLocations, placesLoading, placesError, activeVipPlaceIds } = useMapData(refreshSignal);
  const { mapRef, userMarkerRef, userPosition, handleGeolocate, handleRecenter } = useMapInstance(containerRef);

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
      const vibeLocations = new Set(
        vibePins.filter(v => {
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
      } else if (activeFilter === "near" && userPosition) {
        filtered = filtered
          .map(p => ({ ...p, _dist: getDistanceMeters(userPosition.lat, userPosition.lng, p.latitude, p.longitude) }))
          .filter(p => (p as any)._dist < 1500)
          .sort((a, b) => (a as any)._dist - (b as any)._dist);
      } else if (FILTER_CATEGORIES[activeFilter]) {
        const cats = FILTER_CATEGORIES[activeFilter];
        filtered = filtered.filter(p => cats.includes(p.category || ""));
      }
    }

    return filtered;
  }, [places, activeFilter, tonightMode, vibePins, activeVipPlaceIds, trendingLocations, userPosition]);

  // Add place markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || places.length === 0) return;

    const vibesForEnergy = vibePins.map(v => ({
      location: v.location,
      likes: 0,
      super_vibes: 0,
      created_at: v.created_at,
      is_official: v.is_official,
    }));
    const energyMap = computeEnergyScores(vibesForEnergy);

    const markers: L.Marker[] = [];
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
          map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 15), { duration: 0.6 });
        });

      // Staggered discovery animation
      const delay = Math.min(index * 60, 2500);
      setTimeout(() => {
        if (marker.getElement()) {
          marker.setOpacity(1);
          const el = marker.getElement()!;
          el.style.transition = "opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
          el.style.transform = "scale(0)";
          requestAnimationFrame(() => {
            el.style.transform = "scale(1)";
          });
        }
      }, delay);
      markers.push(marker);
    });

    return () => { markers.forEach((m) => m.remove()); };
  }, [places, trendingLocations, activeFilter, isGuest, activeVipPlaceIds, tonightMode, vibePins, userPosition]);

  // Add vibe pins + heatmap
  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeFilter === "offers" || !showVibes) return;

    const markers: L.Marker[] = [];
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
      setTimeout(() => {
        const el = marker.getElement();
        if (el) {
          el.style.transition = "opacity 0.35s ease-out, transform 0.35s ease-out";
          el.style.transform = "scale(0.7)";
          marker.setOpacity(1);
          requestAnimationFrame(() => { el.style.transform = "scale(1)"; });
        }
      }, delay);
      markers.push(marker);
    });

    return () => {
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
      setTimeout(() => {
        markers.forEach((m) => m.remove());
        map.removeLayer(heatLayer);
      }, 280);
    };
  }, [vibePins, activeFilter, showVibes, isNight]);

  // Close preview when opening sheet
  const handleOpenSheet = (place: Place) => {
    setPreviewPlace(null);
    setSelectedPlace(place);
    setSheetOpen(true);
  };

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
                        mapRef.current?.flyTo([fullPlace.latitude, fullPlace.longitude], 17, { duration: 1 });
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

              {/* Enhanced filter bar */}
              <div className="mt-1.5 pointer-events-auto">
                <MapFiltersBar
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  tonightMode={tonightMode}
                  onTonightToggle={() => setTonightMode(t => !t)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent vibes panel */}
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

      {/* Top Live Places */}
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
            className="absolute bottom-20 right-3 z-[1000] flex flex-col gap-2"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <button
              onClick={handleGeolocate}
              className="w-10 h-10 rounded-full bg-gold/90 backdrop-blur-xl border border-gold-dark/40 flex items-center justify-center text-primary-foreground shadow-lg active:scale-95 transition-transform"
              title="Ma position"
            >
              <Navigation className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowVibes(v => !v)}
              className={`relative w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                showVibes
                  ? "bg-gold/90 border-gold-dark/40 text-primary-foreground"
                  : "bg-[hsl(0,0%,10%,0.92)] border-border text-muted-foreground"
              }`}
              title={showVibes ? "Masquer les vibes" : "Voir les vibes"}
            >
              <span className="text-sm">📸</span>
              {vibePins.length > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center px-1 transition-all ${
                  showVibes ? "bg-primary-foreground text-gold" : "bg-muted text-muted-foreground"
                } ${vibePulse ? "animate-[pulse_0.5s_ease-in-out_3]" : ""}`}>
                  {vibePins.length}
                </span>
              )}
            </button>
            <button
              onClick={handleRecenter}
              className="w-10 h-10 rounded-full bg-[hsl(0,0%,10%,0.92)] backdrop-blur-xl border border-gold/30 flex items-center justify-center text-gold shadow-lg active:scale-95 transition-transform"
              title="Marrakech"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      {bubbleDismissed && !previewPlace && <CollapsibleLegend categories={categories} />}

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
