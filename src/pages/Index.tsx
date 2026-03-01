import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import MapView from "@/components/MapView";
import BottomNav from "@/components/BottomNav";
import LivePage from "@/components/LivePage";
import ProfilPage from "@/components/ProfilPage";
import AdminPage from "@/components/AdminPage";
import LandingPage from "@/components/LandingPage";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/hooks/useAuth";

type Tab = "map" | "live" | "profil";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLanding, setShowLanding] = useState(() => {
    return !sessionStorage.getItem("wk_landed");
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
    sessionStorage.setItem("wk_landed", "1");
    setShowLanding(false);
  };

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
        {activeTab === "map" && <MapView />}
        {activeTab === "live" && <LivePage />}
        {activeTab === "profil" && <ProfilPage onOpenAdmin={() => setShowAdmin(true)} />}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} onHome={() => setShowLanding(true)} />

      <AnimatePresence>
        {showLanding && <LandingPage onEnter={handleEnter} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
