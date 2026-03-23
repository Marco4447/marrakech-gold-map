import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Loader2, Camera, X, ChevronDown, Link2, UtensilsCrossed, Wine, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  placeId: string | null;
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

interface DayHours {
  open: boolean;
  from: string;
  to: string;
}

type WeekSchedule = Record<DayKey, DayHours>;

const PRICE_OPTIONS = [
  { value: "€", label: "€", desc: "Économique" },
  { value: "€€", label: "€€", desc: "Modéré" },
  { value: "€€€", label: "€€€", desc: "Haut de gamme" },
  { value: "€€€€", label: "€€€€", desc: "Luxe" },
];

const DESC_MAX = 300;
const IMAGE_MAX_MB = 5;
const IMAGE_REC_WIDTH = 1200;
const IMAGE_REC_HEIGHT = 675;

function parseScheduleFromString(raw: string): WeekSchedule {
  const defaults: WeekSchedule = Object.fromEntries(
    DAYS.map(d => [d.key, { open: false, from: "19:00", to: "02:00" }])
  ) as WeekSchedule;
  if (!raw) return defaults;

  // Try parsing JSON first (our new format)
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      DAYS.forEach(d => {
        if (parsed[d.key]) {
          defaults[d.key] = { ...defaults[d.key], ...parsed[d.key] };
        }
      });
      return defaults;
    }
  } catch {
    // fallback: keep defaults, user will re-set
  }
  return defaults;
}

function scheduleToString(schedule: WeekSchedule): string {
  return JSON.stringify(schedule);
}

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
  description: string;
  opening_hours: string;
  price_range: string;
  music_style: string;
  dress_code: string;
  image_url: string;
  menu_url: string;
  drinks_menu_url: string;
}

