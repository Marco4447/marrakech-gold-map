import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Loader2, Camera, X, ChevronDown, Link2, UtensilsCrossed, Wine, Info, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  placeId: string;
  onClose: () => void;
}

const DAYS = [
  { key: "lun", label: "Lundi" },
  { key: "mar", label: "Mardi" },
  { key: "mer", label: "Mercredi" },
  { key: "jeu", label: "Jeudi" },
  { key: "ven", label: "Vendredi" },
  { key: "sam", label: "Samedi" },
  { key: "dim", label: "Dimanche" },
] as const;

type DayKey = typeof DAYS[number]["key"];

interface DayHours { open: boolean; from: string; to: string; }
type WeekSchedule = Record<DayKey, DayHours>;

const CATEGORIES = ["Rooftop", "Restaurant", "Bar", "Nightclub", "Café", "Street Food", "Speakeasy", "Lounge", "Activity", "Attraction"];

const PRICE_OPTIONS = [
  { value: "€", label: "€", desc: "Économique" },
  { value: "€€", label: "€€", desc: "Modéré" },
  { value: "€€€", label: "€€€", desc: "Haut de gamme" },
  { value: "€€€€", label: "€€€€", desc: "Luxe" },
];

const DESC_MAX = 300;
const IMAGE_MAX_MB = 5;

function parseSchedule(raw: string): WeekSchedule {
  const defaults: WeekSchedule = Object.fromEntries(
    DAYS.map(d => [d.key, { open: false, from: "19:00", to: "02:00" }])
  ) as WeekSchedule;
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      DAYS.forEach(d => { if (parsed[d.key]) defaults[d.key] = { ...defaults[d.key], ...parsed[d.key] }; });
    }
  } catch { /* keep defaults */ }
  return defaults;
}

function scheduleToString(schedule: WeekSchedule): string { return JSON.stringify(schedule); }

function scheduleToDisplay(schedule: WeekSchedule): string {
  const openDays = DAYS.filter(d => schedule[d.key].open);
  if (openDays.length === 0) return "Fermé";
  if (openDays.length === 7) {
    const same = openDays.every(d => schedule[d.key].from === schedule[openDays[0].key].from && schedule[d.key].to === schedule[openDays[0].key].to);
    if (same) return `Tous les jours · ${schedule[openDays[0].key].from} – ${schedule[openDays[0].key].to}`;
  }
  return openDays.map(d => `${d.label.slice(0, 3)} ${schedule[d.key].from}–${schedule[d.key].to}`).join(" · ");
}

interface VenueForm {
  name: string;
  category: string;
  neighborhood: string;
  address: string;
  description: string;
  opening_hours: string;
  price_range: string;
  music_style: string;
  dress_code: string;
  image_url: string;
  menu_url: string;
  drinks_menu_url: string;
}

