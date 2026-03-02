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
import { useAuth } from "@/hooks/useAuth";

type Tab = "map" | "live" | "profil";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showFlashPost, setShowFlashPost] = useState(false);
  const [feedRefreshSignal, setFeedRefreshSignal] = useState(0);
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showLanding, setShowLanding] = useState(() => {
    return !localStorage.getItem("wk_landed");
  });
  const [authStuck, setAuthStuck] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      setAuthStuck(false);
      return;
    }

    const timeout = setTimeout(() => {
      setAuthStuck(true);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [loading]);

  const handleEnter = () => {
    localStorage.setItem("wk_landed", "1");
    setShowLanding(false);
  };

  const handleHome = () => {
    localStorage.removeItem("wk_landed");
    setShowLanding(true);
  };

  // Skip landing on initial load if user is already logged in (but not if they clicked Home)
  useEffect(() => {
    if (user && showLanding && localStorage.getItem("wk_landed")) {
      setShowLanding(false);
    }
  }, [user]);

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
        {activeTab === "profil" && <ProfilPage onOpenAdmin={() => setShowAdmin(true)} />}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} onHome={handleHome} onFlashPost={() => setShowFlashPost(true)} />
      <FlashPost open={showFlashPost} onClose={() => setShowFlashPost(false)} onPosted={() => { setFeedRefreshSignal((v) => v + 1); setActiveTab("live"); }} />

      <AnimatePresence>
        {showLanding && <LandingPage onEnter={handleEnter} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
