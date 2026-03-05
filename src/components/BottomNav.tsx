import { Map, Radio, Gift, Home, Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type Tab = "map" | "live" | "profil";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  onHome: () => void;
  onFlashPost?: () => void;
  unreadNotifications?: number;
}

export default function BottomNav({ active, onChange, onHome, onFlashPost, unreadNotifications = 0 }: BottomNavProps) {
  const { t } = useLanguage();

  const iconClass = (isActive: boolean) =>
    `w-6 h-6 transition-colors duration-150 ${isActive ? "text-foreground" : "text-muted-foreground"}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[2000] bg-background/95 backdrop-blur-xl border-t border-border/50">
      <div className="flex items-center justify-around h-12 max-w-md mx-auto">
        <button onClick={onHome} className="flex flex-col items-center justify-center w-12 h-12">
          <Home className={iconClass(false)} strokeWidth={1.5} />
        </button>

        <button onClick={() => onChange("map")} className="flex flex-col items-center justify-center w-12 h-12">
          <Map className={iconClass(active === "map")} strokeWidth={active === "map" ? 2.5 : 1.5} />
        </button>

        <button onClick={onFlashPost} className="relative -mt-5 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 overflow-hidden shadow-[0_0_16px_2px_hsl(43_76%_52%/0.3)]" style={{ background: "linear-gradient(135deg, #BF953F, #FCF6BA, #B38728)" }}>
          <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
        </button>

        <button onClick={() => onChange("live")} className="flex flex-col items-center justify-center w-12 h-12 relative">
          <Radio className={iconClass(active === "live")} strokeWidth={active === "live" ? 2.5 : 1.5} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-destructive" />
        </button>

        <button onClick={() => onChange("profil")} className="flex flex-col items-center justify-center w-12 h-12 relative">
          <Gift className={iconClass(active === "profil")} strokeWidth={active === "profil" ? 2.5 : 1.5} />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
