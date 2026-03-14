import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, Search, Loader2, Check, MapPin, ChevronDown, ChevronUp, Crown, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminVenueEditor from "./AdminVenueEditor";

interface Place {
  id: string;
  name: string;
  category: string | null;
  neighborhood: string | null;
  is_partner: boolean;
  listing_tier: string | null;
  has_active_offer: boolean;
  rating: number | null;
  image_url: string | null;
}

const CATEGORIES = [
  "Restaurant", "Bar", "Nightlife", "Rooftop", "Café", "Street Food",
  "Chill", "Cocktail Bar", "Food", "Attraction", "Activity", "Hôtel", "Secret",
];

export default function AdminSpotsManager() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "category" | "neighborhood">("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Create form
  const [spotName, setSpotName] = useState("");
  const [spotCategory, setSpotCategory] = useState("");
  const [spotLat, setSpotLat] = useState("");
  const [spotLng, setSpotLng] = useState("");
  const [spotNeighborhood, setSpotNeighborhood] = useState("");
  const [spotAddress, setSpotAddress] = useState("");
  const [spotDescription, setSpotDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPlaces = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("places")
      .select("id, name, category, neighborhood, is_partner, listing_tier, has_active_offer, rating, image_url")
      .order("name");
    if (data) setPlaces(data);
    if (error) toast.error("Erreur chargement des lieux");
    setLoading(false);
  };

  useEffect(() => { fetchPlaces(); }, []);

  const filtered = places
    .filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat && p.category !== filterCat) return false;
      return true;
    })
    .sort((a, b) => {
      const valA = (a[sortBy] || "").toString().toLowerCase();
      const valB = (b[sortBy] || "").toString().toLowerCase();
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
    }
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    const confirmed = window.confirm(`Supprimer ${selected.size} lieu(x) définitivement ? Cette action est irréversible.`);
    if (!confirmed) return;

    setDeleting(true);
    const ids = Array.from(selected);
    const { error } = await supabase.from("places").delete().in("id", ids);
    if (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } else {
      toast.success(`${ids.length} lieu(x) supprimé(s)`);
      setPlaces(prev => prev.filter(p => !selected.has(p.id)));
      setSelected(new Set());
    }
    setDeleting(false);
  };

  const handleCreate = async () => {
    if (!spotName || !spotCategory || !spotLat || !spotLng) {
      toast.error("Remplis les champs obligatoires (*)");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("places").insert({
      name: spotName.trim(),
      category: spotCategory,
      latitude: parseFloat(spotLat),
      longitude: parseFloat(spotLng),
      description: spotDescription.trim() || null,
      neighborhood: spotNeighborhood.trim() || null,
      address: spotAddress.trim() || null,
    });
    if (error) {
      toast.error("Erreur lors de la création");
      console.error(error);
    } else {
      toast.success("Lieu créé avec succès !");
      setSpotName(""); setSpotCategory(""); setSpotLat(""); setSpotLng("");
      setSpotNeighborhood(""); setSpotAddress(""); setSpotDescription("");
      setShowCreate(false);
      fetchPlaces();
    }
    setSaving(false);
  };

  const tierBadge = (tier: string | null) => {
    if (tier === "featured") return <span className="text-[9px] font-bold text-gold bg-gold/15 px-1.5 py-0.5 rounded">FEATURED</span>;
    if (tier === "premium") return <span className="text-[9px] font-bold text-gold/70 bg-gold/10 px-1.5 py-0.5 rounded">PREMIUM</span>;
    if (tier === "basic") return <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">BASIC</span>;
    return null;
  };

  const SortHeader = ({ label, field }: { label: string; field: "name" | "category" | "neighborhood" }) => (
    <button
      onClick={() => { if (sortBy === field) setSortAsc(!sortAsc); else { setSortBy(field); setSortAsc(true); } }}
      className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
    >
      {label}
      {sortBy === field && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Header with count + actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-gold" />
          {places.length} établissements
        </h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold/15 text-gold text-xs font-semibold hover:bg-gold/25 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau lieu
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Créer un lieu</h4>
              <input value={spotName} onChange={e => setSpotName(e.target.value)} placeholder="Nom *"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
              <div className="grid grid-cols-2 gap-2">
                <select value={spotCategory} onChange={e => setSpotCategory(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground">
                  <option value="">Catégorie *</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={spotNeighborhood} onChange={e => setSpotNeighborhood(e.target.value)} placeholder="Quartier"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={spotLat} onChange={e => setSpotLat(e.target.value)} placeholder="Latitude *" type="number" step="any"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
                <input value={spotLng} onChange={e => setSpotLng(e.target.value)} placeholder="Longitude *" type="number" step="any"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
              </div>
              <input value={spotAddress} onChange={e => setSpotAddress(e.target.value)} placeholder="Adresse"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
              <textarea value={spotDescription} onChange={e => setSpotDescription(e.target.value)} placeholder="Description" rows={2}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none" />
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
                  Annuler
                </button>
                <button onClick={handleCreate} disabled={saving || !spotName || !spotCategory || !spotLat || !spotLng}
                  className="flex-1 py-2 rounded-lg bg-gold text-primary-foreground text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5 hover:bg-gold-light transition-colors">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Créer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un lieu…"
            className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="bg-surface border border-border rounded-lg px-2 py-2 text-xs text-foreground min-w-[100px]">
          <option value="">Toutes cat.</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5">
          <span className="text-xs font-semibold text-destructive">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Supprimer
          </button>
        </motion.div>
      )}

      {/* Table header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface/50 rounded-lg border border-border/50">
        <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length}
          onChange={toggleAll}
          className="w-3.5 h-3.5 rounded border-border accent-gold shrink-0" />
        <div className="flex-1 grid grid-cols-3 gap-1">
          <SortHeader label="Nom" field="name" />
          <SortHeader label="Catégorie" field="category" />
          <SortHeader label="Quartier" field="neighborhood" />
        </div>
        <span className="w-8" /> {/* edit spacer */}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
        </div>
      )}

      {/* List */}
      {!loading && (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {filtered.map(place => (
            <div key={place.id}>
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  selected.has(place.id) ? "bg-gold/5 border border-gold/20" : "bg-surface border border-border/40 hover:border-border"
                }`}
                onClick={() => toggleSelect(place.id)}
              >
                <input
                  type="checkbox"
                  checked={selected.has(place.id)}
                  onChange={() => toggleSelect(place.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-3.5 h-3.5 rounded border-border accent-gold shrink-0"
                />

                {/* Logo / avatar */}
                <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                  {place.image_url ? (
                    <img src={place.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 grid grid-cols-3 gap-1 min-w-0">
                  <div className="truncate">
                    <span className="text-xs font-medium text-foreground">{place.name}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {place.is_partner && <Crown className="w-3 h-3 text-gold" />}
                      {tierBadge(place.listing_tier)}
                      {place.has_active_offer && <span className="text-[9px] text-gold">🎁</span>}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate self-center">{place.category || "—"}</span>
                  <span className="text-[11px] text-muted-foreground truncate self-center">{place.neighborhood || "—"}</span>
                </div>

                {place.rating && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="w-3 h-3 text-gold fill-gold" />
                    <span className="text-[10px] text-muted-foreground">{place.rating}</span>
                  </div>
                )}

                <button
                  onClick={e => { e.stopPropagation(); setEditingId(editingId === place.id ? null : place.id); }}
                  className="p-1.5 rounded-lg hover:bg-gold/10 text-muted-foreground hover:text-gold transition-colors shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inline editor */}
              <AnimatePresence>
                {editingId === place.id && (
                  <AdminVenueEditor placeId={place.id} onClose={() => { setEditingId(null); fetchPlaces(); }} />
                )}
              </AnimatePresence>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              Aucun lieu trouvé
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <div className="text-[10px] text-muted-foreground text-center pt-2">
          {filtered.length} / {places.length} lieu(x) affiché(s)
          {search || filterCat ? " (filtré)" : ""}
        </div>
      )}
    </div>
  );
}
