import { useEffect, useState, useCallback } from "react";
import { analytics } from "@/lib/analytics";
import { AnimatePresence, motion } from "framer-motion";
import MapView from "@/components/MapView";
import BottomNav, { type Tab } from "@/components/BottomNav";
import AppSidebar from "@/components/AppSidebar";
import FeedPage from "@/components/FeedPage";
import DiscoverTab from "@/components/DiscoverTab";
import ProfilPage from "@/components/ProfilPage";
import AdminPage from "@/components/AdminPage";
import LandingPage from "@/components/LandingPage";
import AuthGate from "@/components/AuthGate";
import FlashPost from "@/components/FlashPost";
import WelcomeModal from "@/components/WelcomeModal";
import ExplainerSheet from "@/components/ExplainerSheet";
import LanguageToggle from "@/components/LanguageToggle";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import NotificationsPage from "@/components/NotificationsPage";
import AutoVibeCard from "@/components/AutoVibeCard";
import MessagesPage from "@/components/MessagesPage";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useProximityDetection } from "@/hooks/useProximityDetection";
import { useConversations } from "@/hooks/useConversations";
import { Bell } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showFlashPost, setShowFlashPost] = useState(false);
  const [feedRefreshSignal, setFeedRefreshSignal] = useState(0);
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [authStuck, setAuthStuck] = useState(false);
  const [explainerTab, setExplainerTab] = useState<"insider" | "partner" | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [autoVibePlace, setAutoVibePlace] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { unreadCount, markAllRead } = useNotifications();
  const { nearbyPlace, dismiss: dismissAutoVibe, markPosted: markAutoVibePosted } = useProximityDetection(user?.id);
  const { totalUnread: unreadMessages } = useConversations();

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
    if (!localStorage.getItem("wk_onboarding_done")) {
      setTimeout(() => setShowOnboarding(true), 800);
    }
  };

  const handleGoToMap = useCallback((lat: number, lng: number) => { setFlyToCoords({ lat, lng }); setActiveTab("map"); }, []);

  const isGuest = !user;

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        {authStuck && <p className="text-xs text-muted-foreground max-w-xs">{t("guest_reconnecting")}</p>}
      </div>
    );
  }

  if (showLanding && !user) return <LandingPage onEnter={handleEnter} />;

  if (!user && showAdmin) setShowAdmin(false);

  if (showAdmin && user) {
    return (<div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden"><AdminPage onBack={() => setShowAdmin(false)} /></div>);
  }

  // Notifications overlay
  if (showNotifications && user) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setShowNotifications(false)} className="text-sm font-semibold text-foreground">← Retour</button>
        </div>
        <div className="flex-1 overflow-hidden">
          <NotificationsPage />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-background flex overflow-hidden">
      {/* Desktop/Tablet sidebar */}
      {!isGuest && (
        <AppSidebar
          active={activeTab}
          onChange={(tab) => {
            analytics.tabChange(tab);
            setActiveTab(tab);
          }}
          onCreatePress={() => setShowFlashPost(true)}
          onNotificationsPress={() => { markAllRead(); setShowNotifications(true); }}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {/* Feed: constrained width on desktop */}
          {activeTab === "feed" && (
            isGuest ? <AuthGate /> : (
              <div className="h-full flex justify-center">
                <div className="w-full max-w-[630px] h-full">
                  <FeedPage refreshSignal={feedRefreshSignal} onGoToMap={handleGoToMap} />
                </div>
              </div>
            )
          )}
          {activeTab === "map" && <MapView refreshSignal={feedRefreshSignal} flyToCoords={flyToCoords} deepLinkPlaceId={deepLinkPlaceId} isGuest={isGuest} />}
          {activeTab === "discover" && (
            isGuest ? <AuthGate /> : (
              <div className="h-full flex justify-center">
                <div className="w-full max-w-[630px] h-full">
                  <DiscoverTab onGoToMap={handleGoToMap} />
                </div>
              </div>
            )
          )}
          {activeTab === "profil" && (
            isGuest ? <AuthGate /> : (
              <div className="h-full flex justify-center">
                <div className="w-full max-w-[630px] h-full">
                  <ProfilPage onClose={() => setActiveTab("feed")} />
                </div>
              </div>
            )
          )}
        </div>

        {/* Guest CTA on map */}
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
                <p className="text-xs text-muted-foreground mb-3">{t("guest_signupDesc")}</p>
                <button onClick={() => setActiveTab("profil")} className="w-full py-3 rounded-xl font-bold text-sm text-primary-foreground shadow-lg active:scale-[0.97] transition-transform" style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
                  {t("guest_continueGoogle")}
                </button>
                <p className="text-[10px] text-muted-foreground mt-2">{t("guest_freeNoSpam")}</p>
              </motion.div>
            </div>
          </>
        )}

        {/* Mobile bottom nav only */}
        <div className="md:hidden">
          <BottomNav
            active={activeTab}
            onChange={(tab) => {
              if (tab === "create") return;
              analytics.tabChange(tab);
              setActiveTab(tab);
            }}
            onCreatePress={() => {
              if (isGuest) { setActiveTab("profil"); return; }
              setShowFlashPost(true);
            }}
          />
        </div>
      </div>

      {!isGuest && (
        <FlashPost
          open={showFlashPost}
          onClose={() => { setShowFlashPost(false); setAutoVibePlace(null); }}
          onPosted={() => {
            setFeedRefreshSignal((v) => v + 1);
            setActiveTab("feed");
            if (autoVibePlace && nearbyPlace) {
              markAutoVibePosted(nearbyPlace.id);
            }
            setAutoVibePlace(null);
          }}
          initialPlace={autoVibePlace}
        />
      )}

      {/* Auto-Vibe proximity card */}
      {!isGuest && !showFlashPost && (
        <AutoVibeCard
          place={nearbyPlace}
          onPost={(place) => {
            setAutoVibePlace(place.name);
            setShowFlashPost(true);
          }}
          onDismiss={dismissAutoVibe}
        />
      )}

      {/* Header: Language toggle + notifications bell + info (mobile only) */}
      {!isGuest && (
        <div className="fixed top-4 right-4 z-[1999] flex items-center gap-2 md:hidden">
          <button
            onClick={() => { markAllRead(); setShowNotifications(true); }}
            className="relative w-9 h-9 rounded-full bg-card/90 backdrop-blur-xl border border-border hover:border-gold/40 flex items-center justify-center shadow-lg shadow-black/20 transition-all active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
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
          onGoToTab={(tab: string) => setActiveTab(tab as Tab)}
        />
      )}
    </div>
  );
};

export default Index;
