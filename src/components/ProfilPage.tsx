import { useEffect, useState, useCallback } from "react";
import { Settings, Heart, MapPin, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfilPageProps {
  onOpenAdmin?: () => void;
}

interface Vibe {
  id: string;
  image_url: string;
  caption: string | null;
  location: string | null;
  likes: number;
  username: string | null;
  created_at: string;
}

function getDeviceId(): string {
  let id = localStorage.getItem("wk_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wk_device_id", id);
  }
  return id;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

export default function ProfilPage({ onOpenAdmin }: ProfilPageProps) {
  const [favorites, setFavorites] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const deviceId = getDeviceId();
  const { profile, signOut } = useAuth();

  const fetchFavorites = useCallback(async () => {
    const { data: likes } = await supabase
      .from("vibe_likes")
      .select("vibe_id")
      .eq("device_id", deviceId);

    if (likes && likes.length > 0) {
      const ids = likes.map((l: any) => l.vibe_id);
      const { data: vibes } = await supabase
        .from("vibes")
        .select("*")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (vibes) setFavorites(vibes);
    }
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <h1 className="font-display text-xl font-bold">
          <span className="text-gold">Mon</span>
          <span className="text-foreground"> Profil</span>
        </h1>
      </div>

      {/* Profile card */}
      <div className="flex flex-col items-center px-6 pt-8 pb-4">
        <Avatar className="w-20 h-20 mb-3 border-2 border-gold/30">
          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Profil"} />
          <AvatarFallback className="bg-gold/10 text-gold font-display text-xl">
            {profile?.full_name?.charAt(0)?.toUpperCase() || "W"}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-display text-lg font-semibold text-foreground mb-0.5">
          {profile?.full_name || "Explorateur"}
        </h2>
        <p className="text-muted-foreground text-xs text-center max-w-xs">
          {profile?.email || "Tes coups de cœur sont sauvegardés ici."}
        </p>

        {/* Logout button */}
        <button
          onClick={signOut}
          className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors bg-surface border border-border rounded-xl px-4 py-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          Se déconnecter
        </button>
      </div>

      {/* Mes Favoris */}
      <div className="px-5 pt-4">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-4 h-4 text-gold fill-gold" />
          <h3 className="font-display text-sm font-semibold text-foreground">Mes Favoris</h3>
          <span className="text-xs text-muted-foreground">({favorites.length})</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-surface animate-pulse rounded-xl" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-gold/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aucun favori pour le moment.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Like des stories dans l'onglet Live pour les retrouver ici !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((vibe, i) => (
              <motion.div
                key={vibe.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-card border border-border"
              >
                <img
                  src={vibe.image_url}
                  alt={vibe.caption || "Favori"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                <div className="absolute bottom-0 inset-x-0 p-2.5">
                  <p className="text-[11px] font-semibold text-foreground truncate">
                    {vibe.username || "Anonyme"}
                  </p>
                  {vibe.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-gold" />
                      <span className="text-[10px] text-foreground/70 truncate">{vibe.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-gold text-gold" />
                      <span className="text-[10px] font-bold text-gold">{vibe.likes}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">{timeAgo(vibe.created_at)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden admin button */}
      <button
        onClick={onOpenAdmin}
        className="fixed bottom-24 right-5 w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold/30 transition-colors z-[1500]"
        title="Admin"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}
