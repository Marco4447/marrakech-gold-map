import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Always dark — matches app dark mode
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export function useMapTheme(map: L.Map | null) {
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!layerRef.current) {
      layerRef.current = L.tileLayer(TILE_URL, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);
    }
  }, [map]);

  return { isNight: true }; // Always dark mode
}
