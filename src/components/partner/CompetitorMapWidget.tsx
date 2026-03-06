import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import L from "leaflet";

interface NearbyPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string | null;
  status: "inactive" | "active" | "trending";
  isOwn: boolean;
}

interface Props {
  placeId: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  inactive: "#6b7280",
  active: "#f59e0b",
  trending: "#ef4444",
  own: "#22c55e",
};

export default function CompetitorMapWidget({ placeId }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState<NearbyPlace[]>([]);
  const [trendingAlert, setTrendingAlert] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) return;
    const load = async () => {
      // Get own place coords
      const { data: own } = await supabase.from("places").select("id, name, latitude, longitude, category").eq("id", placeId).single();
      if (!own) return;

      // Get all places within ~3km
      const { data: allPlaces } = await supabase.from("places").select("id, name, latitude, longitude, category");
      if (!allPlaces) return;

      const radiusKm = 3;
      const filtered = allPlaces.filter(p => {
        const d = getDistanceKm(own.latitude, own.longitude, p.latitude, p.longitude);
        return d < radiusKm;
      });

      // Get today's vibes to determine active/trending
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todayVibes } = await supabase.from("vibes").select("location, likes, super_vibes")
        .gte("created_at", today.toISOString()).eq("is_official", true);

      const vibeCountByName = new Map<string, { count: number; score: number }>();
      (todayVibes || []).forEach(v => {
        if (!v.location) return;
        const loc = v.location.toLowerCase();
        const prev = vibeCountByName.get(loc) || { count: 0, score: 0 };
        vibeCountByName.set(loc, { count: prev.count + 1, score: prev.score + (v.likes || 0) + (v.super_vibes || 0) * 3 });
      });

      const result: NearbyPlace[] = filtered.map(p => {
        const isOwn = p.id === placeId;
        const nameKey = p.name.toLowerCase();
        const vibeData = vibeCountByName.get(nameKey);
        let status: "inactive" | "active" | "trending" = "inactive";
        if (vibeData) {
          status = vibeData.score >= 10 ? "trending" : "active";
        }
        return { ...p, status, isOwn };
      });

      setNearby(result);

      // Trending alert
      const trending = result.find(p => !p.isOwn && p.status === "trending");
      if (trending) setTrendingAlert(`${trending.name} est trending ce soir`);
    };
    load();
  }, [placeId]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current || nearby.length === 0) return;
    const own = nearby.find(p => p.isOwn);
    if (!own) return;

    const map = L.map(containerRef.current, {
      center: [own.latitude, own.longitude],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 18 }).addTo(map);

    nearby.forEach(p => {
      const color = p.isOwn ? STATUS_COLORS.own : STATUS_COLORS[p.status];
      const size = p.isOwn ? 16 : p.status === "trending" ? 14 : 10;
      const pulse = p.status === "trending" || p.isOwn;
      const icon = L.divIcon({
        className: "",
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
        html: `
          <div style="position:relative;width:${size * 2}px;height:${size * 2}px;display:flex;align-items:center;justify-content:center;">
            ${pulse ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ""}
            <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 8px ${color}80;"></div>
          </div>
        `,
      });
      L.marker([p.latitude, p.longitude], { icon })
        .bindTooltip(p.name, { direction: "top", className: "!bg-card !text-foreground !border-border !text-[10px] !font-semibold !px-2 !py-1 !rounded-lg" })
        .addTo(map);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [nearby]);

  if (!placeId) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-gold" /> Activité autour de toi
      </h3>

      {trendingAlert && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2.5"
        >
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-foreground font-medium">{trendingAlert}</p>
        </motion.div>
      )}

      <div ref={containerRef} className="h-52 rounded-xl overflow-hidden border border-border" />

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.own }} /> Toi</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.active }} /> Actif</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.trending }} /> Trending</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.inactive }} /> Inactif</span>
      </div>
    </div>
  );
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
