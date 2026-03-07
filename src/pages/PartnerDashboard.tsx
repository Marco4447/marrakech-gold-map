import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Camera, Video, Upload, Clock, Loader2, Image as ImageIcon, X, Check, Sparkles, Gift, Save, LayoutDashboard, Megaphone, BarChart3, Receipt, Pencil, QrCode, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import LanguageToggle from "@/components/LanguageToggle";
import PartnerOffersManager from "@/components/PartnerOffersManager";
import PartnerOverview from "@/components/partner/PartnerOverview";
import PartnerCommunity from "@/components/partner/PartnerCommunity";
import PartnerAnalytics from "@/components/partner/PartnerAnalytics";
import PartnerBilling from "@/components/partner/PartnerBilling";
import PartnerPromotions from "@/components/partner/PartnerPromotions";
import { planAllows, type PlanType } from "@/lib/partnerPlans";
import PartnerQRCode from "@/components/partner/PartnerQRCode";
import PartnerStoryPublisher from "@/components/partner/PartnerStoryPublisher";
import VipOfferManager from "@/components/partner/VipOfferManager";
import VenueEditor from "@/components/partner/VenueEditor";
import PartnerStatsBanner from "@/components/partner/PartnerStatsBanner";
import InstantVibeButton from "@/components/partner/InstantVibeButton";
import CompetitorMapWidget from "@/components/partner/CompetitorMapWidget";
import VenueHeader from "@/components/partner/VenueHeader";
import VisibilityScore from "@/components/partner/VisibilityScore";
import EstimatedCustomers from "@/components/partner/EstimatedCustomers";

// --- Sub-components ---

