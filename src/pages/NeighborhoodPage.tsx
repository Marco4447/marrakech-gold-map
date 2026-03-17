import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Flame, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NEIGHBORHOODS: Record<string, { name: string; emoji: string; description: string; color: string }> = {
  medina: { name: "Médina", emoji: "🕌", description: "Le cœur historique", color: "hsl(30,70%,45%)" },
  gueliz: { name: "Guéliz", emoji: "🏙️", description: "Le Marrakech moderne", color: "hsl(220,60%,50%)" },
  hivernage: { name: "Hivernage", emoji: "🌴", description: "Nightlife & hotels", color: "hsl(280,50%,55%)" },
  palmeraie: { name: "Palmeraie", emoji: "🏝️", description: "Luxe & piscines", color: "hsl(160,50%,40%)" },
};

interface Place {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  is_partner: boolean;
  neighborhood: string | null;
}

interface Vibe {
  id: string;
  image_url: string;
  location: string | null;
  likes: number;
  mood: string | null;
  created_at: string;
  media_type: string;
}

export default function NeighborhoodPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const hood = slug ? NEIGHBORHOODS[slug] : null;

  const [places, setPlaces] = useState<Place[]>([]);
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hood || !slug) return;
    const fetchData = async () => {
      try {
        const [placesRes, vibesRes] = await Promise.all([
          supabase
            .from("places")
            .select("id, name, category, image_url, is_partner, neighborhood")
            .ilike("neighborhood", `%${hood.name}%`)
            .order("is_partner", { ascending: false }),
          supabase
            .from("vibes")
            .select("id, image_url, location, likes, mood, created_at, media_type")
            .order("created_at", { ascending: false })
            .limit(200),
        ]);
        if (placesRes.data) setPlaces(placesRes.data);
        if (vibesRes.data) setVibes(vibesRes.data);
      } catch {
        toast.error("Erreur de chargement");
      }
      setLoading(false);
    };
    fetchData();
  }, [slug, hood]);

  const placeNames = useMemo(() => new Set(places.map(p => p.name.toLowerCase())), [places]);

  const neighborhoodVibes = useMemo(
    () => vibes.filter(v => v.location && placeNames.has(v.location.trim().toLowerCase())),
    [vibes, placeNames]
  );

  const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
  const recentVibes = useMemo(
    () => neighborhoodVibes.filter(v => new Date(v.created_at).getTime() > threeHoursAgo),
    [neighborhoodVibes, threeHoursAgo]
  );

  const latestVibes = neighborhoodVibes.slice(0, 12);

  // Top spots this week
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const topSpots = useMemo(() => {
    const counts: Record<string, number> = {};
    neighborhoodVibes
      .filter(v => new Date(v.created_at).getTime() > weekAgo)
      .forEach(v => {
        const key = v.location?.trim().toLowerCase() || "";
        if (key) counts[key] = (counts[key] || 0) + 1;
      });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => {
        const place = places.find(p => p.name.toLowerCase() === name);
        return { name: place?.name || name, count, place };
      });
  }, [neighborhoodVibes, places, weekAgo]);

  // Dominant mood
  const dominantMood = useMemo(() => {
    const counts: Record<string, number> = {};
    recentVibes.forEach(v => { if (v.mood) counts[v.mood] = (counts[v.mood] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const moodEmojis: Record<string, string> = { hot: "🔥", chill: "🍸", secret: "✨", foodie: "🥗" };
    return top ? { key: top[0], emoji: moodEmojis[top[0]] || "🎉", count: top[1] } : null;
  }, [recentVibes]);

  if (!hood) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold text-foreground mb-2">Quartier introuvable</p>
        <button onClick={() => navigate("/")} className="text-sm text-gold underline">Retour</button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background overflow-y-auto no-scrollbar">
      {/* Hero */}
      <div className="relative px-4 pt-12 pb-6" style={{ background: `linear-gradient(135deg, ${hood.color}22, transparent)` }}>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-card/80 backdrop-blur-xl border border-border flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-4xl">{hood.emoji}</span>
          <h1 className="text-2xl font-bold text-foreground mt-2 font-display">{hood.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{hood.description}</p>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 pb-24">
          {/* Ambiance du moment */}
          <div className="px-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gold" /> Ambiance du moment
            </h2>
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{recentVibes.length}</p>
                <p className="text-[10px] text-muted-foreground">vibes 3h</p>
              </div>
              {dominantMood && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20">
                  <span>{dominantMood.emoji}</span>
                  <span className="text-xs font-semibold text-gold">{dominantMood.key}</span>
                </div>
              )}
              {recentVibes.length === 0 && (
                <p className="text-xs text-muted-foreground">Pas de vibes récentes</p>
              )}
            </div>
          </div>

          {/* Active spots */}
          <div className="px-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gold" /> Spots actifs · {places.length}
            </h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {places.map(place => (
                <Link
                  key={place.id}
                  to={`/venue/${place.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex-shrink-0 w-36"
                >
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-card border border-border relative">
                    {place.image_url ? (
                      <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-2xl">{hood.emoji}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-2">
                      <p className="text-xs font-bold text-foreground truncate">{place.name}</p>
                      {place.category && <p className="text-[10px] text-muted-foreground truncate">{place.category}</p>}
                      {place.is_partner && (
                        <span className="text-[9px] font-bold text-gold">⭐ Partenaire</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {places.length === 0 && (
                <p className="text-xs text-muted-foreground py-4">Aucun spot enregistré</p>
              )}
            </div>
          </div>

          {/* Live vibes grid */}
          {latestVibes.length > 0 && (
            <div className="px-4">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-gold" /> Vibes récentes
              </h2>
              <div className="grid grid-cols-3 gap-1">
                {latestVibes.map(vibe => (
                  <Link key={vibe.id} to={`/vibe/${vibe.id}`} className="aspect-square rounded-lg overflow-hidden bg-card">
                    <img src={vibe.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top spots de la semaine */}
          {topSpots.length > 0 && (
            <div className="px-4">
              <h2 className="text-sm font-bold text-foreground mb-2">🏆 Top spots de la semaine</h2>
              <div className="space-y-2">
                {topSpots.map((spot, i) => (
                  <div key={spot.name} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5">
                    <span className="text-base font-bold text-muted-foreground w-5 text-center">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{spot.name}</p>
                    </div>
                    <span className="text-xs font-bold text-gold">{spot.count} vibes</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
