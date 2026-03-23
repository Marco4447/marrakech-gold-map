import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Map, User } from "lucide-react";

interface BottomNavProps {
  activeTab: "feed" | "radar" | "profile";
  onTabChange: (tab: "feed" | "radar" | "profile") => void;
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

const navItems = [
  { id: "feed" as const, icon: Home, label: "Feed" },
  { id: "radar" as const, icon: Map, label: "Radar" },
  { id: "profile" as const, icon: User, label: "Profil" },
];

export default function BottomNav({ 
  activeTab, 
  onTabChange, 
  onAuthRequired,
  isAuthenticated 
}: BottomNavProps) {
  const handleTabClick = (tabId: "feed" | "radar" | "profile") => {
    if (tabId === "profile" && !isAuthenticated) {
      onAuthRequired();
      return;
    }
    onTabChange(tabId);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-nav"
    >
      <div className="mx-4 mb-4">
        <div className="bg-surface/90 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl shadow-black/40 p-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  whileTap={{ scale: 0.9 }}
                  className={`relative flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gold/20 text-gold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gold/10 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="w-5 h-5 relative z-10" />
                  <span className="text-2xs font-medium relative z-10">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
