import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Camera, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  placeId: string | null;
}

interface VenueForm {
  description: string;
  opening_hours: string;
  price_range: string;
  music_style: string;
  dress_code: string;
  image_url: string;
}

export default function VenueEditor({ userId, placeId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const [form, setForm] = useState<VenueForm>({
    description: "", opening_hours: "", price_range: "", music_style: "", dress_code: "", image_url: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!placeId) { setLoading(false); return; }
    supabase.from("places").select("name, description, opening_hours, price_range, music_style, dress_code, image_url")
      .eq("id", placeId).single()
      .then(({ data }) => {
        if (data) {
          setPlaceName(data.name);
          setForm({
            description: data.description || "",
            opening_hours: data.opening_hours || "",
            price_range: data.price_range || "",
            music_style: data.music_style || "",
            dress_code: data.dress_code || "",
            image_url: data.image_url || "",
          });
        }
        setLoading(false);
      });
  }, [placeId]);

  const handleImageUpload = async (file: File) => {
    if (!placeId) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `venues/${placeId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("vibes_media").upload(path, file, { contentType: file.type });
    if (error) { toast.error("Erreur upload"); setUploading(false); return; }
    const { data } = supabase.storage.from("vibes_media").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!placeId) return;
    setSaving(true);
    const { error } = await supabase.from("places").update({
      description: form.description.trim() || null,
      opening_hours: form.opening_hours.trim() || null,
      price_range: form.price_range.trim() || null,
      music_style: form.music_style.trim() || null,
      dress_code: form.dress_code.trim() || null,
      image_url: form.image_url.trim() || null,
    } as any).eq("id", placeId);
    if (error) toast.error("Erreur de sauvegarde");
    else toast.success("Fiche mise à jour !");
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-gold animate-spin" /></div>;
  }

  if (!placeId) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-muted-foreground">Aucun lieu associé à ton compte partenaire.</p>
        <p className="text-xs text-muted-foreground">Contacte l'admin pour lier ton établissement.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-5 space-y-1">
        <h3 className="font-display text-lg font-bold text-foreground">{placeName}</h3>
        <p className="text-[11px] text-muted-foreground">Modifie les informations de ta fiche venue.</p>
      </div>

      {/* Image */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Photo principale</label>
        {form.image_url ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-surface">
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setForm(f => ({ ...f, image_url: "" }))}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-foreground" />
            </button>
          </div>
        ) : (
          <label className="w-full aspect-video rounded-xl border-2 border-dashed border-gold/25 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold/50 transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 text-gold animate-spin" /> : <Camera className="w-6 h-6 text-gold/60" />}
            <span className="text-xs text-muted-foreground">{uploading ? "Upload..." : "Ajouter une photo"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
          </label>
        )}
      </div>

      {/* Fields */}
      <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} multiline placeholder="Décris ton établissement..." />
      <Field label="Horaires d'ouverture" value={form.opening_hours} onChange={v => setForm(f => ({ ...f, opening_hours: v }))} placeholder="Ex: 19h - 2h du matin" />
      <Field label="Gamme de prix" value={form.price_range} onChange={v => setForm(f => ({ ...f, price_range: v }))} placeholder="Ex: €€€" />
      <Field label="Style musical" value={form.music_style} onChange={v => setForm(f => ({ ...f, music_style: v }))} placeholder="Ex: Deep House, Afrobeats" />
      <Field label="Dress code" value={form.dress_code} onChange={v => setForm(f => ({ ...f, dress_code: v }))} placeholder="Ex: Smart casual" />

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Sauvegarder
      </button>
    </motion.div>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
  const cls = "w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50";
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls + " resize-none"} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}
