import { useState, useEffect } from "react";
import { Instagram, Loader2, RefreshCw, Plus, Trash2, Zap, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface PlaceWithInsta {
  id: string;
  name: string;
  instagram_handle: string | null;
  category: string | null;
}

export default function AdminInstagramScraper() {
  const [places, setPlaces] = useState<PlaceWithInsta[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapingPlaceId, setScrapingPlaceId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [handleInput, setHandleInput] = useState("");
  const [lastResult, setLastResult] = useState<{ imported: number; results?: any[] } | null>(null);

  const fetchPlaces = async () => {
    const { data } = await supabase
      .from("places")
      .select("id, name, instagram_handle, category")
      .order("name");
    setPlaces((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPlaces(); }, []);

  const updateHandle = async (placeId: string, handle: string) => {
    const cleanHandle = handle.replace(/^@/, "").trim();
    const { error } = await supabase
      .from("places")
      .update({ instagram_handle: cleanHandle || null } as any)
      .eq("id", placeId);
    if (error) { toast.error("Erreur sauvegarde"); return; }
    toast.success(cleanHandle ? `@${cleanHandle} lié` : "Handle supprimé");
    setEditingId(null);
    setHandleInput("");
    fetchPlaces();
  };

  const runScrape = async (placeId?: string) => {
    if (placeId) setScrapingPlaceId(placeId);
    else setScraping(true);

    try {
      const { data, error } = await supabase.functions.invoke("scrape-instagram-feed", {
        body: placeId ? { place_id: placeId } : {},
      });
      if (error) throw error;
      setLastResult(data);
      toast.success(`${data.imported} vibes importées !`);
      fetchPlaces();
    } catch (err: any) {
      toast.error(err.message || "Erreur scraping");
    } finally {
      setScraping(false);
      setScrapingPlaceId(null);
    }
  };

  const configuredPlaces = places.filter(p => p.instagram_handle);
  const unconfiguredPlaces = places.filter(p => !p.instagram_handle);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Instagram className="w-5 h-5 text-[#E4405F]" />
            Auto-Import Instagram
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scrape automatique des profils publics → Vibes officielles
          </p>
        </div>
        <button
          onClick={() => runScrape()}
          disabled={scraping || configuredPlaces.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-primary-foreground disabled:opacity-50 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #F77737, #E4405F, #833AB4)" }}
        >
          {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Scraper tout ({configuredPlaces.length})
        </button>
      </div>

      {/* Result banner */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-gold/30 bg-gold/5 p-3"
          >
            <p className="text-xs font-bold text-gold flex items-center gap-2">
              <Check className="w-4 h-4" />
              {lastResult.imported} vibes importées
            </p>
            {lastResult.results?.map((r: any, i: number) => (
              <p key={i} className="text-[10px] text-muted-foreground mt-1">
                {r.place}: @{r.handle} → {r.imported} importées
                {r.errors?.length > 0 && ` (${r.errors.length} erreurs)`}
              </p>
            ))}
            <button
              onClick={() => setLastResult(null)}
              className="mt-2 text-[10px] text-muted-foreground underline"
            >
              Fermer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning */}
      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 flex gap-2">
        <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground">
          <strong className="text-foreground">⚠️ Limites :</strong> Instagram bloque parfois les requêtes serveur. 
          Le scraping fonctionne sur les profils <strong>publics</strong> uniquement et peut échouer si le rate limit est atteint. 
          Résultats variables selon les protections anti-bot d'Instagram.
        </p>
      </div>

      {/* Configured places */}
      {configuredPlaces.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-foreground">Profils configurés ({configuredPlaces.length})</h3>
          {configuredPlaces.map(place => (
            <div
              key={place.id}
              className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{place.name}</p>
                <p className="text-xs text-[#E4405F]">@{place.instagram_handle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => runScrape(place.id)}
                  disabled={scrapingPlaceId === place.id}
                  className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-gold/40 transition-colors"
                >
                  {scrapingPlaceId === place.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => updateHandle(place.id, "")}
                  className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-destructive/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add handle to a place */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-foreground">Ajouter un profil Instagram</h3>
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <select
            value={editingId || ""}
            onChange={e => { setEditingId(e.target.value || null); setHandleInput(""); }}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
          >
            <option value="">Sélectionner un lieu…</option>
            {unconfiguredPlaces.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.category ? `(${p.category})` : ""}
              </option>
            ))}
          </select>

          {editingId && (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  value={handleInput}
                  onChange={e => setHandleInput(e.target.value)}
                  placeholder="nom_instagram"
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                />
              </div>
              <button
                onClick={() => editingId && updateHandle(editingId, handleInput)}
                disabled={!handleInput.trim()}
                className="px-4 py-2 rounded-lg bg-gold/20 text-gold text-xs font-bold disabled:opacity-50 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
