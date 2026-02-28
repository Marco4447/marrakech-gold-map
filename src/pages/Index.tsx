import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import MapView from "@/components/MapView";
import BottomNav from "@/components/BottomNav";
import LivePage from "@/components/LivePage";
import ProfilPage from "@/components/ProfilPage";
import AdminPage from "@/components/AdminPage";
import LandingPage from "@/components/LandingPage";

type Tab = "map" | "live" | "profil";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLanding, setShowLanding] = useState(() => {
    return !sessionStorage.getItem("wk_landed");
  });

  const handleEnter = () => {
    sessionStorage.setItem("wk_landed", "1");
    setShowLanding(false);
  };

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
