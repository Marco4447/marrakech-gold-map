import { Map, Radio, User, Home, Plus } from "lucide-react";

type Tab = "map" | "live" | "profil";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  onHome: () => void;
  onFlashPost?: () => void;
}

const tabs: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: "map", label: "Map", icon: Map },
  { id: "live", label: "Live", icon: Radio },
  { id: "profil", label: "Profil", icon: User },
];

export default function BottomNav({ active, onChange, onHome, onFlashPost }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[2000] bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-10px_30px_hsl(var(--background)/0.7)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {/* Home button */}
        <button
          onClick={onHome}
          className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors text-foreground/85 hover:text-gold hover:bg-surface"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-wide uppercase">Accueil</span>
        </button>

        {/* Map tab */}
        <button
          onClick={() => onChange("map")}
          className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
            active === "map" ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-foreground hover:bg-surface"
          }`}
        >
          <Map className={`w-5 h-5 ${active === "map" ? "drop-shadow-[0_0_6px_hsl(43,56%,52%,0.5)]" : ""}`} />
          <span className="text-[10px] font-semibold tracking-wide uppercase">Map</span>
          {active === "map" && <div className="w-1 h-1 rounded-full bg-gold mt-0.5" />}
        </button>

        {/* Central Flash Post button */}
        <button
          onClick={onFlashPost}
          className="relative -mt-6 w-14 h-14 rounded-full bg-gold hover:bg-gold-light shadow-xl shadow-gold/40 flex items-center justify-center transition-all active:scale-95 cta-shimmer overflow-hidden"
        >
          <Plus className="w-7 h-7 text-primary-foreground" />
        </button>

        {/* Live tab */}
        <button
          onClick={() => onChange("live")}
          className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
            active === "live" ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-foreground hover:bg-surface"
          }`}
        >
          <div className="relative">
            <Radio className={`w-5 h-5 ${active === "live" ? "drop-shadow-[0_0_6px_hsl(43,56%,52%,0.5)]" : ""}`} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase">Live</span>
          {active === "live" && <div className="w-1 h-1 rounded-full bg-gold mt-0.5" />}
        </button>

        {/* Profil tab */}
        <button
          onClick={() => onChange("profil")}
          className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
            active === "profil" ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-foreground hover:bg-surface"
          }`}
        >
          <User className={`w-5 h-5 ${active === "profil" ? "drop-shadow-[0_0_6px_hsl(43,56%,52%,0.5)]" : ""}`} />
          <span className="text-[10px] font-semibold tracking-wide uppercase">Profil</span>
          {active === "profil" && <div className="w-1 h-1 rounded-full bg-gold mt-0.5" />}
        </button>
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
