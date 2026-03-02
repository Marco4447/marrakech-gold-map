import { useEffect, useState, useCallback } from "react";
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
import { useAuth } from "@/hooks/useAuth";

type Tab = "map" | "live" | "profil";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showFlashPost, setShowFlashPost] = useState(false);
  const [feedRefreshSignal, setFeedRefreshSignal] = useState(0);
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [authStuck, setAuthStuck] = useState(false);
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
    // Landing CTA clicked — trigger Google auth via AuthGate
    // The landing will be hidden once user logs in (useEffect above)
    localStorage.setItem("wk_landed", "1");
    setShowLanding(false);
  };

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
  if (loading && !authStuck) {
    return (
      <div className="h-[100dvh] w-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show landing page for non-authenticated users who haven't onboarded
  if (showLanding && !user) {
    return <LandingPage onEnter={handleEnter} />;
  }

  // Auth gate - user must be logged in
  if (!user) {
    return <AuthGate />;
  }

  if (showAdmin) {
    return (
      <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
        <AdminPage onBack={() => setShowAdmin(false)} />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {activeTab === "map" && <MapView refreshSignal={feedRefreshSignal} flyToCoords={flyToCoords} />}
        {activeTab === "live" && <LivePage refreshSignal={feedRefreshSignal} onGoToMap={handleGoToMap} />}
        {activeTab === "profil" && <ProfilPage onOpenAdmin={() => setShowAdmin(true)} onClose={() => setActiveTab("map")} />}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} onHome={handleHome} onFlashPost={() => setShowFlashPost(true)} />
      <FlashPost open={showFlashPost} onClose={() => setShowFlashPost(false)} onPosted={() => { setFeedRefreshSignal((v) => v + 1); setActiveTab("live"); }} />

      {/* Welcome tutorial for first-time users (shown AFTER login) */}
      <WelcomeModal open={showWelcome} onComplete={handleWelcomeComplete} />
    </div>
  );
};

export default Index;
