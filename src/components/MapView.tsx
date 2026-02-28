import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import PlaceSheet from "./PlaceSheet";

const MARRAKECH_CENTER: [number, number] = [31.6295, -7.9811];

const createGoldIcon = () =>
  L.divIcon({
    className: "",
    html: `<div class="gold-marker flex items-center justify-center w-8 h-8 rounded-full bg-gold shadow-lg border-2 border-gold-light" style="background:hsl(43,56%,52%);border-color:hsl(43,60%,65%);box-shadow:0 0 12px hsl(43,56%,52%,0.4)">
      <div style="width:12px;height:12px;border-radius:50%;background:hsl(220,20%,6%)"></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

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

  // Add markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || places.length === 0) return;

    const markers: L.Marker[] = [];
    const icon = createGoldIcon();

    places.forEach((place) => {
      const marker = L.marker([place.latitude, place.longitude], { icon })
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
  }, [places]);

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

      {/* Conseil du Jour */}
      <div className="absolute top-[88px] left-4 right-4 z-[1000]">
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

      <PlaceSheet place={selectedPlace} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
