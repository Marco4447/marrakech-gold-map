import { useEffect, useRef, useState } from "react";
import L from "leaflet";

const TILE_DAY = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_NIGHT = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
}

export function useMapTheme(map: L.Map | null) {
  const layerRef = useRef<L.TileLayer | null>(null);
  const [isNight, setIsNight] = useState(isNightTime);

  // Check time every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setIsNight(isNightTime());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map) return;

    const tileUrl = isNight ? TILE_NIGHT : TILE_DAY;

    if (layerRef.current) {
      // Smooth cross-fade: add new layer, then remove old
      const oldLayer = layerRef.current;
      const newLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      }).addTo(map);

      // Fade transition via CSS on tile container
      const newContainer = (newLayer as any)._container as HTMLElement | undefined;
      if (newContainer) {
        newContainer.style.transition = "opacity 0.8s ease-in-out";
        newContainer.style.opacity = "0";
        requestAnimationFrame(() => {
          newContainer.style.opacity = "1";
        });
      }

      setTimeout(() => {
        try { map.removeLayer(oldLayer); } catch {}
      }, 900);

      layerRef.current = newLayer;
    } else {
      layerRef.current = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      }).addTo(map);
    }
  }, [map, isNight]);

  return { isNight };
}
