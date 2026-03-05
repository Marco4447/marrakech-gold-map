import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation } from "./useUserLocation";
import { getDistanceMeters } from "@/lib/energy";

export interface NearbyPlace {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  latitude: number;
  longitude: number;
  is_partner: boolean;
  distance: number;
}

const PROXIMITY_RADIUS_M = 100;
const COOLDOWN_MS = 30 * 60 * 1000; // 30 min per place

export function useProximityDetection(userId: string | undefined) {
  const [nearbyPlace, setNearbyPlace] = useState<NearbyPlace | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const userLocation = useUserLocation();
  const cooldowns = useRef<Map<string, number>>(new Map());
  const lastCheckRef = useRef<string | null>(null);

  // Load places and check proximity
  useEffect(() => {
    if (!userLocation || !userId) return;

    const key = `${userLocation.lat.toFixed(4)},${userLocation.lng.toFixed(4)}`;
    if (key === lastCheckRef.current) return;
    lastCheckRef.current = key;

    const check = async () => {
      const { data: places } = await supabase
        .from("places")
        .select("id, name, category, image_url, latitude, longitude, is_partner");

      if (!places || places.length === 0) return;

      const now = Date.now();
      let closest: NearbyPlace | null = null;
      let minDist = Infinity;

      for (const p of places) {
        const dist = getDistanceMeters(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
        if (dist <= PROXIMITY_RADIUS_M && dist < minDist) {
          // Check cooldown
          const lastPost = cooldowns.current.get(p.id);
          if (lastPost && now - lastPost < COOLDOWN_MS) continue;

          minDist = dist;
          closest = { ...p, distance: Math.round(dist) };
        }
      }

      if (closest) {
        setNearbyPlace(closest);
        setDismissed(false);
      } else {
        setNearbyPlace(null);
      }
    };

    check();
  }, [userLocation, userId]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const markPosted = useCallback((placeId: string) => {
    cooldowns.current.set(placeId, Date.now());
    setNearbyPlace(null);
    setDismissed(false);
  }, []);

  return {
    nearbyPlace: dismissed ? null : nearbyPlace,
    dismiss,
    markPosted,
  };
}
