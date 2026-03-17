import { useState } from "react";
import { MessageCircle, CheckCircle, XCircle, Loader2, Link2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PartnerRequest = { id: string; business_name: string; category: string; offer_description: string; whatsapp_number: string; status: string; created_at: string; user_id: string | null };

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}j`;
}

interface Props {
  partnerRequests: PartnerRequest[];
  setPartnerRequests: React.Dispatch<React.SetStateAction<PartnerRequest[]>>;
  allPlaces: { id: string; name: string; category: string | null; neighborhood: string | null }[];
}

export default function AdminRequestsTab({ partnerRequests, setPartnerRequests, allPlaces }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [requestPlaceIds, setRequestPlaceIds] = useState<Record<string, string>>({});
  const [requestCredits, setRequestCredits] = useState<Record<string, number>>({});
  const [requestPlan, setRequestPlan] = useState<Record<string, string>>({});
  const [requestPlanDays, setRequestPlanDays] = useState<Record<string, number>>({});

  const handleUpdateStatus = async (req: PartnerRequest, newStatus: "approved" | "rejected") => {
    setUpdatingId(req.id);
    try {
      const { error } = await supabase.from("partner_requests" as any).update({ status: newStatus } as any).eq("id", req.id);
      if (error) throw error;

      if (newStatus === "approved") {
        let placeId = requestPlaceIds[req.id];
        if (!placeId) {
          const { data: matchedPlaces } = await supabase.from("places").select("id").ilike("name", req.business_name).limit(1);
          placeId = matchedPlaces?.[0]?.id;
        }

        if (placeId) {
          await supabase.from("places").update({ is_partner: true } as any).eq("id", placeId);

          const { data: invite, error: inviteErr } = await supabase.from("partner_invites" as any).insert({
            place_id: placeId,
            business_name: req.business_name,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            initial_credits: requestCredits[req.id] || 0,
            initial_plan: requestPlan[req.id] || null,
            initial_plan_days: requestPlanDays[req.id] || 30,
          } as any).select("token").single();

          if (!inviteErr && invite) {
            const link = `${window.location.origin}/partner-invite/${(invite as any).token}`;
            setInviteLinks((prev) => ({ ...prev, [req.id]: link }));
            toast.success(`${req.business_name} approuvé ! Lien d'invitation généré ✅`);
          } else {
            toast.success(`${req.business_name} approuvé ✅ (lien non généré)`);
          }
        } else {
          toast.info(`${req.business_name} approuvé, mais aucun lieu sélectionné. Crée le spot d'abord.`);
        }

        if (req.user_id) {
          await supabase.from("user_roles" as any).upsert({ user_id: req.user_id, role: "partner" } as any, { onConflict: "user_id,role" });
          await supabase.from("partner_credits" as any).upsert({ user_id: req.user_id, credits: 0 } as any, { onConflict: "user_id" });
        }
      } else {
        toast.success(`${req.business_name} rejeté`);
      }
      setPartnerRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: newStatus } : r)));
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Demandes partenaires ({partnerRequests.length})</h3>
      {partnerRequests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune demande.</p>
      ) : (
        <div className="space-y-3">
          {partnerRequests.map((req) => (
            <div key={req.id} className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{req.business_name}</p>
                  <p className="text-xs text-muted-foreground">{req.category} · {timeAgo(req.created_at)}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  req.status === "pending" ? "bg-gold/10 text-gold"
                  : req.status === "approved" ? "bg-green-500/10 text-green-400"
                  : "bg-destructive/10 text-destructive"
                }`}>
                  {req.status}
                </span>
              </div>
              <p className="text-xs text-foreground/80">🎁 {req.offer_description}</p>
              <a
                href={`https://wa.me/${req.whatsapp_number.replace(/[\s()-]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-light transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              {req.status === "pending" && (
                <div className="space-y-2 pt-1">
                  <select
                    value={requestPlaceIds[req.id] || ""}
                    onChange={(e) => setRequestPlaceIds((prev) => ({ ...prev, [req.id]: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                  >
                    <option value="">🏠 Lier à un lieu...</option>
                    {allPlaces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.category ? `(${p.category})` : ""} {p.neighborhood ? `— ${p.neighborhood}` : ""}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <select
                      value={requestPlan[req.id] || ""}
                      onChange={(e) => setRequestPlan((prev) => ({ ...prev, [req.id]: e.target.value }))}
                      className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                    >
                      <option value="">Pas de plan</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="featured">Featured ⭐</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      placeholder="Crédits"
                      value={requestCredits[req.id] || ""}
                      onChange={(e) => setRequestCredits((prev) => ({ ...prev, [req.id]: parseInt(e.target.value) || 0 }))}
                      className="w-20 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                    />
                    <input
                      type="number"
                      min={1}
                      placeholder="Jours"
                      value={requestPlanDays[req.id] || 30}
                      onChange={(e) => setRequestPlanDays((prev) => ({ ...prev, [req.id]: parseInt(e.target.value) || 30 }))}
                      className="w-16 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(req, "approved")}
                      disabled={updatingId === req.id || !requestPlaceIds[req.id]}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 font-medium py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
                    >
                      {updatingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Approuver
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req, "rejected")}
                      disabled={updatingId === req.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 font-medium py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rejeter
                    </button>
                  </div>
                </div>
              )}
              {(req.status === "approved" && inviteLinks[req.id]) && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gold/5 border border-gold/20">
                  <Link2 className="w-4 h-4 text-gold shrink-0" />
                  <input
                    readOnly
                    value={inviteLinks[req.id]}
                    className="flex-1 text-[11px] bg-transparent text-foreground truncate outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLinks[req.id]);
                      toast.success("Lien copié ! Envoie-le au partenaire via WhatsApp 📲");
                    }}
                    className="shrink-0 p-1.5 rounded-lg bg-gold/15 text-gold hover:bg-gold/25 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
