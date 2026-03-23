import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { supabase } from "@/integrations/supabase/client";
import type { Place, VibePin } from "@/types/models";
import { MARRAKECH_CENTER } from "./mapConstants";

export function useMapData(refreshSignal: number) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [vibePins, setVibePins] = useState<VibePin[]>([]);
  const [heatPoints, setHeatPoints] = useState<[number, number, number][]>([]);
  const [trendingLocations, setTrendingLocations] = useState<Set<string>>(new Set());
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [activeVipPlaceIds, setActiveVipPlaceIds] = useState<Set<string>>(new Set());

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

        const response = await fetch(`${baseUrl}/rest/v1/places?select=id,name,slug,category,latitude,longitude,image_url,is_partner,has_active_offer,listing_tier,neighborhood`, {
          method: "GET",
          headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`PLACES_FETCH_FAILED_${response.status}`);
        const rows = await response.json();
        setPlaces(Array.isArray(rows) ? (rows as Place[]) : []);
      } catch (error) {
       
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

    const placesChannel = supabase
      .channel("places-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "places" },
        (payload) => {
          const updated = payload.new as Place;
          setPlaces((prev) =>
            prev.map((p) => (p.id === updated.id ? { ...p, has_active_offer: updated.has_active_offer } : p))
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(placesChannel);
    };
  }, []);

  // Fetch active VIP offers
  useEffect(() => {
    const fetchActiveOffers = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("vip_offers")
        .select("place_id")
        .eq("is_active", true)
        .or(`start_time.is.null,start_time.lte.${now}`)
        .or(`end_time.is.null,end_time.gte.${now}`);
      if (data) {
        setActiveVipPlaceIds(new Set(data.map((d: any) => d.place_id)));
      }
    };
    fetchActiveOffers();
  }, [refreshSignal]);

  // Fetch trending + vibe pins
  useEffect(() => {
    const fetchVibeData = async () => {
      const { data } = await supabase
        .from("vibes")
        .select("id, location, likes, super_vibes, image_url, mood, latitude, longitude, created_at, media_type, is_official")
        .order("created_at", { ascending: false })
        .limit(500);
      if (data) {
        const scored = (data as any[])
          .filter((v) => v.location)
          .map((v) => ({ location: v.location as string, score: (v.likes || 0) + (v.super_vibes || 0) * 3 }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        setTrendingLocations(new Set(scored.map((s) => s.location.toLowerCase())));
        setVibePins((data as any[]).filter((v) => v.latitude !== null && v.longitude !== null));

        // Compute heat points for heatmap layer
        const SIX_H = 6 * 60 * 60 * 1000;
        const now = Date.now();
        const points: [number, number, number][] = (data as any[])
          .filter(v => v.latitude && v.longitude)
          .map(v => {
            const age = now - new Date(v.created_at).getTime();
            const freshness = Math.max(0, 1 - age / SIX_H);
            const intensity = (freshness * 0.5) + ((v.likes || 0) * 0.03) + ((v.super_vibes || 0) * 0.08);
            return [v.latitude, v.longitude, Math.min(1, intensity)] as [number, number, number];
          });
        setHeatPoints(points);
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

  return { places, vibePins, heatPoints, trendingLocations, placesLoading, placesError, activeVipPlaceIds };
}

export function useMapInstance(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Init map — NO tile layer here, MapThemeManager handles it
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MARRAKECH_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

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
        setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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

  return { mapRef, userMarkerRef, userPosition, handleGeolocate, handleRecenter };
}
