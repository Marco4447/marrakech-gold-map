import { useState, useRef, useEffect, useMemo } from "react";
import { downloadPartnerCsvTemplate } from "@/lib/downloadPartnerCsvTemplate";
import UsersTab from "./UsersTab";
import AdminVipOffers from "./admin/AdminVipOffers";
import AdminStoriesManager from "./admin/AdminStoriesManager";
import AdminActivityFeed from "./admin/AdminActivityFeed";
import AdminAcquisition from "./admin/AdminAcquisition";
import AdminCRM from "./admin/AdminCRM";
import AdminQuickSeed from "./admin/AdminQuickSeed";
import AdminInstagramScraper from "./admin/AdminInstagramScraper";
import { Upload, Image, MapPin, Send, ArrowLeft, Check, Loader2, BarChart3, Users, MessageCircle, CheckCircle, XCircle, TrendingUp, CreditCard, Eye, Zap, Crown, RefreshCw, Pencil, Calendar, Plus, Trophy, Gift, Film, Activity, Link2, Copy, Download, Contact, Instagram } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type Tab = "overview" | "partners" | "sales" | "requests" | "post" | "spots" | "users" | "challenges" | "vip" | "stories" | "activity" | "acquisition" | "crm" | "instagram";
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
type RevenueDay = { date: string; amount: number };
type AdminStats = {
  stripe: { total_revenue_30d: number; currency: string; successful_charges_30d: number; active_subscriptions: number; recent_payments: StripePayment[]; revenue_by_day?: RevenueDay[] } | null;
  users: { total: number; total_vibes: number; vibes_24h: number };
  partners: PartnerDetail[];
};
type RevenuePeriod = "day" | "week" | "month";

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
  const [salesFilter, setSalesFilter] = useState<"all" | "Weshkech" | "Autre">("all");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [passStats, setPassStats] = useState<PassStat[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerDetail | null>(null);
  const [editingCredits, setEditingCredits] = useState(false);
  const [creditValue, setCreditValue] = useState("");
  const [savingCredits, setSavingCredits] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("day");

  // Post vibe state
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Spot form state
  const [spotName, setSpotName] = useState("");
  const [spotCategory, setSpotCategory] = useState("");
  const [spotLat, setSpotLat] = useState("");
  const [spotLng, setSpotLng] = useState("");
  const [spotDescription, setSpotDescription] = useState("");
  const [spotNeighborhood, setSpotNeighborhood] = useState("");
  const [spotAddress, setSpotAddress] = useState("");
  const [savingSpot, setSavingSpot] = useState(false);
  const [spotSuccess, setSpotSuccess] = useState(false);
  const [allPlaces, setAllPlaces] = useState<{ id: string; name: string; category: string | null; neighborhood: string | null }[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Challenge state
  type Challenge = { id: string; title: string; description: string | null; emoji: string; theme_tag: string | null; start_date: string; end_date: string; status: string; winner_user_id: string | null };
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [chTitle, setChTitle] = useState("");
  const [chDesc, setChDesc] = useState("");
  const [chEmoji, setChEmoji] = useState("🏆");
  const [chDays, setChDays] = useState("7");
  const [savingCh, setSavingCh] = useState(false);

  // Partner invite config
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [requestPlaceIds, setRequestPlaceIds] = useState<Record<string, string>>({});
  const [requestCredits, setRequestCredits] = useState<Record<string, number>>({});
  const [requestPlan, setRequestPlan] = useState<Record<string, string>>({});
  const [requestPlanDays, setRequestPlanDays] = useState<Record<string, number>>({});

  const fetchChallenges = async () => {
    const { data } = await supabase.from("weekly_challenges" as any).select("*").order("created_at", { ascending: false }).limit(20);
    if (data) setChallenges(data as any);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, requestsRes, bookingsRes, placesRes] = await Promise.all([
        supabase.functions.invoke("admin-stats"),
        supabase.from("partner_requests" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("place_name").eq("status", "free_pass"),
        supabase.from("places").select("id, name, category, neighborhood").order("name"),
      ]);

      if (statsRes.data) setStats(statsRes.data as AdminStats);
      if (requestsRes.data) setPartnerRequests(requestsRes.data as any);
      if (placesRes.data) setAllPlaces(placesRes.data as any);
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

  useEffect(() => { fetchAll(); fetchChallenges(); }, []);

  const pendingCount = partnerRequests.filter((r) => r.status === "pending").length;

  // Aggregate revenue data by period
  const chartData = useMemo(() => {
    const raw = stats?.stripe?.revenue_by_day;
    if (!raw || raw.length === 0) return [];

    if (revenuePeriod === "day") {
      return raw.map((d) => ({ label: d.date.slice(5), amount: Math.round(d.amount * 100) / 100 }));
    }

    const grouped: Record<string, number> = {};
    for (const d of raw) {
      const dt = new Date(d.date);
      let key: string;
      if (revenuePeriod === "week") {
        const weekStart = new Date(dt);
        weekStart.setDate(dt.getDate() - dt.getDay() + 1);
        key = `S${weekStart.toISOString().slice(5, 10)}`;
      } else {
        key = dt.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      }
      grouped[key] = (grouped[key] || 0) + d.amount;
    }
    return Object.entries(grouped).map(([label, amount]) => ({ label, amount: Math.round(amount * 100) / 100 }));
  }, [stats?.stripe?.revenue_by_day, revenuePeriod]);

  const handleUpdateStatus = async (req: PartnerRequest, newStatus: "approved" | "rejected") => {
    setUpdatingId(req.id);
    try {
      const { error } = await supabase.from("partner_requests" as any).update({ status: newStatus } as any).eq("id", req.id);
      if (error) throw error;

      if (newStatus === "approved") {
        // Use the manually selected place, or fallback to name match
        let placeId = requestPlaceIds[req.id];
        if (!placeId) {
          const { data: matchedPlaces } = await supabase.from("places").select("id").ilike("name", req.business_name).limit(1);
          placeId = matchedPlaces?.[0]?.id;
        }

        if (placeId) {
          await supabase.from("places").update({ is_partner: true } as any).eq("id", placeId);

          // Generate partner invite with config
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

        // Also assign role if user_id exists
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

      const selectedPlace = allPlaces.find((p) => p.id === selectedSpotId);
      const vibeData: any = {
        image_url: imageUrl,
        caption: caption || null,
        location: selectedPlace?.name || location || null,
        username: selectedPlace?.name || null,
        likes: Math.floor(Math.random() * 300) + 50,
      };

      const { error: insertError } = await supabase.from("vibes").insert(vibeData);
      if (insertError) throw insertError;
      setSuccess(true);
      setFile(null);
      setPreview(null);
      setCaption("");
      setLocation("");
      setSelectedSpotId("");
      toast.success(selectedPlace ? `Vibe postée au nom de ${selectedPlace.name} !` : "Vibe publiée !");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Erreur lors de la publication");
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
          <TabButton active={tab === "activity"} label="Activité" icon={Activity} onClick={() => setTab("activity")} />
          <TabButton active={tab === "overview"} label="Vue d'ensemble" icon={BarChart3} onClick={() => setTab("overview")} />
          <TabButton active={tab === "partners"} label="Partenaires" icon={Users} onClick={() => setTab("partners")} />
          <TabButton active={tab === "sales"} label="Ventes" icon={TrendingUp} onClick={() => setTab("sales")} />
          <TabButton active={tab === "requests"} label="Demandes" icon={MessageCircle} onClick={() => setTab("requests")} badge={pendingCount} />
          <TabButton active={tab === "users"} label="Utilisateurs" icon={Users} onClick={() => setTab("users")} />
          <TabButton active={tab === "spots"} label="Spots" icon={MapPin} onClick={() => setTab("spots")} />
          <TabButton active={tab === "post"} label="Poster" icon={Image} onClick={() => setTab("post")} />
          <TabButton active={tab === "challenges"} label="Challenges" icon={Trophy} onClick={() => setTab("challenges")} />
          <TabButton active={tab === "vip"} label="Offres VIP" icon={Gift} onClick={() => setTab("vip")} />
          <TabButton active={tab === "stories"} label="Stories" icon={Film} onClick={() => setTab("stories")} />
          <TabButton active={tab === "acquisition"} label="Acquisition" icon={TrendingUp} onClick={() => setTab("acquisition")} />
          <TabButton active={tab === "crm"} label="CRM" icon={Contact} onClick={() => setTab("crm")} />
          <TabButton active={tab === "instagram"} label="Instagram" icon={Instagram} onClick={() => setTab("instagram")} />
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

              {/* Revenue chart */}
              {chartData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Revenus
                    </h3>
                    <div className="flex gap-1">
                      {(["day", "week", "month"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setRevenuePeriod(p)}
                          className={`text-[10px] font-medium px-2 py-1 rounded-md transition-all ${
                            revenuePeriod === p
                              ? "bg-gold/15 text-gold border border-gold/20"
                              : "text-muted-foreground bg-surface border border-border hover:text-foreground"
                          }`}
                        >
                          {p === "day" ? "Jour" : p === "week" ? "Sem." : "Mois"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-surface border border-border rounded-xl p-3">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={35} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number) => [`${value.toFixed(2)}€`, "Revenu"]}
                        />
                        <Bar dataKey="amount" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}


              {/* TikTok Pixel Events Reference */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  🎵 TikTok Pixel Events
                </h3>
                <div className="bg-surface border border-border rounded-xl p-4 space-y-2.5">
                  {[
                    { event: "PageView", trigger: "Chaque page vue", location: "index.html (auto)" },
                    { event: "CompleteRegistration", trigger: "Inscription Google OAuth", location: "useAuth.tsx" },
                    { event: "ViewContent", trigger: "Ouverture d'une vibe", location: "VibeSheet.tsx" },
                    { event: "InitiateCheckout", trigger: "Clic Acheter Pass VIP", location: "VipPass.tsx" },
                    { event: "CompletePayment", trigger: "Page payment-success", location: "PaymentSuccess.tsx" },
                  ].map((ev) => (
                    <div key={ev.event} className="flex items-start gap-3">
                      <span className="text-[10px] font-mono font-bold text-gold bg-gold/10 px-2 py-0.5 rounded shrink-0">{ev.event}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground">{ev.trigger}</p>
                        <p className="text-[10px] text-muted-foreground">{ev.location}</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                    Pixel ID : D6K52QJC77U9T6VFJO7G · Vérifier sur TikTok Events Manager
                  </p>
                </div>
              </div>

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
                              const { error } = await supabase.from("partner_credits").update({ credits: newCredits } as any).eq("user_id", selectedPartner.user_id);
                              if (error) throw error;
                              setSelectedPartner({ ...selectedPartner, credits: newCredits });
                              if (stats) {
                                setStats({ ...stats, partners: stats.partners.map(p => p.user_id === selectedPartner.user_id ? { ...p, credits: newCredits } : p) });
                              }
                              setEditingCredits(false);
                              toast.success(`Crédits mis à jour : ${newCredits}`);
                            } catch (err) {
                              console.error(err);
                              toast.error("Erreur de mise à jour");
                            } finally {
                              setSavingCredits(false);
                            }
                          }}
                          className="text-[10px] bg-gold/15 text-gold px-2 py-0.5 rounded-md font-medium hover:bg-gold/25 transition-colors"
                        >
                          {savingCredits ? "…" : "✓"}
                        </button>
                        <button
                          onClick={() => setEditingCredits(false)}
                          className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-medium hover:bg-muted/80 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-gold">{selectedPartner.credits}</p>
                      <p className="text-[10px] text-muted-foreground">Crédits</p>
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
                    {(["all", "Weshkech", "Autre"] as const).map((f) => (
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
                        <div className="space-y-2 pt-1">
                          {/* Place selector */}
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

                          {/* Plan & Credits config */}
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
                      {/* Invite link after approval */}
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
          )}

          {/* === USERS === */}
          {tab === "users" && <UsersTab />}

          {/* === SPOTS === */}
          {tab === "spots" && (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ajouter un Spot</h3>
              <div className="space-y-3">
                <input value={spotName} onChange={(e) => setSpotName(e.target.value)} placeholder="Nom du spot *" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
                <select value={spotCategory} onChange={(e) => setSpotCategory(e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all">
                  <option value="">Catégorie *</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="bar">Bar</option>
                  <option value="club">Club</option>
                  <option value="rooftop">Rooftop</option>
                  <option value="cafe">Café</option>
                  <option value="riad">Riad</option>
                  <option value="spa">Spa / Hammam</option>
                  <option value="culture">Culture</option>
                  <option value="shopping">Shopping</option>
                  <option value="activity">Activité</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input value={spotLat} onChange={(e) => setSpotLat(e.target.value)} placeholder="Latitude *" type="number" step="any" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
                  <input value={spotLng} onChange={(e) => setSpotLng(e.target.value)} placeholder="Longitude *" type="number" step="any" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
                </div>
                <input value={spotNeighborhood} onChange={(e) => setSpotNeighborhood(e.target.value)} placeholder="Quartier (ex: Guéliz, Médina…)" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
                <input value={spotAddress} onChange={(e) => setSpotAddress(e.target.value)} placeholder="Adresse" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
                <textarea value={spotDescription} onChange={(e) => setSpotDescription(e.target.value)} placeholder="Description" rows={3} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all resize-none" />
                <button
                  onClick={async () => {
                    if (!spotName || !spotCategory || !spotLat || !spotLng) {
                      toast.error("Remplis les champs obligatoires (*)");
                      return;
                    }
                    setSavingSpot(true);
                    setSpotSuccess(false);
                    try {
                      const { error } = await supabase.from("places").insert({
                        name: spotName.trim(),
                        category: spotCategory,
                        latitude: parseFloat(spotLat),
                        longitude: parseFloat(spotLng),
                        description: spotDescription.trim() || null,
                        neighborhood: spotNeighborhood.trim() || null,
                        address: spotAddress.trim() || null,
                      });
                      if (error) throw error;
                      setSpotSuccess(true);
                      setSpotName(""); setSpotCategory(""); setSpotLat(""); setSpotLng("");
                      setSpotDescription(""); setSpotNeighborhood(""); setSpotAddress("");
                      toast.success("Spot créé avec succès !");
                    } catch (err) {
                      console.error(err);
                      toast.error("Erreur lors de la création du spot");
                    } finally {
                      setSavingSpot(false);
                    }
                  }}
                  disabled={savingSpot || !spotName || !spotCategory || !spotLat || !spotLng}
                  className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
                >
                  {savingSpot ? <><Loader2 className="w-4 h-4 animate-spin" /> Création…</> : <><Plus className="w-4 h-4" /> Créer le Spot</>}
                </button>
              </div>
              <AnimatePresence>
                {spotSuccess && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-xl p-3 mt-3">
                    <Check className="w-4 h-4 text-gold" />
                    <span className="text-sm text-gold font-medium">Spot ajouté à la carte !</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* === POST (Ghost Poster) === */}
          {tab === "post" && (
            <>
              {/* Quick Seed - Batch publishing */}
              <AdminQuickSeed places={allPlaces} />

              <div className="border-t border-border my-4 pt-4" />

              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ghost Poster — Vibe unique</h3>

              {/* Spot selector */}
              <select
                value={selectedSpotId}
                onChange={(e) => setSelectedSpotId(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
              >
                <option value="">— Poster sans spot (vibe libre) —</option>
                {allPlaces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.category ? `· ${p.category}` : ""} {p.neighborhood ? `(${p.neighborhood})` : ""}
                  </option>
                ))}
              </select>

              {selectedSpotId && (
                <p className="text-[10px] text-gold/80 -mt-2">
                  ⚡ La vibe sera postée au nom de « {allPlaces.find((p) => p.id === selectedSpotId)?.name} »
                </p>
              )}

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
                      <p className="text-sm font-medium text-foreground">Sélectionner une photo / vidéo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP, MP4</p>
                    </div>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
              <div className="space-y-3 mt-4">
                <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Texte promo / caption…" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
                {!selectedSpotId && (
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lieu (si pas de spot sélectionné)…" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" />
                )}
                <button onClick={handleSubmit} disabled={!file || uploading} className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Upload…</> : <><Send className="w-4 h-4" /> {selectedSpotId ? "Poster au nom du Spot" : "Publier"}</>}
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

          {/* === CHALLENGES === */}
          {tab === "challenges" && (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Nouveau challenge</h3>
              <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                <div className="flex gap-2">
                  <input value={chEmoji} onChange={(e) => setChEmoji(e.target.value)} placeholder="🏆" className="w-14 bg-background border border-border rounded-xl px-2 py-2.5 text-center text-lg focus:outline-none focus:ring-2 focus:ring-gold/30" />
                  <input value={chTitle} onChange={(e) => setChTitle(e.target.value)} placeholder="Titre du challenge…" className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30" />
                </div>
                <textarea value={chDesc} onChange={(e) => setChDesc(e.target.value)} placeholder="Description…" rows={2} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none" />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Durée :</label>
                  <select value={chDays} onChange={(e) => setChDays(e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30">
                    <option value="3">3 jours</option>
                    <option value="5">5 jours</option>
                    <option value="7">7 jours</option>
                    <option value="14">14 jours</option>
                  </select>
                </div>
                <button
                  disabled={!chTitle.trim() || savingCh}
                  onClick={async () => {
                    setSavingCh(true);
                    try {
                      const now = new Date();
                      const end = new Date(now.getTime() + parseInt(chDays) * 86400000);
                      const { error } = await supabase.from("weekly_challenges" as any).insert({
                        title: chTitle.trim(),
                        description: chDesc.trim() || null,
                        emoji: chEmoji || "🏆",
                        start_date: now.toISOString(),
                        end_date: end.toISOString(),
                        status: "active",
                      } as any);
                      if (error) throw error;
                      toast.success("Challenge créé !");
                      setChTitle(""); setChDesc(""); setChEmoji("🏆"); setChDays("7");
                      fetchChallenges();
                    } catch (err) {
                      console.error(err);
                      toast.error("Erreur lors de la création");
                    } finally { setSavingCh(false); }
                  }}
                  className="w-full bg-gold hover:bg-gold-light disabled:opacity-40 text-primary-foreground font-semibold py-3 rounded-xl transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
                >
                  {savingCh ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Lancer le challenge
                </button>
              </div>

              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-3">Historique ({challenges.length})</h3>
              {challenges.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun challenge.</p>
              ) : (
                <div className="space-y-3">
                  {challenges.map((ch) => {
                    const isActive = ch.status === "active";
                    const ended = new Date(ch.end_date) < new Date();
                    const timeLeft = isActive && !ended
                      ? (() => { const d = Math.max(0, new Date(ch.end_date).getTime() - Date.now()); const days = Math.floor(d / 86400000); const hrs = Math.floor((d % 86400000) / 3600000); return days > 0 ? `${days}j ${hrs}h` : `${hrs}h`; })()
                      : null;

                    return (
                      <div key={ch.id} className={`bg-surface border rounded-xl p-4 ${isActive ? "border-gold/30" : "border-border"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl">{ch.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{ch.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(ch.start_date).toLocaleDateString("fr-FR")} → {new Date(ch.end_date).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isActive && timeLeft && (
                              <span className="text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full">{timeLeft}</span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"}`}>
                              {isActive ? "Actif" : "Terminé"}
                            </span>
                          </div>
                        </div>
                        {ch.description && <p className="text-xs text-muted-foreground mt-1.5">{ch.description}</p>}
                        {ch.winner_user_id && (
                          <p className="text-xs text-gold mt-1.5 flex items-center gap-1"><Crown className="w-3 h-3" /> Gagnant : {ch.winner_user_id.slice(0, 8)}…</p>
                        )}
                        {isActive && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={async () => {
                                if (!confirm("Clôturer ce challenge et attribuer la récompense VIP ?")) return;
                                try {
                                  const res = await supabase.functions.invoke("resolve-challenge");
                                  if (res.error) throw res.error;
                                  toast.success("Challenge clôturé !");
                                  fetchChallenges();
                                } catch (err) {
                                  console.error(err);
                                  toast.error("Erreur lors de la clôture");
                                }
                              }}
                              className="flex-1 text-xs font-medium py-2 rounded-lg bg-gold/15 text-gold border border-gold/20 hover:bg-gold/25 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Trophy className="w-3 h-3" /> Clôturer + récompenser
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm("Annuler ce challenge sans récompense ?")) return;
                                await supabase.from("weekly_challenges" as any).update({ status: "completed" } as any).eq("id", ch.id);
                                toast.success("Challenge annulé");
                                fetchChallenges();
                              }}
                              className="text-xs font-medium py-2 px-3 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* === VIP OFFERS === */}
          {tab === "vip" && <AdminVipOffers />}

          {/* === STORIES MANAGER === */}
          {tab === "stories" && <AdminStoriesManager />}

          {/* === ACTIVITÉ === */}
          {tab === "activity" && <AdminActivityFeed />}

          {/* === ACQUISITION === */}
          {tab === "acquisition" && <AdminAcquisition />}

          {/* === CRM === */}
          {tab === "crm" && <AdminCRM />}
        </div>
      )}
    </div>
  );
}
