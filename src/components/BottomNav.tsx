import { Home, Map, Search, Plus, User, MessageCircle } from "lucide-react";

export type Tab = "feed" | "map" | "create" | "discover" | "profil";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  onCreatePress?: () => void;
  unreadNotifications?: number;
  onNotificationsPress?: () => void;
  unreadMessages?: number;
  onMessagesPress?: () => void;
}

export default function BottomNav({ active, onChange, onCreatePress, unreadMessages = 0, onMessagesPress }: BottomNavProps) {
  const iconClass = (isActive: boolean) =>
    `w-6 h-6 transition-colors duration-150 ${isActive ? "text-foreground" : "text-muted-foreground"}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[2000] bg-background/95 backdrop-blur-xl border-t border-border/50" aria-label="Navigation principale" role="tablist">
      <div className="flex items-center justify-around h-12 max-w-md mx-auto">
        {/* Feed (Home) */}
        <button onClick={() => onChange("feed")} className="flex flex-col items-center justify-center w-12 h-12" aria-label="Feed" role="tab" aria-selected={active === "feed"}>
          <Home className={iconClass(active === "feed")} strokeWidth={active === "feed" ? 2.5 : 1.5} />
        </button>

        {/* Map */}
        <button onClick={() => onChange("map")} className="flex flex-col items-center justify-center w-12 h-12" aria-label="Carte" role="tab" aria-selected={active === "map"}>
          <Map className={iconClass(active === "map")} strokeWidth={active === "map" ? 2.5 : 1.5} />
        </button>

        {/* Create (center, gold) */}
        <button
          onClick={onCreatePress}
          className="relative -mt-5 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 overflow-hidden shadow-[0_0_16px_2px_hsl(43_76%_52%/0.3)]"
          style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
          aria-label="Créer une vibe"
        >
          <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
        </button>

        {/* Discover (Search) */}
        <button onClick={() => onChange("discover")} className="flex flex-col items-center justify-center w-12 h-12" aria-label="Découvrir" role="tab" aria-selected={active === "discover"}>
          <Search className={iconClass(active === "discover")} strokeWidth={active === "discover" ? 2.5 : 1.5} />
        </button>

        {/* Profile */}
        <button onClick={() => onChange("profil")} className="flex flex-col items-center justify-center w-12 h-12" aria-label="Profil" role="tab" aria-selected={active === "profil"}>
          <User className={iconClass(active === "profil")} strokeWidth={active === "profil" ? 2.5 : 1.5} />
        </button>
      </div>

      {/* Messages button moved to header on mobile, keeping safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
