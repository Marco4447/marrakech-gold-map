import { useEffect, useState, useCallback } from "react";
import { analytics } from "@/lib/analytics";
import { AnimatePresence } from "framer-motion";
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
import { useAuth } from "@/hooks/useAuth";

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

  // Show landing only for users who have never completed onboarding
  const [showLanding, setShowLanding] = useState(() => {
    return !localStorage.getItem("wk_landed");
  });
  // Show welcome tutorial for first-time users who just signed up
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem("wk_welcome_seen");
  });

  useEffect(() => {
    if (!loading) {
      setAuthStuck(false);
      return;
    }
    const timeout = setTimeout(() => setAuthStuck(true), 4000);
    return () => clearTimeout(timeout);
  }, [loading]);

  // Once user is authenticated, auto-dismiss landing if they've already completed it before
  useEffect(() => {
    if (user && localStorage.getItem("wk_landed")) {
      setShowLanding(false);
    }
  }, [user]);

  // When user logs in for first time, show welcome tutorial AFTER auth completes
  useEffect(() => {
    if (user && !localStorage.getItem("wk_welcome_seen")) {
      // First-time user: dismiss landing, show welcome
      if (showLanding) {
        localStorage.setItem("wk_landed", "1");
        setShowLanding(false);
      }
      setShowWelcome(true);
    }
  }, [user]);

  const handleEnter = () => {
    localStorage.setItem("wk_landed", "1");
    setShowLanding(false);
  };

  // Handle deep link flyto from /place/:id or /vibe/:id
  const [deepLinkPlaceId, setDeepLinkPlaceId] = useState<string | null>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem("wk_flyto");
    if (stored) {
      sessionStorage.removeItem("wk_flyto");
      try {
        const { lat, lng, placeId } = JSON.parse(stored);
        if (lat && lng) setFlyToCoords({ lat, lng });
        if (placeId) setDeepLinkPlaceId(placeId);
      } catch {}
    }
  }, []);

  const handleWelcomeComplete = (coords: { lat: number; lng: number } | null) => {
    setShowWelcome(false);
    localStorage.setItem("wk_welcome_seen", "1");
    if (coords) {
      setFlyToCoords(coords);
    }
  };

  const handleHome = () => {
    localStorage.removeItem("wk_landed");
    setShowLanding(true);
  };

  const handleGoToMap = useCallback((lat: number, lng: number) => {
    setFlyToCoords({ lat, lng });
    setActiveTab("map");
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        {authStuck && (
          <p className="text-xs text-muted-foreground max-w-xs">
            Reconnexion en cours… garde cette page ouverte quelques secondes.
          </p>
        )}
      </div>
    );
  }

  // Show landing page for non-authenticated users who haven't onboarded
  if (showLanding && !user) {
    return <LandingPage onEnter={handleEnter} />;
  }

  // Pre-auth: allow map exploration without login (read-only mode)
  const isGuest = !user;

  if (!user && showAdmin) setShowAdmin(false);

  if (showAdmin && user) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
        <AdminPage onBack={() => setShowAdmin(false)} />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {activeTab === "map" && <MapView refreshSignal={feedRefreshSignal} flyToCoords={flyToCoords} deepLinkPlaceId={deepLinkPlaceId} />}
        {activeTab === "live" && (isGuest ? <AuthGate /> : <LivePage refreshSignal={feedRefreshSignal} onGoToMap={handleGoToMap} />)}
        {activeTab === "profil" && (isGuest ? <AuthGate /> : <ProfilPage onOpenAdmin={() => setShowAdmin(true)} onClose={() => setActiveTab("map")} />)}
      </div>

      {/* Guest signup prompt floating on map */}
      {isGuest && activeTab === "map" && (
        <div className="fixed bottom-20 left-4 right-4 z-[1999]">
          <div className="bg-card/95 backdrop-blur-xl border border-gold/30 rounded-2xl p-4 shadow-2xl shadow-gold/10">
            <p className="text-sm font-semibold text-foreground text-center mb-2">
              🔥 Inscris-toi pour poster, liker et débloquer tous les avantages
            </p>
            <button
              onClick={() => {
                // Show AuthGate by switching to a tab that requires auth
                setActiveTab("profil");
              }}
              className="w-full py-3 rounded-xl font-bold text-sm text-primary-foreground shadow-lg"
              style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
            >
              Continuer avec Google 🚀
            </button>
          </div>
        </div>
      )}

      {/* Jema floating button — only on map tab */}
      {activeTab === "map" && !isGuest && (
        <a
          href="https://www.jemaride.com"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-4 z-[1999] flex items-center gap-1.5 bg-card/90 backdrop-blur-xl border border-border hover:border-gold/40 text-foreground px-3 py-2 rounded-full shadow-lg shadow-black/20 transition-all active:scale-95"
        >
          <span className="text-base">🚕</span>
          <span className="text-[11px] font-bold">Jema</span>
        </a>
      )}

      <BottomNav active={activeTab} onChange={(tab) => {
        analytics.tabChange(tab);
        setActiveTab(tab);
      }} onHome={handleHome} onFlashPost={() => {
        if (isGuest) {
          setActiveTab("profil");
          return;
        }
        setShowFlashPost(true);
      }} />
      {!isGuest && <FlashPost open={showFlashPost} onClose={() => setShowFlashPost(false)} onPosted={() => { setFeedRefreshSignal((v) => v + 1); setActiveTab("live"); }} />}

      {/* Floating info button */}
      {!isGuest && (
        <button
          onClick={() => setExplainerTab("insider")}
          className="fixed top-4 right-4 z-[1999] w-9 h-9 rounded-full bg-card/90 backdrop-blur-xl border border-border hover:border-gold/40 flex items-center justify-center shadow-lg shadow-black/20 transition-all active:scale-95"
          aria-label="En savoir plus"
        >
          <span className="text-sm">💡</span>
        </button>
      )}

      {/* Explainer sheet (post-login) */}
      <ExplainerSheet
        open={explainerTab !== null}
        onClose={() => setExplainerTab(null)}
        initialTab={explainerTab ?? "insider"}
      />

      {/* Welcome tutorial for first-time users (shown AFTER login) */}
      {!isGuest && <WelcomeModal open={showWelcome} onComplete={handleWelcomeComplete} />}
    </div>
  );
};

export default Index;