export default function AdminVenueEditor({ placeId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<VenueForm>({
    name: "", category: "", neighborhood: "", address: "",
    description: "", opening_hours: "", price_range: "",
    music_style: "", dress_code: "", image_url: "",
    menu_url: "", drinks_menu_url: "",
  });
  const [schedule, setSchedule] = useState<WeekSchedule>(parseSchedule(""));
  const [uploading, setUploading] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);

  useEffect(() => {
    supabase.from("places")
      .select("name, category, neighborhood, address, description, opening_hours, price_range, music_style, dress_code, image_url, menu_url, drinks_menu_url")
      .eq("id", placeId).single()
      .then(({ data }) => {
        if (data) {
          setForm({
            name: data.name || "",
            category: data.category || "",
            neighborhood: data.neighborhood || "",
            address: data.address || "",
            description: data.description || "",
            opening_hours: data.opening_hours || "",
            price_range: data.price_range || "",
            music_style: data.music_style || "",
            dress_code: data.dress_code || "",
            image_url: data.image_url || "",
            menu_url: data.menu_url || "",
            drinks_menu_url: data.drinks_menu_url || "",
          });
          setSchedule(parseSchedule(data.opening_hours || ""));
        }
        setLoading(false);
      });
  }, [placeId]);

  const handleImageUpload = async (file: File) => {
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) { toast.error(`Max ${IMAGE_MAX_MB} Mo`); return; }
    if (!file.type.startsWith("image/")) { toast.error("Format non supporté"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `venues/${placeId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("vibes_media").upload(path, file, { contentType: file.type });
    if (error) { toast.error("Erreur upload"); setUploading(false); return; }
    const { data } = supabase.storage.from("vibes_media").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
    toast.success("Photo mise à jour !");
  };

  const updateDay = (day: DayKey, patch: Partial<DayHours>) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nom requis"); return; }
    setSaving(true);
    const { error } = await supabase.from("places").update({
      name: form.name.trim(),
      category: form.category.trim() || null,
      neighborhood: form.neighborhood.trim() || null,
      address: form.address.trim() || null,
      description: form.description.trim().slice(0, DESC_MAX) || null,
      opening_hours: scheduleToString(schedule) || null,
      price_range: form.price_range.trim() || null,
      music_style: form.music_style.trim() || null,
      dress_code: form.dress_code.trim() || null,
      image_url: form.image_url.trim() || null,
      menu_url: form.menu_url.trim() || null,
      drinks_menu_url: form.drinks_menu_url.trim() || null,
    }).eq("id", placeId);
    if (error) toast.error("Erreur sauvegarde");
    else { toast.success("Fiche mise à jour ✨"); onClose(); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-gold animate-spin" /></div>;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
      className="bg-surface border border-border rounded-xl p-4 space-y-4 overflow-hidden"
    >
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gold" /> Fiche établissement
        </h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      {/* Photo */}
      <div className="space-y-2">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Photo cover (1200×675)</label>
        {form.image_url ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted max-h-32">
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setForm(f => ({ ...f, image_url: "" }))}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/70 backdrop-blur flex items-center justify-center">
              <X className="w-3 h-3 text-foreground" />
            </button>
          </div>
        ) : (
          <label className="w-full aspect-video max-h-24 rounded-xl border-2 border-dashed border-gold/25 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-gold/50 transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 text-gold animate-spin" /> : <Camera className="w-4 h-4 text-gold/60" />}
            <span className="text-[10px] text-muted-foreground">{uploading ? "Upload..." : "Ajouter photo"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
          </label>
        )}
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="Nom *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Catégorie</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground">
            <option value="">—</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <FormInput label="Quartier" value={form.neighborhood} onChange={v => setForm(f => ({ ...f, neighborhood: v }))} placeholder="Ex: Guéliz" />
        <FormInput label="Adresse" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Rue, n°" />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Description ({form.description.length}/{DESC_MAX})</label>
        <textarea value={form.description}
          onChange={e => { if (e.target.value.length <= DESC_MAX) setForm(f => ({ ...f, description: e.target.value })); }}
          placeholder="Ambiance, spécialité, expérience..."
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none" />
      </div>

      {/* Price range */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Gamme de prix</label>
        <div className="grid grid-cols-4 gap-1.5">
          {PRICE_OPTIONS.map(opt => (
            <button key={opt.value}
              onClick={() => setForm(f => ({ ...f, price_range: f.price_range === opt.value ? "" : opt.value }))}
              className={`py-2 rounded-lg border text-center text-xs font-bold transition-all ${
                form.price_range === opt.value
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border bg-background text-muted-foreground hover:border-gold/30"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hours */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Horaires</label>
        <button onClick={() => setHoursOpen(!hoursOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground">
          <span className="text-muted-foreground truncate max-w-[85%]">{scheduleToDisplay(schedule)}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${hoursOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {hoursOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-1 pt-1">
                {DAYS.map(d => (
                  <div key={d.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-background/50 border border-border/50">
                    <button onClick={() => updateDay(d.key, { open: !schedule[d.key].open })}
                      className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${schedule[d.key].open ? "bg-gold" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${schedule[d.key].open ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                    <span className={`text-[10px] font-medium w-8 shrink-0 ${schedule[d.key].open ? "text-foreground" : "text-muted-foreground"}`}>{d.label.slice(0, 3)}</span>
                    {schedule[d.key].open ? (
                      <div className="flex items-center gap-1 ml-auto">
                        <input type="time" value={schedule[d.key].from} onChange={e => updateDay(d.key, { from: e.target.value })}
                          className="w-[64px] px-1 py-0.5 rounded bg-background border border-border text-[10px] text-foreground text-center [&::-webkit-calendar-picker-indicator]:invert" />
                        <span className="text-muted-foreground text-[9px]">→</span>
                        <input type="time" value={schedule[d.key].to} onChange={e => updateDay(d.key, { to: e.target.value })}
                          className="w-[64px] px-1 py-0.5 rounded bg-background border border-border text-[10px] text-foreground text-center [&::-webkit-calendar-picker-indicator]:invert" />
                      </div>
                    ) : <span className="text-[10px] text-muted-foreground ml-auto">Fermé</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Menus */}
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="Lien carte food" value={form.menu_url} onChange={v => setForm(f => ({ ...f, menu_url: v }))} placeholder="https://..." />
        <FormInput label="Lien carte drinks" value={form.drinks_menu_url} onChange={v => setForm(f => ({ ...f, drinks_menu_url: v }))} placeholder="https://..." />
      </div>

      {/* Style */}
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="Style musical" value={form.music_style} onChange={v => setForm(f => ({ ...f, music_style: v }))} placeholder="Deep House, Live..." />
        <FormInput label="Dress code" value={form.dress_code} onChange={v => setForm(f => ({ ...f, dress_code: v }))} placeholder="Smart casual..." />
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-2.5 rounded-xl text-xs font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-1.5"
        style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}>
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Sauvegarder la fiche
      </button>
    </motion.div>
  );
}

function FormInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
    </div>
  );
}
