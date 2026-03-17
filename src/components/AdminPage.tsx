import { useState, useEffect } from "react";
import AdminSpotsManager from "./admin/AdminSpotsManager";
import UsersTab from "./UsersTab";
import AdminVipOffers from "./admin/AdminVipOffers";
import AdminStoriesManager from "./admin/AdminStoriesManager";
import AdminActivityFeed from "./admin/AdminActivityFeed";
import AdminAcquisition from "./admin/AdminAcquisition";
import AdminCRM from "./admin/AdminCRM";
import AdminOverview from "./admin/AdminOverview";
import AdminPartnersTab from "./admin/AdminPartnersTab";
import AdminSalesTab from "./admin/AdminSalesTab";
import AdminPostVibe from "./admin/AdminPostVibe";
import AdminRequestsTab from "./admin/AdminRequestsTab";
import AdminChallengesTab from "./admin/AdminChallengesTab";
import { ArrowLeft, Loader2, BarChart3, Users, MessageCircle, TrendingUp, MapPin, Image, Trophy, Gift, Film, Activity, Contact, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Tab = "overview" | "partners" | "sales" | "requests" | "post" | "spots" | "users" | "challenges" | "vip" | "stories" | "activity" | "acquisition" | "crm";
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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [passStats, setPassStats] = useState<PassStat[]>([]);
  const [allPlaces, setAllPlaces] = useState<{ id: string; name: string; category: string | null; neighborhood: string | null }[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, requestsRes, bookingsRes, placesRes] = await Promise.all([
        supabase.functions.invoke("admin-stats"),
        supabase.from("partner_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("place_name").eq("status", "free_pass"),
        supabase.from("places").select("id, name, category, neighborhood").order("name"),
      ]);

      if (statsRes.data) setStats(statsRes.data as AdminStats);
      if (requestsRes.data) setPartnerRequests(requestsRes.data as PartnerRequest[]);
      if (placesRes.data) setAllPlaces(placesRes.data);
      if (bookingsRes.data) {
        const counts: Record<string, number> = {};
        bookingsRes.data.forEach((b) => { counts[b.place_name] = (counts[b.place_name] || 0) + 1; });
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
        <div className="flex gap-1.5 mt-3 overflow-x-auto -mx-5 px-5 pb-2 scrollbar-thin" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
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
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </div>
      ) : (
        <div className="px-5 pt-5 space-y-5">
          {tab === "overview" && stats && <AdminOverview stats={stats} passStats={passStats} />}
          {tab === "partners" && stats && <AdminPartnersTab stats={stats} setStats={setStats as any} />}
          {tab === "sales" && stats && <AdminSalesTab stats={stats} />}
          {tab === "requests" && <AdminRequestsTab partnerRequests={partnerRequests} setPartnerRequests={setPartnerRequests} allPlaces={allPlaces} />}
          {tab === "users" && <UsersTab />}
          {tab === "spots" && <AdminSpotsManager />}
          {tab === "post" && <AdminPostVibe allPlaces={allPlaces} />}
          {tab === "challenges" && <AdminChallengesTab />}
          {tab === "vip" && <AdminVipOffers />}
          {tab === "stories" && <AdminStoriesManager />}
          {tab === "activity" && <AdminActivityFeed />}
          {tab === "acquisition" && <AdminAcquisition />}
          {tab === "crm" && <AdminCRM />}
        </div>
      )}
    </div>
  );
}
