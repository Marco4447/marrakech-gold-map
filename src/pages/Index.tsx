import { useState } from "react";
import MapView from "@/components/MapView";
import BottomNav from "@/components/BottomNav";
import LivePage from "@/components/LivePage";
import ProfilPage from "@/components/ProfilPage";
import AdminPage from "@/components/AdminPage";

type Tab = "map" | "live" | "profil";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [showAdmin, setShowAdmin] = useState(false);

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
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
};

export default Index;
