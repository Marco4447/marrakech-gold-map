import { Home, Search, PlusSquare, User, Map, MessageCircle, Bell, Menu } from "lucide-react";
import type { Tab } from "./BottomNav";
import { useNotifications } from "@/hooks/useNotifications";

interface AppSidebarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  onCreatePress: () => void;
  onNotificationsPress?: () => void;
  onMessagesPress?: () => void;
  unreadMessages?: number;
}

const NAV_ITEMS: { tab: Tab | "create" | "notifications" | "messages"; icon: typeof Home; label: string }[] = [
  { tab: "feed", icon: Home, label: "Accueil" },
  { tab: "discover", icon: Search, label: "Explorer" },
  { tab: "map", icon: Map, label: "Carte" },
  { tab: "messages" as any, icon: MessageCircle, label: "Messages" },
  { tab: "notifications" as any, icon: Bell, label: "Notifications" },
  { tab: "create", icon: PlusSquare, label: "Créer" },
  { tab: "profil", icon: User, label: "Profil" },
];

export default function AppSidebar({ active, onChange, onCreatePress, onNotificationsPress, onMessagesPress, unreadMessages = 0 }: AppSidebarProps) {
  const { unreadCount } = useNotifications();

  return (
    <aside className="hidden md:flex flex-col h-[100dvh] sticky top-0 border-r border-border bg-background z-50 lg:w-[220px] md:w-[72px] transition-all duration-200">
      {/* Logo */}
      <div className="px-3 pt-8 pb-6 lg:px-5">
        <h1 className="hidden lg:block font-display text-xl font-bold text-foreground tracking-tight">
          Weshkech
        </h1>
        <div className="lg:hidden flex justify-center">
          <span className="text-xl font-display font-bold text-foreground">W</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-2 lg:px-3">
        {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
          const isActive = tab === active;
          const isCreate = tab === "create";
          const isNotif = tab === "notifications";
          const isMsg = tab === "messages";

          return (
            <button
              key={tab}
              onClick={() => {
                if (isCreate) { onCreatePress(); return; }
                if (isNotif) { onNotificationsPress?.(); return; }
                if (isMsg) { onMessagesPress?.(); return; }
                onChange(tab as Tab);
              }}
              className={`relative flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-150 group hover:bg-card active:scale-[0.97]
                ${isActive ? "font-bold" : "font-normal"}
              `}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-all ${isActive ? "text-foreground" : "text-foreground/70 group-hover:text-foreground"}`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {isNotif && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {isMsg && unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </div>
              <span className={`hidden lg:block text-sm ${isActive ? "text-foreground font-semibold" : "text-foreground/70 group-hover:text-foreground"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: Settings */}
      <div className="px-2 lg:px-3 pb-8">
        <button className="flex items-center gap-4 px-3 py-3 rounded-xl transition-all group hover:bg-card w-full active:scale-[0.97]">
          <Menu className="w-6 h-6 text-foreground/70 group-hover:text-foreground" strokeWidth={1.5} />
          <span className="hidden lg:block text-sm text-foreground/70 group-hover:text-foreground">Plus</span>
        </button>
      </div>
    </aside>
  );
}
