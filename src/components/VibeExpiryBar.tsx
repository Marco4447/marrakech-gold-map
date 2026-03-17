import { useEffect, useState } from "react";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export default function VibeExpiryBar({ createdAt, isOfficial }: { createdAt: string; isOfficial?: boolean }) {
  const [progress, setProgress] = useState(100);
  const [phase, setPhase] = useState<"fresh" | "active" | "dying" | "dead">("fresh");

  useEffect(() => {
    if (isOfficial) return; // official vibes don't expire
    const update = () => {
      const age = Date.now() - new Date(createdAt).getTime();
      const pct = Math.max(0, 100 - (age / SIX_HOURS_MS) * 100);
      setProgress(pct);
      if (pct > 75) setPhase("fresh");
      else if (pct > 40) setPhase("active");
      else if (pct > 10) setPhase("dying");
      else setPhase("dead");
    };
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [createdAt, isOfficial]);

  if (isOfficial || progress === 0) return null;

  const colors = {
    fresh: "bg-emerald-500",
    active: "bg-gold",
    dying: "bg-orange-500",
    dead: "bg-destructive",
  };

  const labels: Record<string, string | null> = {
    fresh: null,
    active: null,
    dying: "⏳ S'efface bientôt",
    dead: "💨 Presque disparu",
  };

  return (
    <div className="px-3 pb-2">
      {labels[phase] && (
        <p className={`text-[9px] font-bold mb-1 ${phase === "dead" ? "text-destructive animate-pulse" : "text-orange-400"}`}>
          {labels[phase]}
        </p>
      )}
      <div className="h-0.5 w-full bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${colors[phase]} ${phase === "dying" || phase === "dead" ? "animate-pulse" : ""}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
