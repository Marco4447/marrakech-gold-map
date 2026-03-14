import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, ChevronUp, Flame, Zap } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Marrakech center
const MARRAKECH_CENTER: [number, number] = [31.6295, -7.9811];

interface HotPlace {
  id: string;
  name: string;
  imageUrl: string;
  vibeCount: number;
  isPartner: boolean;
  position: [number, number];
}

const MOCK_HOT_PLACES: HotPlace[] = [
  {
    id: "1",
    name: "Mazel Café",
    imageUrl: "/images/mazel-1.jpg",
    vibeCount: 12,
    isPartner: true,
    position: [31.635, -7.99],
  },
  {
    id: "2",
    name: "Kabana",
    imageUrl: "/images/kabana-photo-1.jpg",
    vibeCount: 8,
    isPartner: true,
    position: [31.625, -7.985],
  },
  {
    id: "3",
    name: "Théatro",
    imageUrl: "/images/theatro-2.jpg",
    vibeCount: 15,
    isPartner: true,
    position: [31.62, -7.995],
  },
];

// Custom heat pin icon
function createHeatPinIcon(isPartner: boolean): L.DivIcon {
  return L.divIcon({
    className: "custom-heat-pin",
    html: `
      <div class="relative">
        ${isPartner ? `
          <div class="absolute -inset-4 rounded-full bg-gold/20 animate-ping" />
          <div class="absolute -inset-2 rounded-full bg-gold/30 animate-pulse" />
        ` : `
          <div class="absolute -inset-3 rounded-full bg-accent-warm/15 animate-ping" />
        `}
        <div class="relative w-10 h-10 rounded-full ${isPartner ? 'bg-gold' : 'bg-accent-warm'} flex items-center justify-center shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1 });
  }, [center, map]);
  return null;
}

function HotPlacesDrawer({
  places,
  isOpen,
  onToggle,
  onPlaceClick,
}: {
  places: HotPlace[];
  isOpen: boolean;
  onToggle: () => void;
  onPlaceClick: (place: HotPlace) => void;
}) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="absolute bottom-0 left-0 right-0 z-[1000]"
    >
      <div className="mx-2 bg-surface/95 backdrop-blur-xl border border-border/60 rounded-t-2xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Handle bar */}
        <button
          onClick={onToggle}
          className="w-full flex flex-col items-center pt-3 pb-2 active:opacity-70 transition-opacity"
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mb-2" />
          <div className="flex items-center gap-2 px-4 w-full">
            <Flame className="w-4 h-4 text-accent-warm" />
            <span className="text-sm font-bold text-foreground">What's Hot</span>
            <span className="text-xs text-muted-foreground">ce soir</span>
            <div className="flex-1" />
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </div>
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-4 pt-2">
                <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
                  {places.map((place, i) => (
                    <motion.button
                      key={place.id}
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      onClick={() => onPlaceClick(place)}
                      className="relative flex-shrink-0 flex items-center gap-3 bg-surface-elevated/80 backdrop-blur-xl border border-border/50 rounded-full pl-1.5 pr-4 py-1.5 shadow-lg shadow-black/20 active:scale-95 transition-transform snap-start"
                    >
                      {/* Thumbnail with partner badge */}
                      <div className="relative">
                        <div className={`w-9 h-9 rounded-full overflow-hidden border-2 ${
                          place.isPartner ? "border-gold" : "border-accent-warm/50"
                        }`}>
                          <img
                            src={place.imageUrl}
                            alt={place.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        {place.isPartner && (
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gold rounded-full flex items-center justify-center">
                            <Zap className="w-2 h-2 text-background" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-semibold text-foreground truncate max-w-[90px]">
                          {place.name}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive" />
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {place.vibeCount} live
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function LiveRadarScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<HotPlace | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(MARRAKECH_CENTER);

  const handlePlaceClick = useCallback((place: HotPlace) => {
    setSelectedPlace(place);
    setMapCenter(place.position);
    setDrawerOpen(false);
  }, []);

  return (
    <div className="relative h-screen w-full bg-background overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-12 pb-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold text-white">Radar Live</h1>
            <p className="text-xs text-white/60">Marrakech en temps réel</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-warm opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-warm" />
            </span>
            <span className="text-xs font-medium text-white/90">{MOCK_HOT_PLACES.length} spots actifs</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={MARRAKECH_CENTER}
        zoom={14}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController center={mapCenter} />

        {MOCK_HOT_PLACES.map((place) => (
          <Marker
            key={place.id}
            position={place.position}
            icon={createHeatPinIcon(place.isPartner)}
            eventHandlers={{
              click: () => handlePlaceClick(place),
            }}
          />
        ))}
      </MapContainer>

      {/* What's Hot Drawer */}
      <HotPlacesDrawer
        places={MOCK_HOT_PLACES}
        isOpen={drawerOpen}
        onToggle={() => setDrawerOpen(!drawerOpen)}
        onPlaceClick={handlePlaceClick}
      />

      {/* Selected Place Card */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-36 left-4 right-4 z-[1000]"
          >
            <div className="bg-surface/95 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPlace.imageUrl}
                  alt={selectedPlace.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {selectedPlace.name}
                    </h3>
                    {selectedPlace.isPartner && (
                      <span className="px-1.5 py-0.5 bg-gold/20 text-gold text-[10px] font-medium rounded">
                        PARTNER
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Marrakech</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1 text-xs text-accent-warm">
                      <Flame className="w-3 h-3" />
                      {selectedPlace.vibeCount} vibes
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronUp className="w-5 h-5 text-muted-foreground rotate-180" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
