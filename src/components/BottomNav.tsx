import { Map, Radio, User, Home } from "lucide-react";

type Tab = "map" | "live" | "profil";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  onHome: () => void;
}

const tabs: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: "map", label: "Map", icon: Map },
  { id: "live", label: "Live", icon: Radio },
  { id: "profil", label: "Profil", icon: User },
];

export default function BottomNav({ active, onChange, onHome }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[2000] bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-10px_30px_hsl(var(--background)/0.7)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {/* Home button */}
        <button
          onClick={onHome}
          className="flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-colors text-foreground/85 hover:text-gold hover:bg-surface"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-wide uppercase">Accueil</span>
        </button>

        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-colors ${
                isActive ? "text-gold bg-gold/10" : "text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_6px_hsl(43,56%,52%,0.5)]" : ""}`} />
              <span className="text-[10px] font-semibold tracking-wide uppercase">{label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-gold mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
