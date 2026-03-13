import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check, LayoutGrid, List, Phone, ExternalLink, Calendar, MapPin, FileEdit, Copy, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { downloadPartnerCsvTemplate } from "@/lib/downloadPartnerCsvTemplate";
import { partnerOutreachTemplates, personalizeTemplate } from "@/lib/partnerOutreachTemplates";
import AdminVenueEditor from "./AdminVenueEditor";

const STATUSES = [
  { value: "prospect", label: "🔍 Prospect", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  { value: "contacted", label: "💬 Contacté", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  { value: "onboarded", label: "🤝 Onboardé", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  { value: "active", label: "✅ Actif", color: "bg-green-500/15 text-green-400 border-green-500/20" },
  { value: "inactive", label: "❄️ Inactif", color: "bg-muted text-muted-foreground border-border" },
];

const PRIORITIES = [
  { value: "hot", label: "🔥 Hot" },
  { value: "medium", label: "🟡 Medium" },
  { value: "low", label: "⚪ Low" },
];

interface Prospect {
  id: string;
  name: string;
  category: string;
  neighborhood: string;
  status: string;
  priority: string;
  instagram: string;
  whatsapp: string;
  contact_name: string;
  first_contact_date: string | null;
  follow_up_date: string | null;
  credits_offered: number;
  app_link: string;
  invite_link: string;
  notes: string;
  created_at: string;
  place_id: string | null;
}

interface Place {
  id: string;
  name: string;
}

type ViewMode = "table" | "kanban";

const emptyForm: Omit<Prospect, "id" | "created_at"> = {
  name: "", category: "", neighborhood: "", status: "prospect", priority: "medium",
  instagram: "", whatsapp: "", contact_name: "",
  first_contact_date: null, follow_up_date: null,
  credits_offered: 15, app_link: "", invite_link: "", notes: "", place_id: null,
};

export default function AdminCRM() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("kanban");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [editingVenuePlaceId, setEditingVenuePlaceId] = useState<string | null>(null);

  const fetchData = async () => {
    const [{ data: prospectData }, { data: placeData }] = await Promise.all([
      supabase.from("partner_prospects" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("places").select("id, name").order("name"),
    ]);
    setProspects((prospectData as any[]) || []);
    setPlaces((placeData as Place[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nom requis"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingId) {
      const { error } = await supabase
        .from("partner_prospects" as any)
        .update({ ...form } as any)
        .eq("id", editingId);
      if (error) { toast.error("Erreur mise à jour"); return; }
      toast.success("Prospect mis à jour");
    } else {
      const { error } = await supabase
        .from("partner_prospects" as any)
        .insert({ ...form, created_by: user.id } as any);
      if (error) { toast.error("Erreur création"); return; }
      toast.success("Prospect ajouté");
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("partner_prospects" as any).delete().eq("id", id);
    if (error) { toast.error("Erreur suppression"); return; }
    toast.success("Prospect supprimé");
    fetchData();
  };

  const handleEdit = (p: Prospect) => {
    setForm({
      name: p.name, category: p.category, neighborhood: p.neighborhood,
      status: p.status, priority: p.priority, instagram: p.instagram,
      whatsapp: p.whatsapp, contact_name: p.contact_name,
      first_contact_date: p.first_contact_date, follow_up_date: p.follow_up_date,
      credits_offered: p.credits_offered, app_link: p.app_link,
      invite_link: p.invite_link, notes: p.notes, place_id: p.place_id,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await supabase.from("partner_prospects" as any).update({ status: newStatus } as any).eq("id", id);
    fetchData();
  };

  const getStatusInfo = (status: string) => STATUSES.find(s => s.value === status) || STATUSES[0];

  if (loading) return <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Pipeline prospects ({prospects.length})
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setView(view === "kanban" ? "table" : "kanban")} className="text-muted-foreground hover:text-foreground transition-colors">
            {view === "kanban" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
          <button onClick={downloadPartnerCsvTemplate} className="text-xs text-muted-foreground hover:text-gold transition-colors">CSV</button>
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-light transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-surface border border-border rounded-xl p-4 space-y-3 overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-foreground">{editingId ? "Modifier" : "Nouveau prospect"}</h4>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nom du lieu *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Input label="Contact" value={form.contact_name} onChange={v => setForm(f => ({ ...f, contact_name: v }))} />
              <Input label="Catégorie" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
              <Input label="Quartier" value={form.neighborhood} onChange={v => setForm(f => ({ ...f, neighborhood: v }))} />
              <Input label="Instagram" value={form.instagram} onChange={v => setForm(f => ({ ...f, instagram: v }))} placeholder="@handle" />
              <Input label="WhatsApp" value={form.whatsapp} onChange={v => setForm(f => ({ ...f, whatsapp: v }))} placeholder="+212 6XX" />
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Statut</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground">
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Priorité</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground">
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <Input label="Date relance" value={form.follow_up_date || ""} onChange={v => setForm(f => ({ ...f, follow_up_date: v || null }))} type="date" />
              <Input label="1er contact" value={form.first_contact_date || ""} onChange={v => setForm(f => ({ ...f, first_contact_date: v || null }))} type="date" />
              {/* Place link */}
              <div className="col-span-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Lier à un établissement
                </label>
                <select value={form.place_id || ""} onChange={e => setForm(f => ({ ...f, place_id: e.target.value || null }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground">
                  <option value="">— Aucun —</option>
                  {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground resize-none" />
            </div>
            <button onClick={handleSave} className="w-full py-2.5 rounded-xl text-xs font-semibold text-primary-foreground flex items-center justify-center gap-1.5" style={{ background: "linear-gradient(135deg, hsl(43 76% 52%), hsl(43 70% 62%))" }}>
              <Check className="w-3.5 h-3.5" /> {editingId ? "Enregistrer" : "Ajouter"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Venue editor */}
      <AnimatePresence>
        {editingVenuePlaceId && (
          <AdminVenueEditor placeId={editingVenuePlaceId} onClose={() => setEditingVenuePlaceId(null)} />
        )}
      </AnimatePresence>

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
          {STATUSES.map(status => {
            const items = prospects.filter(p => p.status === status.value);
            return (
              <div key={status.value} className="min-w-[200px] flex-shrink-0 space-y-2">
                <div className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg border ${status.color}`}>
                  {status.label} ({items.length})
                </div>
                {items.map(p => (
                  <KanbanCard key={p.id} prospect={p} onEdit={handleEdit} onDelete={handleDelete}
                    onStatusChange={handleStatusChange} onEditVenue={setEditingVenuePlaceId} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Table view */}
      {view === "table" && (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Nom</th>
                <th className="pb-2 font-medium">Statut</th>
                <th className="pb-2 font-medium">Priorité</th>
                <th className="pb-2 font-medium">Relance</th>
                <th className="pb-2 font-medium">WhatsApp</th>
                <th className="pb-2 font-medium">Fiche</th>
                <th className="pb-2 font-medium">Notes</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {prospects.map(p => {
                const s = getStatusInfo(p.status);
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                    <td className="py-2.5 font-medium text-foreground">
                      {p.name}
                      {p.contact_name && <span className="text-muted-foreground ml-1">({p.contact_name})</span>}
                    </td>
                    <td className="py-2.5">
                      <select value={p.status} onChange={e => handleStatusChange(p.id, e.target.value)} className={`text-[10px] px-2 py-0.5 rounded-full border bg-transparent ${s.color}`}>
                        {STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5">{PRIORITIES.find(pr => pr.value === p.priority)?.label}</td>
                    <td className="py-2.5 text-muted-foreground">{p.follow_up_date || "—"}</td>
                    <td className="py-2.5">
                      {p.whatsapp ? (
                        <a href={`https://wa.me/${p.whatsapp.replace(/\s/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {p.whatsapp}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="py-2.5">
                      {p.place_id ? (
                        <button onClick={() => setEditingVenuePlaceId(p.place_id!)}
                          className="text-gold hover:text-gold-light flex items-center gap-1 text-[10px] font-medium">
                          <FileEdit className="w-3 h-3" /> Éditer
                        </button>
                      ) : <span className="text-muted-foreground text-[10px]">Non lié</span>}
                    </td>
                    <td className="py-2.5 text-muted-foreground max-w-[150px] truncate">{p.notes || "—"}</td>
                    <td className="py-2.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => handleEdit(p)} className="text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {prospects.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Aucun prospect. Cliquez "Ajouter" pour commencer.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KanbanCard({ prospect: p, onEdit, onDelete, onStatusChange, onEditVenue }: {
  prospect: Prospect; onEdit: (p: Prospect) => void; onDelete: (id: string) => void;
  onStatusChange: (id: string, s: string) => void; onEditVenue: (placeId: string) => void;
}) {
  const isOverdue = p.follow_up_date && new Date(p.follow_up_date) < new Date();
  return (
    <div className="bg-surface border border-border rounded-xl p-3 space-y-2 group">
      <div className="flex justify-between items-start">
        <p className="text-xs font-semibold text-foreground leading-tight">{p.name}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(p)} className="text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
          <button onClick={() => onDelete(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
      {p.contact_name && <p className="text-[10px] text-muted-foreground">{p.contact_name}</p>}
      {p.category && <p className="text-[10px] text-muted-foreground">{p.category} • {p.neighborhood}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        {p.follow_up_date && (
          <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
            <Calendar className="w-2.5 h-2.5" /> {p.follow_up_date}
          </span>
        )}
        {p.whatsapp && (
          <a href={`https://wa.me/${p.whatsapp.replace(/\s/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-0.5">
            <Phone className="w-2.5 h-2.5" />
          </a>
        )}
        {p.instagram && (
          <a href={p.instagram.startsWith("http") ? p.instagram : `https://instagram.com/${p.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-0.5">
            <ExternalLink className="w-2.5 h-2.5" /> IG
          </a>
        )}
        {p.place_id && (
          <button onClick={() => onEditVenue(p.place_id!)}
            className="text-[10px] text-gold hover:text-gold-light flex items-center gap-0.5 font-medium">
            <FileEdit className="w-2.5 h-2.5" /> Fiche
          </button>
        )}
      </div>
      {p.notes && <p className="text-[10px] text-muted-foreground line-clamp-2">{p.notes}</p>}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
    </div>
  );
}