function MoodPicker({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  const MOODS = [
    { key: "hot", emoji: "🔥", label: "Hot" },
    { key: "chill", emoji: "🍸", label: "Chill" },
    { key: "secret", emoji: "✨", label: "Secret" },
    { key: "foodie", emoji: "🥗", label: "Foodie" },
  ];
  return (
    <div className="flex gap-2">
      {MOODS.map((m) => (
        <button key={m.key} type="button" onClick={() => onChange(m.key)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            value === m.key ? "bg-gold/20 border border-gold/50 text-gold shadow-[0_0_12px_hsl(var(--gold)/0.15)]" : "bg-surface border border-border text-muted-foreground"
          }`}
        >
          {m.emoji} {m.label}
        </button>
      ))}
    </div>
  );
}

function SuccessOverlay({ show, onDone }: { show: boolean; onDone: () => void }) {
  useEffect(() => { if (show) { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); } }, [show, onDone]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center mb-4"
          >
            <Check className="w-10 h-10 text-gold" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="font-display text-lg font-bold text-foreground"
          >Vibe publiée ! 🎉</motion.p>
          <motion.div initial={{ scale: 0.5, opacity: 0.6 }} animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
            className="absolute w-20 h-20 rounded-full border-2 border-gold/40"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface HistoryVibe {
  id: string; image_url: string; location: string | null; caption: string | null; created_at: string; media_type: string;
}

function VibeHistory({ vibes }: { vibes: HistoryVibe[] }) {
  if (vibes.length === 0) return <p className="text-xs text-muted-foreground text-center py-10">Aucune vibe publiée.</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      {vibes.map((v) => (
        <div key={v.id} className="relative rounded-xl overflow-hidden aspect-square bg-surface border border-border">
          {v.media_type === "video" ? (
            <video src={v.image_url} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <img src={v.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2">
            <p className="text-[10px] text-foreground font-medium truncate">{v.location || v.caption || "—"}</p>
            <p className="text-[9px] text-muted-foreground">
              {new Date(v.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </p>
          </div>
          <div className="absolute top-1.5 left-1.5 bg-gold px-1.5 py-0.5 rounded text-[8px] font-bold text-primary-foreground">
            ⭐ OFFICIEL
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Tabs ---
type DashboardTab = "overview" | "venue" | "vibes" | "qr" | "promotions" | "analytics" | "billing";

const TABS: { key: DashboardTab; label: string; icon: any }[] = [
  { key: "overview", label: "Aperçu", icon: LayoutDashboard },
  { key: "venue", label: "Ma Fiche", icon: Pencil },
  { key: "vibes", label: "Vibes", icon: Camera },
  { key: "qr", label: "QR & VIP", icon: Gift },
  { key: "promotions", label: "Promos", icon: Megaphone },
  { key: "analytics", label: "Stats", icon: BarChart3 },
  { key: "billing", label: "Billing", icon: Receipt },
];

// --- Main ---
export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState(0);
  const [vibes, setVibes] = useState<HistoryVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [weeklyStats, setWeeklyStats] = useState({ checkins: 0, redemptions: 0 });

  // Post form state
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    const load = async () => {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "partner").single();
      if (!roleData) { setIsPartner(false); setLoading(false); return; }
      setIsPartner(true);

      const { data: creditData } = await supabase.from("partner_credits").select("credits").eq("user_id", user.id).single();
      setCredits(creditData?.credits ?? 0);

      const { data: vibeData } = await supabase.from("vibes").select("id, image_url, location, caption, created_at, media_type")
        .eq("user_id", user.id).eq("is_official", true).order("created_at", { ascending: false }).limit(20);
      setVibes((vibeData as HistoryVibe[]) || []);

      // Load subscription
      const { data: subData } = await supabase.from("partner_subscriptions").select("plan_type, place_id, status")
        .eq("partner_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (subData) {
        setPlanType(subData.plan_type as PlanType);
        setPlaceId(subData.place_id);
      }

      // Fallback: find place from vibes
      let resolvedPlaceId = subData?.place_id ?? null;
      if (!resolvedPlaceId) {
        const { data: vb } = await supabase.from("vibes").select("location").eq("user_id", user.id).eq("is_official", true).not("location", "is", null).limit(1);
        if (vb?.[0]?.location) {
          const { data: place } = await supabase.from("places").select("id").ilike("name", `%${vb[0].location}%`).limit(1);
          if (place?.[0]) { setPlaceId(place[0].id); resolvedPlaceId = place[0].id; }
        }
      }

      // Fetch weekly stats for estimated customers
      if (resolvedPlaceId) {
        const [checkinsRes, redemptionsRes] = await Promise.all([
          supabase.rpc("weekly_checkins", { p_place_id: resolvedPlaceId }),
          supabase.rpc("weekly_qr_redemptions", { p_place_id: resolvedPlaceId }),
        ]);
        setWeeklyStats({
          checkins: Number(checkinsRes.data) || 0,
          redemptions: Number(redemptionsRes.data) || 0,
        });
      }

      setLoading(false);
    };
    load();
  }, [user, authLoading]);

  const resetForm = useCallback(() => {
    setFile(null); setPreview(null); setCaption(""); setLocation(""); setMood(null); setUploadProgress(0); setShowForm(false);
  }, []);

  const handlePost = async () => {
    if (!file || !user || credits <= 0) return;
    if (!mood) { toast.error("Choisis un mood"); return; }
    setPosting(true); setUploadProgress(10);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setUploadProgress(30);
      const { error: uploadErr } = await supabase.storage.from("vibes_media").upload(fileName, file, { contentType: file.type, upsert: false });
      if (uploadErr) throw new Error("Upload failed: " + uploadErr.message);
      setUploadProgress(70);
      const { data: urlData } = supabase.storage.from("vibes_media").getPublicUrl(fileName);
      const mediaType = file.type.startsWith("video/") ? "video" : "photo";
      const { error: rpcErr } = await supabase.rpc("publish_vibe_use_credit", {
        p_image_url: urlData.publicUrl, p_caption: caption.trim() || null, p_location: location.trim() || null, p_mood: mood, p_media_type: mediaType,
      });
      if (rpcErr) throw new Error(rpcErr.message);
      setUploadProgress(100);
      setCredits((c) => c - 1);
      const { data: refreshVibes } = await supabase.from("vibes").select("id, image_url, location, caption, created_at, media_type")
        .eq("user_id", user.id).eq("is_official", true).order("created_at", { ascending: false }).limit(20);
      setVibes((refreshVibes as HistoryVibe[]) || []);
      resetForm(); setShowSuccess(true);
    } catch (err: any) {
      console.error(err); toast.error(err?.message || "Erreur lors de la publication");
    } finally { setPosting(false); }
  };

  const refreshVibes = () => {
    if (!user) return;
    setCredits(c => c - 1);
    supabase.from("vibes").select("id, image_url, location, caption, created_at, media_type")
      .eq("user_id", user.id).eq("is_official", true).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setVibes((data as HistoryVibe[]) || []));
  };

  // --- Render guards ---
  if (authLoading || loading) {
    return <div className="min-h-[100dvh] bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 text-gold animate-spin" /></div>;
  }
  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground">Connecte-toi pour accéder au studio.</p>
        <button onClick={() => navigate("/")} className="text-gold underline text-sm">Retour</button>
      </div>
    );
  }
  if (!isPartner) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Sparkles className="w-12 h-12 text-gold/40" />
        <h2 className="font-display text-lg font-bold text-foreground">Accès réservé aux Partenaires</h2>
        <p className="text-sm text-muted-foreground max-w-xs">Achète un pack de crédits ou souscris un plan partenaire pour débloquer le Partner Studio.</p>
        <button onClick={() => navigate("/shop")}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm text-primary-foreground active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light)), hsl(var(--gold-dark)))" }}
        >Acheter des Crédits</button>
        <button onClick={() => navigate("/")} className="text-muted-foreground text-xs underline mt-2">Retour</button>
      </div>
    );
  }

  const canVibes = planAllows(planType, "vibes") || credits > 0;
  const canAnalytics = planAllows(planType, "analytics");
  const canTrending = planAllows(planType, "trending");

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <SuccessOverlay show={showSuccess} onDone={() => setShowSuccess(false)} />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-5 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Partner Studio</h1>
            <p className="text-[11px] text-muted-foreground">
              {planType ? `Plan ${planType.charAt(0).toUpperCase() + planType.slice(1)}` : "Crédits uniquement"}
              {" · "}{credits} crédits
            </p>
          </div>
          <div className="ml-auto"><LanguageToggle /></div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Venue Header with identity + actions */}
            <VenueHeader
              placeId={placeId}
              planType={planType}
              credits={credits}
              onEditVenue={() => setActiveTab("venue")}
              onPostVibe={() => credits > 0 ? setActiveTab("vibes") : toast.error("Achète des crédits d'abord !")}
            />

            {/* Visibility Score */}
            <VisibilityScore placeId={placeId} />

            {/* Weekly KPIs */}
            <PartnerStatsBanner placeId={placeId} />

            {/* Estimated Customers */}
            <EstimatedCustomers checkins={weeklyStats.checkins} redemptions={weeklyStats.redemptions} />

            {/* Instant Marketing */}
            <InstantVibeButton userId={user.id} credits={credits} onPublished={refreshVibes} />

            {/* Competitor Map */}
            <CompetitorMapWidget placeId={placeId} />

            {/* Quick stats */}
            <PartnerOverview userId={user.id} placeId={placeId} planType={planType} credits={credits} />

            {/* Community: Habitués & Followers */}
            <PartnerCommunity placeId={placeId} />
          </div>
        )}

        {/* Venue Editor Tab */}
        {activeTab === "venue" && (
          <VenueEditor userId={user.id} placeId={placeId} />
        )}

        {/* Vibes Tab */}
        {activeTab === "vibes" && (
          <div className="space-y-5">
            {/* Credits card */}
            <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-card/80 backdrop-blur-xl p-5">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gold/10 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">Vibe Credits</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-4xl font-display font-black text-gold tabular-nums">{credits}</span>
                    <Zap className="w-5 h-5 text-gold" />
                  </div>
                </div>
                <button onClick={() => navigate("/shop")}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-primary-foreground transition-transform active:scale-95"
                  style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light)), hsl(var(--gold-dark)))" }}
                >Recharger</button>
              </div>
            </div>

            {/* Post CTA */}
            {!showForm && canVibes && (
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => credits > 0 ? setShowForm(true) : toast.error("Achète des crédits d'abord !")}
                disabled={credits <= 0}
                className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  credits > 0 ? "bg-gold/15 border border-gold/30 text-gold hover:bg-gold/20" : "bg-surface border border-border text-muted-foreground opacity-60"
                }`}
              >
                <Camera className="w-4 h-4" /> Poster une Vibe Officielle
              </motion.button>
            )}

            {/* Post form */}
            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  className="bg-card border border-border rounded-2xl p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                      <Upload className="w-4 h-4 text-gold" /> Nouvelle Vibe
                    </h2>
                    <button onClick={resetForm} className="w-7 h-7 rounded-full bg-surface flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <input type="file" ref={fileRef} accept="image/*,video/mp4,video/quicktime" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 50 * 1024 * 1024) { toast.error("Fichier trop lourd (max 50 MB)"); return; }
                      setFile(f); setPreview(URL.createObjectURL(f));
                    }}
                  />
                  {preview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-surface">
                      {file?.type.startsWith("video/") ? (
                        <video src={preview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      <button onClick={() => { setFile(null); setPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center"
                      ><X className="w-3.5 h-3.5 text-foreground" /></button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-gold/25 flex flex-col items-center justify-center gap-2 hover:border-gold/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-gold/60" />
                      </div>
                      <span className="text-xs text-muted-foreground">Photo ou vidéo</span>
                    </button>
                  )}
                  <div className="relative">
                    <input type="text" value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 60))}
                      placeholder="✍️ Hook promo (ex: Tables VIP dispo !)" maxLength={60}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">{caption.length}/60</span>
                  </div>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder="📍 Lieu (ex: Le Comptoir Darna)"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                  <MoodPicker value={mood} onChange={setMood} />
                  {posting && (
                    <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden">
                      <motion.div className="h-full rounded-full bg-gold" initial={{ width: "0%" }}
                        animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
                    </div>
                  )}
                  <button onClick={handlePost} disabled={!file || posting}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 transition-all active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-light)), hsl(var(--gold-dark)))" }}
                  >
                    {posting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Publication…</span> : `Publier (−1 crédit)`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Partner Story Publisher */}
            <PartnerStoryPublisher userId={user.id} placeId={placeId} />

            {/* History */}
            <div>
              <h2 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" /> Historique ({vibes.length})
              </h2>
              <VibeHistory vibes={vibes} />
            </div>
          </div>
        )}

        {/* QR & VIP Tab */}
        {activeTab === "qr" && (
          <div className="space-y-6">
            <PartnerQRCode userId={user.id} placeId={placeId} />
            <div className="border-t border-border pt-5">
              <VipOfferManager placeId={placeId} />
            </div>
          </div>
        )}

        {/* Promotions Tab */}
        {activeTab === "promotions" && (
          <PartnerPromotions userId={user.id} placeId={placeId} canTrending={canTrending} />
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          canAnalytics ? (
            <PartnerAnalytics userId={user.id} placeId={placeId} />
          ) : (
            <div className="text-center py-16 space-y-3">
              <BarChart3 className="w-10 h-10 text-gold/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Le dashboard analytique est disponible à partir du plan Premium.</p>
              <button onClick={() => setActiveTab("billing")}
                className="text-gold text-xs font-semibold underline">Voir les plans</button>
            </div>
          )
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <PartnerBilling userId={user.id} currentPlan={planType} />
        )}
      </div>
    </div>
  );
}
