import { reportError } from "@/lib/errorReporting";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Loader2, Plus, Trash2, ToggleLeft, ToggleRight, Clock, Users, Search } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface VipOffer {
  id: string;
  title: string;
  description: string;
  perk_type: string;
  start_time: string | null;
  end_time: string | null;
  max_redemptions: number | null;
  limit_per_user: number;
  is_active: boolean;
  created_at: string;
  place_id: string;
  place_name?: string;
  redemption_count?: number;
}

interface Place {
  id: string;
  name: string;
}

const PERK_TYPES = [
  { key: "drink", emoji: "🍸", label: "Boisson" },
  { key: "food", emoji: "🍽️", label: "Food" },
  { key: "entry", emoji: "🎫", label: "Entrée" },
  { key: "discount", emoji: "💰", label: "Réduction" },
  { key: "experience", emoji: "✨", label: "Expérience" },
];

export default function AdminVipOffers() {
  const [offers, setOffers] = useState<VipOffer[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    place_id: "",
    title: "",
    description: "",
    perk_type: "drink",
    start_time: "",
    end_time: "",
    max_redemptions: "",
    limit_per_user: "1",
  });

  const fetchAll = async () => {
    const [offersRes, placesRes] = await Promise.all([
      supabase.from("vip_offers").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("places").select("id, name").order("name"),
    ]);

    const placeMap = new Map((placesRes.data || []).map((p: any) => [p.id, p.name]));
    setPlaces((placesRes.data || []) as Place[]);

    // Get redemption counts
    const enriched = await Promise.all(
      (offersRes.data || []).map(async (o: any) => {
        const { count } = await supabase
          .from("vip_redemptions")
          .select("id", { count: "exact", head: true })
          .eq("offer_id", o.id);
        return { ...o, place_name: placeMap.get(o.place_id) || "?", redemption_count: count ?? 0 } as VipOffer;
      })
    );

    setOffers(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async () => {
    if (!form.place_id || !form.title || !form.description) {
      toast.error("Sélectionne un lieu et remplis titre + description");
      return;
    }
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("vip_offers").insert({
      place_id: form.place_id,
      title: form.title,
      description: form.description,
      perk_type: form.perk_type,
      start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
      end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
      max_redemptions: form.max_redemptions ? parseInt(form.max_redemptions) : null,
      limit_per_user: parseInt(form.limit_per_user) || 1,
      created_by: user!.id,
    });
    if (error) { toast.error("Erreur"); reportError(error, { context: "AdminVipOffers" }); }
    else {
      toast.success("Offre VIP créée !");
      setForm({ place_id: "", title: "", description: "", perk_type: "drink", start_time: "", end_time: "", max_redemptions: "", limit_per_user: "1" });
      setShowForm(false);
      fetchAll();
    }
    setCreating(false);
  };

  const handleToggle = async (offer: VipOffer) => {
    await supabase.from("vip_offers").update({ is_active: !offer.is_active }).eq("id", offer.id);
    toast.success(offer.is_active ? "Offre désactivée" : "Offre activée");
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette offre VIP ?")) return;
    await supabase.from("vip_offers").delete().eq("id", id);
    toast.success("Offre supprimée");
    fetchAll();
  };

  const filtered = offers.filter((o) =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) || (o.place_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader2 className="w-5 h-5 text-gold animate-spin mx-auto my-8" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <Gift className="w-4 h-4 text-gold" /> Offres VIP ({offers.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold/15 text-gold text-xs font-semibold">
          <Plus className="w-3 h-3" /> Nouvelle
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par lieu ou titre…"
          className="w-full text-xs bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-foreground placeholder:text-muted-foreground" />
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="space-y-3 p-4 rounded-2xl border border-gold/20 bg-card/80">
            <select value={form.place_id} onChange={(e) => setForm({ ...form, place_id: e.target.value })}
              className="w-full text-sm bg-surface border border-border rounded-xl px-3 py-2.5 text-foreground">
              <option value="">— Sélectionner un lieu —</option>
              {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Titre de l'offre" maxLength={80}
              className="w-full text-sm bg-surface border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description" rows={2}
              className="w-full text-sm bg-surface border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground resize-none" />
            <div className="flex gap-1.5 flex-wrap">
              {PERK_TYPES.map((p) => (
                <button key={p.key} onClick={() => setForm({ ...form, perk_type: p.key })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    form.perk_type === p.key ? "bg-gold/20 border border-gold/40 text-gold" : "bg-surface border border-border text-muted-foreground"
                  }`}>
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-2xs text-muted-foreground mb-0.5 block">Début</label>
                <input type="datetime-local" value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full text-xs bg-surface border border-border rounded-lg px-2 py-1.5 text-foreground" />
              </div>
              <div>
                <label className="text-2xs text-muted-foreground mb-0.5 block">Fin</label>
                <input type="datetime-local" value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full text-xs bg-surface border border-border rounded-lg px-2 py-1.5 text-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-2xs text-muted-foreground mb-0.5 block">Max validations</label>
                <input type="number" value={form.max_redemptions}
                  onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })}
                  placeholder="Illimité"
                  className="w-full text-xs bg-surface border border-border rounded-lg px-2 py-1.5 text-foreground placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-2xs text-muted-foreground mb-0.5 block">Limite / personne</label>
                <input type="number" value={form.limit_per_user}
                  onChange={(e) => setForm({ ...form, limit_per_user: e.target.value })}
                  className="w-full text-xs bg-surface border border-border rounded-lg px-2 py-1.5 text-foreground" />
              </div>
            </div>
            <button onClick={handleCreate} disabled={creating}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-primary-foreground active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Créer l'offre VIP
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offers list */}
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Aucune offre VIP.</p>
      ) : (
        filtered.map((offer) => (
          <div key={offer.id}
            className={`p-4 rounded-xl border ${offer.is_active ? "border-gold/20 bg-card/80" : "border-border bg-surface/50 opacity-60"}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl">{PERK_TYPES.find((p) => p.key === offer.perk_type)?.emoji || "🎁"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{offer.title}</p>
                <p className="text-2xs text-gold font-medium">{offer.place_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{offer.description}</p>
                <div className="flex items-center gap-3 mt-2 text-2xs text-muted-foreground">
                  {offer.end_time && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(offer.end_time).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Users className="w-3 h-3" />
                    {offer.redemption_count} validé{(offer.redemption_count || 0) > 1 ? "s" : ""}
                    {offer.max_redemptions && ` / ${offer.max_redemptions}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleToggle(offer)} className="p-1.5 text-muted-foreground hover:text-gold">
                  {offer.is_active ? <ToggleRight className="w-5 h-5 text-gold" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => handleDelete(offer.id)} className="p-1.5 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
