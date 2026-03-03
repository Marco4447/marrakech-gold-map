import { useState, useRef, useEffect } from "react";
import { Upload, Image, MapPin, Send, ArrowLeft, Check, Loader2, BarChart3, Users, MessageCircle, CheckCircle, XCircle, TrendingUp, CreditCard, Eye, Zap, Crown, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type Tab = "overview" | "partners" | "sales" | "requests" | "post";
type PassStat = { place_name: string; count: number };
type PartnerRequest = { id: string; business_name: string; category: string; offer_description: string; whatsapp_number: string; status: string; created_at: string; user_id: string | null };
type PartnerVibe = { id: string; image_url: string; caption: string | null; location: string | null; likes: number; super_vibes: number; created_at: string; is_official: boolean };
type PartnerPurchase = { amount: number; currency: string; created: string; description: string };
type PartnerDetail = {
  user_id: string; full_name: string; email: string; avatar_url: string | null;
  credits: number; business_name: string; category: string;
  offer_description: string | null; whatsapp_number: string | null; joined: string | null;
  vibes: PartnerVibe[]; total_vibes: number; official_vibes: number;
  purchases: PartnerPurchase[];
};
type StripePayment = { id: string; amount: number; currency: string; email: string; description: string; created: string; app?: string };
type AdminStats = {
  stripe: { total_revenue_30d: number; currency: string; successful_charges_30d: number; active_subscriptions: number; recent_payments: StripePayment[] } | null;
  users: { total: number; total_vibes: number; vibes_24h: number };
  partners: PartnerDetail[];
};

function StatCard({ icon: Icon, label, value, sub, color = "text-gold" }: { icon: any; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function TabButton({ active, label, icon: Icon, onClick, badge }: { active: boolean; label: string; icon: any; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap relative ${
        active ? "bg-gold/15 text-gold border border-gold/20" : "text-muted-foreground hover:text-foreground hover:bg-surface"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {badge && badge > 0 && (
        <span className="ml-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [salesFilter, setSalesFilter] = useState<"all" | "Weshkech" | "Jemaride" | "Autre">("all");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [passStats, setPassStats] = useState<PassStat[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerDetail | null>(null);

  // Post vibe state
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, requestsRes, bookingsRes] = await Promise.all([
        supabase.functions.invoke("admin-stats"),
        supabase.from("partner_requests" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("place_name").eq("status", "free_pass"),
      ]);

      if (statsRes.data) setStats(statsRes.data as AdminStats);
      if (requestsRes.data) setPartnerRequests(requestsRes.data as any);
      if (bookingsRes.data) {
        const counts: Record<string, number> = {};
        (bookingsRes.data as any[]).forEach((b) => { counts[b.place_name] = (counts[b.place_name] || 0) + 1; });
        setPassStats(Object.entries(counts).map(([place_name, count]) => ({ place_name, count })).sort((a, b) => b.count - a.count));
      }
    } catch (e) {
      console.error("Failed to fetch admin stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const pendingCount = partnerRequests.filter((r) => r.status === "pending").length;

  const handleUpdateStatus = async (req: PartnerRequest, newStatus: "approved" | "rejected") => {
    setUpdatingId(req.id);
    try {
      const { error } = await supabase.from("partner_requests" as any).update({ status: newStatus } as any).eq("id", req.id);
      if (error) throw error;

      if (newStatus === "approved") {
        await supabase.from("places").update({ is_partner: true, has_active_offer: true } as any).ilike("name", req.business_name);
        if (req.user_id) {
          await supabase.from("user_roles" as any).upsert({ user_id: req.user_id, role: "partner" } as any, { onConflict: "user_id,role" });
          await supabase.from("partner_credits" as any).upsert({ user_id: req.user_id, credits: 0 } as any, { onConflict: "user_id" });
          toast.success(`${req.business_name} approuvé + rôle partner ✅`);
        } else {
          toast.success(`${req.business_name} approuvé ✅`);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("vibes").upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/vibes/${fileName}`;
      const { error: insertError } = await supabase.from("vibes").insert({ image_url: imageUrl, caption: caption || null, location: location || null, likes: Math.floor(Math.random() * 300) + 50 });
      if (insertError) throw insertError;
      setSuccess(true);
      setFile(null);
      setPreview(null);
      setCaption("");
      setLocation("");
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}j`;
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold">
                <span className="text-gold">Admin</span>
                <span className="text-foreground"> Panel</span>
              </h1>
              <p className="text-muted-foreground text-xs mt-0.5">Dashboard complet</p>
            </div>
          </div>
          <button onClick={fetchAll} disabled={loading} className="text-muted-foreground hover:text-gold transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar -mx-5 px-5">
          <TabButton active={tab === "overview"} label="Vue d'ensemble" icon={BarChart3} onClick={() => setTab("overview")} />
          <TabButton active={tab === "partners"} label="Partenaires" icon={Users} onClick={() => setTab("partners")} />
          <TabButton active={tab === "sales"} label="Ventes" icon={TrendingUp} onClick={() => setTab("sales")} />
          <TabButton active={tab === "requests"} label="Demandes" icon={MessageCircle} onClick={() => setTab("requests")} badge={pendingCount} />
          <TabButton active={tab === "post"} label="Poster" icon={Image} onClick={() => setTab("post")} />
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </div>
      ) : (
        <div className="px-5 pt-5 space-y-5">
          {/* === OVERVIEW === */}
          {tab === "overview" && stats && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Users} label="Utilisateurs" value={stats.users.total} />
                <StatCard icon={Zap} label="Vibes (total)" value={stats.users.total_vibes} />
                <StatCard icon={Eye} label="Vibes 24h" value={stats.users.vibes_24h} />
                <StatCard icon={Users} label="Partenaires" value={stats.partners.length} />
                {stats.stripe && (
                  <>
                    <StatCard icon={TrendingUp} label="Revenu 30j" value={`${stats.stripe.total_revenue_30d.toFixed(0)}€`} sub={`${stats.stripe.successful_charges_30d} paiements`} />
                    <StatCard icon={Crown} label="Abonnés VIP" value={stats.stripe.active_subscriptions} />
                  </>
                )}
              </div>

              {/* Quick bookings */}
              {passStats.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Bookings</h3>
                  <div className="space-y-1.5">
                    {passStats.slice(0, 5).map((s) => (
                      <div key={s.place_name} className="flex items-center justify-between bg-surface border border-border rounded-lg px-3 py-2">
                        <span className="text-xs text-foreground truncate mr-2">{s.place_name}</span>
                        <span className="text-xs font-bold text-gold">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "partners" && stats && !selectedPartner && (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Partenaires actifs ({stats.partners.length})</h3>
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
                          <p className="text-[10px] text-muted-foreground">crédits</p>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground rotate-180" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* === PARTNER DETAIL === */}
          {tab === "partners" && selectedPartner && (
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
                  <p className="text-[10px] text-muted-foreground">{selectedPartner.email}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-surface border border-border rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gold">{selectedPartner.credits}</p>
                  <p className="text-[10px] text-muted-foreground">Crédits</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{selectedPartner.total_vibes}</p>
                  <p className="text-[10px] text-muted-foreground">Vibes</p>
                </div>
                <div className="bg-surface border border-border rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{selectedPartner.official_vibes}</p>
                  <p className="text-[10px] text-muted-foreground">Officielles</p>
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
                          <span className="absolute top-1 left-1 bg-gold/90 text-[8px] text-primary-foreground font-bold px-1 py-0.5 rounded">OFF</span>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                          <p className="text-[9px] text-white/90 truncate">{v.caption || v.location || "—"}</p>
                          <p className="text-[8px] text-white/60">❤️ {v.likes} · {timeAgo(v.created_at)}</p>
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
                          <p className="text-[10px] text-muted-foreground">{timeAgo(pu.created)}</p>
                        </div>
                        <span className="text-xs font-bold text-gold">{pu.amount.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Joined */}
              {selectedPartner.joined && (
                <p className="text-[10px] text-muted-foreground mt-4">Inscrit le {new Date(selectedPartner.joined).toLocaleDateString("fr-FR")}</p>
              )}
            </>
          )}

          {/* === SALES === */}
          {tab === "sales" && (
            <>
              {stats?.stripe ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard icon={TrendingUp} label="Revenu 30j" value={`${stats.stripe.total_revenue_30d.toFixed(0)}€`} />
                    <StatCard icon={CheckCircle} label="Paiements" value={stats.stripe.successful_charges_30d} />
                    <StatCard icon={Crown} label="Abonnés actifs" value={stats.stripe.active_subscriptions} />
                  </div>

                  {/* Filter buttons */}
                  <div className="flex gap-1.5 mt-4">
                    {(["all", "Weshkech", "Jemaride", "Autre"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setSalesFilter(f)}
                        className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                          salesFilter === f
                            ? "bg-gold/15 text-gold border border-gold/20"
                            : "text-muted-foreground hover:text-foreground bg-surface border border-border"
                        }`}
                      >
                        {f === "all" ? "Tous" : f}
                      </button>
                    ))}
                  </div>

                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Derniers paiements</h3>
                  {(() => {
                    const filtered = stats.stripe.recent_payments.filter((p) => salesFilter === "all" || p.app === salesFilter);
                    return filtered.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun paiement pour ce filtre.</p>
                    ) : (
                    <div className="space-y-2">
                      {filtered.map((p) => (
                        <div key={p.id} className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-medium text-foreground truncate">{p.email}</p>
                              {p.app && (
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                                  p.app === "Weshkech" ? "bg-gold/15 text-gold" 
                                  : p.app === "Jemaride" ? "bg-blue-500/15 text-blue-400" 
                                  : "bg-muted text-muted-foreground"
                                }`}>
                                  {p.app}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{p.description} · {timeAgo(p.created)}</p>
                          </div>
                          <span className="text-sm font-bold text-gold whitespace-nowrap ml-2">{p.amount.toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                    );
                  })()}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Stripe non configuré.</p>
              )}
            </>
          )}

          {/* === REQUESTS === */}
          {tab === "requests" && (
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
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleUpdateStatus(req, "approved")}
                            disabled={updatingId === req.id}
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
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* === POST === */}
          {tab === "post" && (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Poster une vibe</h3>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-gold/50 bg-surface transition-colors flex flex-col items-center justify-center gap-3 overflow-hidden"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gold" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Sélectionner une photo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP</p>
                    </div>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <div className="space-y-3 mt-4">
                <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption…" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lieu…" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
                <button onClick={handleSubmit} disabled={!file || uploading} className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Upload…</> : <><Send className="w-4 h-4" /> Publier</>}
                </button>
              </div>
              <AnimatePresence>
                {success && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-xl p-3 mt-3">
                    <Check className="w-4 h-4 text-gold" />
                    <span className="text-sm text-gold font-medium">Vibe publiée !</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}
    </div>
  );
}
