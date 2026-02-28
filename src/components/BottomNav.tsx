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
    <nav className="fixed bottom-0 left-0 right-0 z-[2000] bg-background/70 backdrop-blur-2xl border-t border-border/50 saturate-150">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {/* Home button */}
        <button
          onClick={onHome}
          className="flex flex-col items-center gap-0.5 px-6 py-2 transition-colors text-muted-foreground hover:text-gold"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Accueil</span>
        </button>

        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center gap-0.5 px-6 py-2 transition-colors ${
                isActive ? "text-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_6px_hsl(43,56%,52%,0.5)]" : ""}`} />
              <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
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
