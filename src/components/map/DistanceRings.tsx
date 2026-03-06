import { useEffect, useRef } from "react";
import L from "leaflet";

interface DistanceRingsProps {
  map: L.Map | null;
  userPosition: { lat: number; lng: number } | null;
  isNight: boolean;
}

export default function DistanceRings({ map, userPosition, isNight }: DistanceRingsProps) {
  const circlesRef = useRef<L.Circle[]>([]);

  useEffect(() => {
    // Clean up old circles
    circlesRef.current.forEach((c) => {
      try { c.remove(); } catch {}
    });
    circlesRef.current = [];

    if (!map || !userPosition) return;

    const ringColor = isNight ? "hsl(43, 76%, 52%)" : "hsl(43, 60%, 40%)";
    const rings = [
      { radius: 500, label: "500m" },
      { radius: 1000, label: "1km" },
    ];

    rings.forEach(({ radius }) => {
      const circle = L.circle([userPosition.lat, userPosition.lng], {
        radius,
        color: ringColor,
        fillColor: "transparent",
        weight: 1,
        opacity: 0.25,
        dashArray: "6 4",
        interactive: false,
      }).addTo(map);

      circlesRef.current.push(circle);
    });

    return () => {
      circlesRef.current.forEach((c) => {
        try { c.remove(); } catch {}
      });
      circlesRef.current = [];
    };
  }, [map, userPosition?.lat, userPosition?.lng, isNight]);

  return null;
}