export default function VenueEditor({ userId, placeId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const [form, setForm] = useState<VenueForm>({
    description: "", opening_hours: "", price_range: "", music_style: "", dress_code: "", image_url: "", menu_url: "", drinks_menu_url: "",
  });
  const [schedule, setSchedule] = useState<WeekSchedule>(parseScheduleFromString(""));
  const [uploading, setUploading] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);

  useEffect(() => {
    if (!placeId) { setLoading(false); return; }
    supabase.from("places").select("name, description, opening_hours, price_range, music_style, dress_code, image_url, menu_url, drinks_menu_url")
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
            menu_url: data.menu_url || "",
            drinks_menu_url: data.drinks_menu_url || "",
          });
          setSchedule(parseScheduleFromString(data.opening_hours || ""));
        }
        setLoading(false);
      });
  }, [placeId]);

  const handleImageUpload = async (file: File) => {
    if (!placeId) return;
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      toast.error(`Image trop lourde (max ${IMAGE_MAX_MB} Mo)`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Format d'image non supporté");
      return;
    }
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
    if (!placeId) return;
    setSaving(true);
    const hoursStr = scheduleToString(schedule);
    const { error } = await supabase.from("places").update({
      description: form.description.trim().slice(0, DESC_MAX) || null,
      opening_hours: hoursStr || null,
      price_range: form.price_range.trim() || null,
      music_style: form.music_style.trim() || null,
      dress_code: form.dress_code.trim() || null,
      image_url: form.image_url.trim() || null,
      menu_url: form.menu_url.trim() || null,
      drinks_menu_url: form.drinks_menu_url.trim() || null,
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-6">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-5 space-y-1">
        <h3 className="font-display text-lg font-bold text-foreground">{placeName}</h3>
        <p className="text-xs text-muted-foreground">Modifie les informations de ta fiche venue.</p>
      </div>

      {/* ── PHOTO ── */}
      <Section title="Photo principale">
        {form.image_url ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-surface">
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setForm(f => ({ ...f, image_url: "" }))}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-foreground" />
            </button>
          </div>
        ) : (
          <label className="w-full aspect-video rounded-xl border-2 border-dashed border-gold/25 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-gold/50 transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 text-gold animate-spin" /> : <Camera className="w-6 h-6 text-gold/60" />}
            <span className="text-xs text-muted-foreground font-medium">{uploading ? "Upload en cours..." : "Ajouter une photo de couverture"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
          </label>
        )}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-gold/5 border border-gold/10">
          <Info className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs text-foreground/80 font-medium">Format paysage recommandé</p>
            <p className="text-2xs text-muted-foreground">Taille idéale : 1200 × 675 px · Max {IMAGE_MAX_MB} Mo · JPG, PNG ou WebP</p>
          </div>
        </div>
      </Section>

      {/* ── DESCRIPTION ── */}
      <Section title="Description">
        <textarea
          value={form.description}
          onChange={e => {
            if (e.target.value.length <= DESC_MAX) setForm(f => ({ ...f, description: e.target.value }));
          }}
          placeholder="Décris l'ambiance, la spécialité, l'expérience de ton lieu..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
        />
        <div className="flex items-center justify-between">
          <div className="h-1 flex-1 rounded-full bg-border overflow-hidden mr-3">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(form.description.length / DESC_MAX) * 100}%`,
                background: form.description.length > DESC_MAX * 0.9
                  ? "#ef4444"
                  : "linear-gradient(90deg, #BF953F, #FCF6BA)",
              }}
            />
          </div>
          <span className={`text-2xs font-medium tabular-nums shrink-0 ${form.description.length > DESC_MAX * 0.9 ? "text-red-400" : "text-muted-foreground"}`}>
            {form.description.length}/{DESC_MAX}
          </span>
        </div>
      </Section>

      {/* ── HORAIRES D'OUVERTURE ── */}
      <Section title="Horaires d'ouverture">
        <button
          onClick={() => setHoursOpen(!hoursOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground"
        >
          <span className="text-muted-foreground text-xs truncate max-w-[80%]">
            {scheduleToDisplay(schedule)}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${hoursOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {hoursOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1.5 pt-2">
                {DAYS.map(d => (
                  <div key={d.key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/50 border border-border/50">
                    {/* Toggle */}
                    <button
                      onClick={() => updateDay(d.key, { open: !schedule[d.key].open })}
                      className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${schedule[d.key].open ? "bg-gold" : "bg-muted"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${schedule[d.key].open ? "left-[22px]" : "left-0.5"}`} />
                    </button>

                    <span className={`text-xs font-medium w-12 shrink-0 ${schedule[d.key].open ? "text-foreground" : "text-muted-foreground"}`}>
                      {d.label.slice(0, 3)}
                    </span>

                    {schedule[d.key].open ? (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <TimeInput value={schedule[d.key].from} onChange={v => updateDay(d.key, { from: v })} />
                        <span className="text-muted-foreground text-2xs">→</span>
                        <TimeInput value={schedule[d.key].to} onChange={v => updateDay(d.key, { to: v })} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground ml-auto">Fermé</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      {/* ── GAMME DE PRIX ── */}
      <Section title="Gamme de prix">
        <div className="grid grid-cols-4 gap-2">
          {PRICE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setForm(f => ({ ...f, price_range: f.price_range === opt.value ? "" : opt.value }))}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all text-center ${
                form.price_range === opt.value
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border bg-surface text-muted-foreground hover:border-gold/30"
              }`}
            >
              <span className="text-base font-bold">{opt.label}</span>
              <span className="text-2xs leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ── MENUS (liens) ── */}
      <Section title="Cartes & Menus" hint="Ajoute un lien vers ta carte food et/ou boissons">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-gold/60 shrink-0" />
            <input
              type="url"
              value={form.menu_url}
              onChange={e => setForm(f => ({ ...f, menu_url: e.target.value }))}
              placeholder="https://... lien carte food"
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Wine className="w-4 h-4 text-gold/60 shrink-0" />
            <input
              type="url"
              value={form.drinks_menu_url}
              onChange={e => setForm(f => ({ ...f, drinks_menu_url: e.target.value }))}
              placeholder="https://... lien carte boissons"
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>
        </div>
      </Section>

      {/* ── STYLE ── */}
      <Field label="Style musical" value={form.music_style} onChange={v => setForm(f => ({ ...f, music_style: v }))} placeholder="Ex: Deep House, Afrobeats, Live Band" />
      <Field label="Dress code" value={form.dress_code} onChange={v => setForm(f => ({ ...f, dress_code: v }))} placeholder="Ex: Smart casual, Tenue de soirée" />

      {/* ── SAVE ── */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Sauvegarder
      </button>
    </motion.div>
  );
}

/* ── Sub-components ── */

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</label>
        {hint && <span className="text-2xs text-muted-foreground/60">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-[72px] px-1.5 py-1 rounded-lg bg-background border border-border text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-gold/50 [&::-webkit-calendar-picker-indicator]:invert"
    />
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50" />
    </div>
  );
}
