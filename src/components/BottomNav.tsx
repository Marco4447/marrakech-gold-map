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

const vibrate = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };

export default function BottomNav({ active, onChange, onCreatePress, unreadMessages = 0, onMessagesPress }: BottomNavProps) {
  const iconClass = (isActive: boolean) =>
    `w-6 h-6 transition-colors duration-150 ${isActive ? "text-foreground" : "text-muted-foreground"}`;

  const tabBtn = (tab: Tab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => { onChange(tab); vibrate(); }}
      className="flex flex-col items-center justify-center w-12 h-12 active:scale-90 transition-transform"
      aria-label={label}
      role="tab"
      aria-selected={active === tab}
    >
      {icon}
    </button>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-nav bg-background/95 backdrop-blur-xl border-t border-border/50" aria-label="Navigation principale" role="tablist">
      <div className="flex items-center justify-around h-12">
        {tabBtn("feed", <Home className={iconClass(active === "feed")} strokeWidth={active === "feed" ? 2.5 : 1.5} />, "Feed")}
        {tabBtn("map", <Map className={iconClass(active === "map")} strokeWidth={active === "map" ? 2.5 : 1.5} />, "Carte")}

        {/* Create (center, gold) */}
        <button
          onClick={() => { onCreatePress?.(); vibrate(15); }}
          className="relative -mt-5 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 overflow-hidden shadow-lg"
          style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}
          aria-label="Créer une vibe"
        >
          <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
        </button>

        {tabBtn("discover", <Search className={iconClass(active === "discover")} strokeWidth={active === "discover" ? 2.5 : 1.5} />, "Découvrir")}
        {tabBtn("profil", <User className={iconClass(active === "profil")} strokeWidth={active === "profil" ? 2.5 : 1.5} />, "Profil")}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
