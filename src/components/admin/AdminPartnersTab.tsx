import { useState } from "react";
import { Users, CreditCard, ArrowLeft, MessageCircle, Pencil, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/auditLog";
import { downloadPartnerCsvTemplate } from "@/lib/downloadPartnerCsvTemplate";
import { timeAgo } from "@/lib/timeAgo";

type PartnerVibe = { id: string; image_url: string; caption: string | null; location: string | null; likes: number; super_vibes: number; created_at: string; is_official: boolean };
type PartnerPurchase = { amount: number; currency: string; created: string; description: string };
type PartnerDetail = {
  user_id: string; full_name: string; email: string; avatar_url: string | null;
  credits: number; business_name: string; category: string;
  offer_description: string | null; whatsapp_number: string | null; joined: string | null;
  vibes: PartnerVibe[]; total_vibes: number; official_vibes: number;
  purchases: PartnerPurchase[];
};

type AdminStats = {
  stripe: any;
  users: any;
  partners: PartnerDetail[];
};

interface Props {
  stats: AdminStats;
  setStats: (s: AdminStats) => void;
}

export default function AdminPartnersTab({ stats, setStats }: Props) {
  const [selectedPartner, setSelectedPartner] = useState<PartnerDetail | null>(null);
  const [editingCredits, setEditingCredits] = useState(false);
  const [creditValue, setCreditValue] = useState("");
  const [savingCredits, setSavingCredits] = useState(false);

  if (selectedPartner) {
    return (
      <>
        <button onClick={() => setSelectedPartner(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux partenaires
        </button>

        {/* Header */}
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden shrink-0">
            {selectedPartner.avatar_url ? (
              <img src={selectedPartner.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-5 h-5 text-gold" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">{selectedPartner.business_name}</p>
            <p className="text-xs text-muted-foreground">{selectedPartner.full_name} · {selectedPartner.category}</p>
            <p className="text-2xs text-muted-foreground">{selectedPartner.email}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-surface border border-border rounded-xl p-3 text-center relative">
            {editingCredits ? (
              <div className="flex flex-col items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  value={creditValue}
                  onChange={(e) => setCreditValue(e.target.value)}
                  className="w-16 text-center bg-background border border-gold/30 rounded-lg px-1 py-1 text-sm font-bold text-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  autoFocus
                />
                <div className="flex gap-1">
                  <button
                    disabled={savingCredits}
                    onClick={async () => {
                      setSavingCredits(true);
                      try {
                        const newCredits = parseInt(creditValue) || 0;
                        const oldCredits = selectedPartner.credits;
                        const { error } = await supabase.from("partner_credits").update({ credits: newCredits } as any).eq("user_id", selectedPartner.user_id);
                        if (error) throw error;
                        logAdminAction({ action: "update_credits", targetTable: "partner_credits", targetId: selectedPartner.user_id, oldValue: { credits: oldCredits }, newValue: { credits: newCredits }, metadata: { partner_name: selectedPartner.full_name } });
                        setSelectedPartner({ ...selectedPartner, credits: newCredits });
                        if (stats) {
                          setStats({ ...stats, partners: stats.partners.map(p => p.user_id === selectedPartner.user_id ? { ...p, credits: newCredits } : p) });
                        }
                        setEditingCredits(false);
                        toast.success(`Crédits mis à jour : ${newCredits}`);
                      } catch (err) {
                       
                        toast.error("Erreur de mise à jour");
                      } finally {
                        setSavingCredits(false);
                      }
                    }}
                    className="text-2xs bg-gold/15 text-gold px-2 py-0.5 rounded-md font-medium hover:bg-gold/25 transition-colors"
                  >
                    {savingCredits ? "…" : "✓"}
                  </button>
                  <button
                    onClick={() => setEditingCredits(false)}
                    className="text-2xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-medium hover:bg-muted/80 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-lg font-bold text-gold">{selectedPartner.credits}</p>
                <p className="text-2xs text-muted-foreground">Crédits</p>
                <button
                  onClick={() => { setCreditValue(String(selectedPartner.credits)); setEditingCredits(true); }}
                  className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-gold transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{selectedPartner.total_vibes}</p>
            <p className="text-2xs text-muted-foreground">Vibes</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{selectedPartner.official_vibes}</p>
            <p className="text-2xs text-muted-foreground">Officielles</p>
          </div>
        </div>

        {/* Offer */}
        {selectedPartner.offer_description && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Offre active</h4>
            <div className="bg-surface border border-gold/20 rounded-xl p-3">
              <p className="text-xs text-foreground">🎁 {selectedPartner.offer_description}</p>
            </div>
          </div>
        )}

        {/* WhatsApp */}
        {selectedPartner.whatsapp_number && (
          <a
            href={`https://wa.me/${selectedPartner.whatsapp_number.replace(/[\s()-]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-light transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
        )}

        {/* Publications */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Publications récentes ({selectedPartner.total_vibes})
          </h4>
          {selectedPartner.vibes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune publication.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {selectedPartner.vibes.map((v) => (
                <div key={v.id} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                  <img src={v.image_url} alt={v.caption || ""} className="w-full h-full object-cover" />
                  {v.is_official && (
                    <span className="absolute top-1 left-1 bg-gold/90 text-2xs text-primary-foreground font-bold px-1 py-0.5 rounded">OFF</span>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <p className="text-2xs text-white/90 truncate">{v.caption || v.location || "—"}</p>
                    <p className="text-2xs text-white/60">❤️ {v.likes} · {timeAgo(v.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchases */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Achats ({selectedPartner.purchases.length})
          </h4>
          {selectedPartner.purchases.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun achat enregistré.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedPartner.purchases.map((pu, i) => (
                <div key={i} className="bg-surface border border-border rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-foreground">{pu.description}</p>
                    <p className="text-2xs text-muted-foreground">{timeAgo(pu.created)}</p>
                  </div>
                  <span className="text-xs font-bold text-gold">{pu.amount.toFixed(2)}€</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Joined */}
        {selectedPartner.joined && (
          <p className="text-2xs text-muted-foreground mt-4">Inscrit le {new Date(selectedPartner.joined).toLocaleDateString("fr-FR")}</p>
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Partenaires actifs ({stats.partners.length})</h3>
        <button
          onClick={downloadPartnerCsvTemplate}
          className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-light transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          CSV Notion
        </button>
      </div>
      {stats.partners.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun partenaire actif.</p>
      ) : (
        <div className="space-y-3">
          {stats.partners.map((p) => (
            <button
              key={p.user_id}
              onClick={() => setSelectedPartner(p)}
              className="w-full text-left bg-surface border border-border rounded-xl p-4 flex items-center gap-3 hover:border-gold/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden shrink-0">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-4 h-4 text-gold" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{p.business_name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.full_name} · {p.category}</p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-1 text-gold">
                    <CreditCard className="w-3 h-3" />
                    <span className="text-sm font-bold">{p.credits}</span>
                  </div>
                  <p className="text-2xs text-muted-foreground">crédits</p>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground rotate-180" />
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
