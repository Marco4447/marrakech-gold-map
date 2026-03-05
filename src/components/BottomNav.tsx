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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[2000] bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-10px_30px_hsl(var(--background)/0.7)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        <button onClick={onHome} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors text-foreground/85 hover:text-gold hover:bg-surface">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-wide uppercase">{t("nav_home")}</span>
        </button>

        <button onClick={() => onChange("map")} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${active === "map" ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-foreground hover:bg-surface"}`}>
          <Map className={`w-5 h-5 ${active === "map" ? "drop-shadow-[0_0_6px_hsl(43,56%,52%,0.5)]" : ""}`} />
          <span className="text-[10px] font-semibold tracking-wide uppercase">{t("nav_explore")}</span>
          {active === "map" && <div className="w-1 h-1 rounded-full bg-gold mt-0.5" />}
        </button>

        <button onClick={onFlashPost} className="relative -mt-6 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 overflow-hidden shadow-[0_0_20px_4px_hsl(43_76%_52%/0.35)]" style={{ background: "linear-gradient(to bottom right, #BF953F, #FCF6BA, #B38728)" }}>
          <Plus className="w-7 h-7 text-primary-foreground drop-shadow-sm" />
          <div className="absolute inset-0 cta-shimmer pointer-events-none" />
        </button>

        <button onClick={() => onChange("live")} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${active === "live" ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-foreground hover:bg-surface"}`}>
          <div className="relative">
            <Radio className={`w-5 h-5 ${active === "live" ? "drop-shadow-[0_0_6px_hsl(43,56%,52%,0.5)]" : ""}`} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase">{t("nav_vibe")}</span>
          {active === "live" && <div className="w-1 h-1 rounded-full bg-gold mt-0.5" />}
        </button>

        <button onClick={() => onChange("profil")} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${active === "profil" ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-foreground hover:bg-surface"}`}>
          <div className="relative">
            <Gift className={`w-5 h-5 ${active === "profil" ? "drop-shadow-[0_0_6px_hsl(43,56%,52%,0.5)]" : ""}`} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          <span className="text-[10px] font-semibold tracking-wide uppercase">{t("nav_enjoy")}</span>
          {active === "profil" && <div className="w-1 h-1 rounded-full bg-gold mt-0.5" />}
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
