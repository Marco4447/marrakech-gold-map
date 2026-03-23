import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Bookmark, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/hooks/useAuth";

interface SavedVibe {
  id: string;
  image_url: string;
  caption: string | null;
  likes: number;
  location: string | null;
  created_at: string;
}

export default function SavedVibesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const [vibes, setVibes] = useState<SavedVibe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookmarkedIds.size === 0) {
      setVibes([]);
      setLoading(false);
      return;
    }
    const fetchVibes = async () => {
      const { data } = await supabase
        .from("vibes")
        .select("id, image_url, caption, likes, location, created_at")
        .in("id", Array.from(bookmarkedIds))
        .order("created_at", { ascending: false });
      if (data) setVibes(data);
      setLoading(false);
    };
    fetchVibes();
  }, [bookmarkedIds]);

  if (!user) {
    return (
      <div className="h-[100dvh] bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Connecte-toi pour voir tes vibes sauvegardées</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="active:scale-90 transition-transform">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <Bookmark className="w-5 h-5 text-foreground" />
        <h1 className="text-base font-bold text-foreground">Vibes sauvegardées</h1>
        <span className="text-xs text-muted-foreground ml-auto">{vibes.length}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vibes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-3">
            <Bookmark className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1.5">Rien ici pour l'instant</h2>
          <p className="text-sm text-muted-foreground">Sauvegarde des vibes depuis le feed en appuyant sur l'icône bookmark.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {vibes.map((vibe) => (
            <Link key={vibe.id} to={`/vibe/${vibe.id}`} className="relative aspect-square group">
              <img
                src={vibe.image_url}
                alt={vibe.caption || "Vibe"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="flex items-center gap-1 text-white text-sm font-bold">
                  <Heart className="w-4 h-4 fill-white" />
                  {vibe.likes}
                </span>
              </div>
              {vibe.location && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                  <p className="text-2xs text-white/90 truncate">{vibe.location}</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
