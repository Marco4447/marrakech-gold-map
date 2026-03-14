import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import VibeFeedScreen from "./VibeFeedScreen";
import LiveRadarScreen from "./LiveRadarScreen";
import PartnerDashboardScreen from "./PartnerDashboardScreen";
import BottomNav from "./BottomNav";
import AuthModal from "./AuthModal";

export default function StrategicApp() {
  const [activeTab, setActiveTab] = useState<"feed" | "radar" | "profile">("feed");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthRequired = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setActiveTab("profile");
  };

  return (
    <div className="relative h-screen w-full bg-background overflow-hidden">
      {/* Main Content */}
      <div className="h-full pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "feed" && (
            <div key="feed" className="h-full">
              <VibeFeedScreen />
            </div>
          )}
          {activeTab === "radar" && (
            <div key="radar" className="h-full">
              <LiveRadarScreen />
            </div>
          )}
          {activeTab === "profile" && isAuthenticated && (
            <div key="profile" className="h-full overflow-y-auto">
              <PartnerDashboardScreen />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAuthRequired={handleAuthRequired}
        isAuthenticated={isAuthenticated}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}
