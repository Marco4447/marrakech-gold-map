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
  const [spotCount, setSpotCount] = useState(0);

  // Fetch spot count for guest CTA
  useEffect(() => {
    if (user) return;
    const fetchCount = async () => {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!baseUrl || !apiKey) return;
      try {
        const res = await fetch(`${baseUrl}/rest/v1/places?select=id`, {
          headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Prefer: "count=exact" },
        });
        const count = res.headers.get("content-range")?.split("/")[1];
        if (count) setSpotCount(parseInt(count, 10));
      } catch {}
    };
    fetchCount();
  }, [user]);

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
        {activeTab === "map" && <MapView refreshSignal={feedRefreshSignal} flyToCoords={flyToCoords} deepLinkPlaceId={deepLinkPlaceId} isGuest={isGuest} />}
        {activeTab === "live" && (isGuest ? <AuthGate /> : <LivePage refreshSignal={feedRefreshSignal} onGoToMap={handleGoToMap} />)}
        {activeTab === "profil" && (isGuest ? <AuthGate /> : <ProfilPage onOpenAdmin={() => setShowAdmin(true)} onClose={() => setActiveTab("map")} />)}
      </div>

      {/* Guest progressive blur overlay + CTA */}
      {isGuest && activeTab === "map" && (
        <>
          {/* Progressive blur gradient from bottom */}
          <div className="fixed inset-x-0 bottom-0 h-[55vh] z-[1998] pointer-events-none"
            style={{
              background: "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 25%, hsl(var(--background) / 0.4) 60%, transparent 100%)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              maskImage: "linear-gradient(to top, black 0%, black 40%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to top, black 0%, black 40%, transparent 100%)",
            }}
          />
          {/* CTA card */}
          <div className="fixed bottom-20 left-4 right-4 z-[1999]">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5, type: "spring" }}
              className="bg-card/95 backdrop-blur-xl border border-gold/30 rounded-2xl p-5 shadow-2xl shadow-gold/10 text-center"
            >
              <p className="text-base font-bold text-foreground mb-1">
                🔒 Débloque la carte complète
              </p>
              {spotCount > 0 && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2, duration: 0.4 }}
                  className="text-xs font-semibold text-gold mb-1"
                >
                  📍 {spotCount} spots cachés près de toi
                </motion.p>
              )}
              <p className="text-xs text-muted-foreground mb-3">
                Inscris-toi pour voir tous les spots, poster des vibes et profiter des deals exclusifs
              </p>
              <button
                onClick={() => setActiveTab("profil")}
                className="w-full py-3 rounded-xl font-bold text-sm text-primary-foreground shadow-lg active:scale-[0.97] transition-transform"
                style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
              >
                Continuer avec Google 🚀
              </button>
              <p className="text-[10px] text-muted-foreground mt-2">
                Gratuit · 10 secondes · Sans spam
              </p>
            </motion.div>
          </div>
        </>
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
