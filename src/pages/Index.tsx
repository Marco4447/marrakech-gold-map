import { useEffect, useState, useCallback } from "react";
import { analytics } from "@/lib/analytics";
import { AnimatePresence, motion } from "framer-motion";
import MapView from "@/components/MapView";
import BottomNav from "@/components/BottomNav";
import LivePage from "@/components/LivePage";
import ProfilPage from "@/components/ProfilPage";
import AdminPage from "@/components/AdminPage";
import LandingPage from "@/components/LandingPage";
import AuthGate from "@/components/AuthGate";
import FlashPost from "@/components/FlashPost";
import WelcomeModal from "@/components/WelcomeModal";
import ExplainerSheet from "@/components/ExplainerSheet";
import LanguageToggle from "@/components/LanguageToggle";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";

type Tab = "map" | "live" | "profil";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showFlashPost, setShowFlashPost] = useState(false);
  const [feedRefreshSignal, setFeedRefreshSignal] = useState(0);
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [authStuck, setAuthStuck] = useState(false);
  const [explainerTab, setExplainerTab] = useState<"insider" | "partner" | null>(null);
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { unreadCount, markAllRead } = useNotifications();
  const [spotCount, setSpotCount] = useState(0);
  const [liveVibeCount, setLiveVibeCount] = useState(0);

  // Fetch spot count + live vibe count for guest CTA
  useEffect(() => {
    if (user) return;
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!baseUrl || !apiKey) return;
    const fetchCounts = async () => {
      try {
        const [placesRes, vibesRes] = await Promise.all([
          fetch(`${baseUrl}/rest/v1/places?select=id`, { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Prefer: "count=exact" } }),
          fetch(`${baseUrl}/rest/v1/vibes?select=id&created_at=gte.${new Date(Date.now() - 3600000).toISOString()}`, { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Prefer: "count=exact" } }),
        ]);
        const spots = placesRes.headers.get("content-range")?.split("/")[1];
        if (spots) setSpotCount(parseInt(spots, 10));
        const vibes = vibesRes.headers.get("content-range")?.split("/")[1];
        if (vibes) setLiveVibeCount(parseInt(vibes, 10));
      } catch {}
    };
    fetchCounts();
  }, [user]);

  const [showLanding, setShowLanding] = useState(() => !localStorage.getItem("wk_landed"));
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem("wk_welcome_seen"));
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loading) { setAuthStuck(false); return; }
    const timeout = setTimeout(() => setAuthStuck(true), 4000);
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => { if (user && localStorage.getItem("wk_landed")) setShowLanding(false); }, [user]);
  useEffect(() => {
    if (user && !localStorage.getItem("wk_welcome_seen")) {
      if (showLanding) { localStorage.setItem("wk_landed", "1"); setShowLanding(false); }
      setShowWelcome(true);
    }
  }, [user]);

  const handleEnter = () => { localStorage.setItem("wk_landed", "1"); setShowLanding(false); };

  const [deepLinkPlaceId, setDeepLinkPlaceId] = useState<string | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem("wk_flyto");
    if (stored) {
      sessionStorage.removeItem("wk_flyto");
      try { const { lat, lng, placeId } = JSON.parse(stored); if (lat && lng) setFlyToCoords({ lat, lng }); if (placeId) setDeepLinkPlaceId(placeId); } catch {}
    }
  }, []);

  const handleWelcomeComplete = (coords: { lat: number; lng: number } | null) => {
    setShowWelcome(false); localStorage.setItem("wk_welcome_seen", "1");
    if (coords) setFlyToCoords(coords);
    // Start onboarding tutorial if not done yet
    if (!localStorage.getItem("wk_onboarding_done")) {
      setTimeout(() => setShowOnboarding(true), 800);
    }
  };

  const handleHome = () => { localStorage.removeItem("wk_landed"); setShowLanding(true); };
  const handleGoToMap = useCallback((lat: number, lng: number) => { setFlyToCoords({ lat, lng }); setActiveTab("map"); }, []);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        {authStuck && <p className="text-xs text-muted-foreground max-w-xs">{t("guest_reconnecting")}</p>}
      </div>
    );
  }

  if (showLanding && !user) return <LandingPage onEnter={handleEnter} />;

  const isGuest = !user;
  if (!user && showAdmin) setShowAdmin(false);

  if (showAdmin && user) {
    return (<div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden"><AdminPage onBack={() => setShowAdmin(false)} /></div>);
  }

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {activeTab === "map" && <MapView refreshSignal={feedRefreshSignal} flyToCoords={flyToCoords} deepLinkPlaceId={deepLinkPlaceId} isGuest={isGuest} />}
        {activeTab === "live" && (isGuest ? <AuthGate /> : <LivePage refreshSignal={feedRefreshSignal} onGoToMap={handleGoToMap} />)}
        {activeTab === "profil" && (isGuest ? <AuthGate /> : <ProfilPage onOpenAdmin={() => setShowAdmin(true)} onClose={() => setActiveTab("map")} />)}
      </div>

      {/* Guest CTA */}
      {isGuest && activeTab === "map" && (
        <>
          <div className="fixed inset-x-0 bottom-0 h-[55vh] z-[1998] pointer-events-none" style={{
            background: "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 25%, hsl(var(--background) / 0.4) 60%, transparent 100%)",
            backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
            maskImage: "linear-gradient(to top, black 0%, black 40%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, black 0%, black 40%, transparent 100%)",
          }} />
          <div className="fixed bottom-20 left-4 right-4 z-[1999]">
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.5, duration: 0.5, type: "spring" }}
              className="bg-card/95 backdrop-blur-xl border border-gold/30 rounded-2xl p-5 shadow-2xl shadow-gold/10 text-center">
              <p className="text-base font-bold text-foreground mb-1">{t("guest_unlockMap")}</p>
              {spotCount > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2, duration: 0.4 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-2 mx-auto animate-[gold-counter-pulse_2s_ease-in-out_infinite]"
                  style={{ background: "hsl(43 76% 52% / 0.12)", border: "1px solid hsl(43 76% 52% / 0.3)" }}>
                  <span className="text-xs font-bold text-gold">📍 {spotCount} {t("guest_hiddenSpots")}</span>
                </motion.div>
              )}
              {liveVibeCount > 0 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.5, duration: 0.4 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-2 mx-auto"
                  style={{ background: "hsl(0 70% 50% / 0.12)", border: "1px solid hsl(0 70% 50% / 0.3)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-red-400">{liveVibeCount} {t("guest_vibesPosted")}</span>
                </motion.div>
              )}
              <p className="text-xs text-muted-foreground mb-3">{t("guest_signupDesc")}</p>
              <button onClick={() => setActiveTab("profil")} className="w-full py-3 rounded-xl font-bold text-sm text-primary-foreground shadow-lg active:scale-[0.97] transition-transform" style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
                {t("guest_continueGoogle")}
              </button>
              <p className="text-[10px] text-muted-foreground mt-2">{t("guest_freeNoSpam")}</p>
            </motion.div>
          </div>
        </>
      )}

      {activeTab === "map" && !isGuest && (
        <a href="https://www.jemaride.com" target="_blank" rel="noopener noreferrer"
          className="fixed bottom-20 right-4 z-[1999] flex items-center gap-1.5 bg-card/90 backdrop-blur-xl border border-border hover:border-gold/40 text-foreground px-3 py-2 rounded-full shadow-lg shadow-black/20 transition-all active:scale-95">
          <span className="text-base">🚕</span><span className="text-[11px] font-bold">Jema</span>
        </a>
      )}

      <BottomNav active={activeTab} onChange={(tab) => {
        analytics.tabChange(tab);
        if (tab === "profil") markAllRead();
        setActiveTab(tab);
      }} onHome={handleHome} onFlashPost={() => {
        if (isGuest) { setActiveTab("profil"); return; }
        setShowFlashPost(true);
      }} unreadNotifications={unreadCount} />
      {!isGuest && <FlashPost open={showFlashPost} onClose={() => setShowFlashPost(false)} onPosted={() => { setFeedRefreshSignal((v) => v + 1); setActiveTab("live"); }} />}

      {/* Language toggle + info button */}
      {!isGuest && (
        <div className="fixed top-4 right-4 z-[1999] flex items-center gap-2">
          <LanguageToggle variant="icon" />
          <button onClick={() => setExplainerTab("insider")} className="w-9 h-9 rounded-full bg-card/90 backdrop-blur-xl border border-border hover:border-gold/40 flex items-center justify-center shadow-lg shadow-black/20 transition-all active:scale-95" aria-label="Info">
            <span className="text-sm">💡</span>
          </button>
        </div>
      )}
      {isGuest && activeTab === "map" && (
        <div className="fixed top-4 right-4 z-[1999]">
          <LanguageToggle variant="icon" />
        </div>
      )}

      <ExplainerSheet open={explainerTab !== null} onClose={() => setExplainerTab(null)} initialTab={explainerTab ?? "insider"} />
      {!isGuest && <WelcomeModal open={showWelcome} onComplete={handleWelcomeComplete} />}
      {!isGuest && (
        <OnboardingTutorial
          open={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
          onOpenFlashPost={() => setShowFlashPost(true)}
          onGoToTab={setActiveTab}
        />
      )}
    </div>
  );
};

export default Index;
