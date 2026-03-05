import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { supabase } from "@/integrations/supabase/client";
import type { Place, VibePin } from "@/types/models";
import { MARRAKECH_CENTER, SIX_HOURS, THREE_HOURS, MOOD_FILTERS, MOOD_COLORS, MOOD_EMOJIS, createCategoryIcon } from "./mapConstants";

export function useMapData(refreshSignal: number) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [vibePins, setVibePins] = useState<VibePin[]>([]);
  const [trendingLocations, setTrendingLocations] = useState<Set<string>>(new Set());
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);

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

  return { places, vibePins, trendingLocations, placesLoading, placesError };
}

export function useMapInstance(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

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
    requestAnimationFrame(() => { map.invalidateSize(); });

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

  return { mapRef, userMarkerRef, handleGeolocate, handleRecenter };
}
