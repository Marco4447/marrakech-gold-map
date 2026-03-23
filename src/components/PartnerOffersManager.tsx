import { reportError } from "@/lib/errorReporting";
import { useState, useEffect } from "react";
import { Plus, Trash2, Gift, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Offer {
  id: string;
  title: string;
  description: string;
  vip_only: boolean;
  expiration_date: string | null;
  is_active: boolean;
  place_id: string;
}

export default function PartnerOffersManager({ placeId }: { placeId: string }) {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", vip_only: true, expiration_date: "" });

  const fetchOffers = async () => {
    const { data } = await supabase
      .from("partner_offers")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });
    if (data) setOffers(data as Offer[]);
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, [placeId]);

  const handleCreate = async () => {
    if (!user || !form.title || !form.description) { toast.error("Remplis tous les champs"); return; }
    setCreating(true);
    const { error } = await supabase.from("partner_offers").insert({
      place_id: placeId,
      title: form.title,
      description: form.description,
      vip_only: form.vip_only,
      expiration_date: form.expiration_date || null,
      created_by: user.id,
    });
    if (error) { toast.error("Erreur"); reportError(error, { context: "PartnerOffersManager" }); }
    else { toast.success("Offre créée !"); setForm({ title: "", description: "", vip_only: true, expiration_date: "" }); fetchOffers(); }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("partner_offers").delete().eq("id", id);
    toast.success("Offre supprimée");
    fetchOffers();
  };

  if (loading) return <Loader2 className="w-5 h-5 text-gold animate-spin mx-auto my-4" />;

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
        <Gift className="w-4 h-4 text-gold" /> Offres VIP
      </h3>

      {/* Existing offers */}
      {offers.map((offer) => (
        <div key={offer.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{offer.title}</p>
            <p className="text-xs text-muted-foreground">{offer.description}</p>
          </div>
          <button onClick={() => handleDelete(offer.id)} className="p-2 text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Create form */}
      <div className="space-y-2 p-3 rounded-xl border border-border bg-card">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex: Cocktail offert avant 20h"
          className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description de l'offre"
          rows={2}
          className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none"
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={form.vip_only}
              onChange={(e) => setForm({ ...form, vip_only: e.target.checked })}
              className="rounded border-border"
            />
            VIP uniquement
          </label>
          <input
            type="date"
            value={form.expiration_date}
            onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
            className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-foreground"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gold/20 text-gold text-sm font-semibold hover:bg-gold/30 transition-colors"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Créer une offre
        </button>
      </div>
    </div>
  );
}
