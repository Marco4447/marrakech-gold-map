import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import PlaceSheet from "./PlaceSheet";

// Marrakech Medina center
const MARRAKECH_CENTER: [number, number] = [31.6295, -7.9811];

// Custom gold marker icon
const goldIcon = new L.DivIcon({
  className: "",
  html: `<div class="gold-marker flex items-center justify-center w-8 h-8 rounded-full bg-gold shadow-lg shadow-gold/30 border-2 border-gold-light">
    <div class="w-3 h-3 rounded-full bg-background"></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
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

function MapBoundsHandler() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

export default function MapView() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const fetchPlaces = async () => {
      const { data, error } = await supabase.from("places").select("*");
      if (!error && data) setPlaces(data);
    };
    fetchPlaces();
  }, []);

  const handleMarkerClick = (place: Place) => {
    setSelectedPlace(place);
    setSheetOpen(true);
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={MARRAKECH_CENTER}
        zoom={14}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MapBoundsHandler />
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={goldIcon}
            eventHandlers={{
              click: () => handleMarkerClick(place),
            }}
          />
        ))}
      </MapContainer>

      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="px-5 pt-12 pb-4 bg-gradient-to-b from-background via-background/80 to-transparent">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="text-gold">Wesh</span>
            <span className="text-foreground">kech</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">Explore Marrakech</p>
        </div>
      </div>

      <PlaceSheet
        place={selectedPlace}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
