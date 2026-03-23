import { useEffect, useState, useSyncExternalStore } from "react";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// Global tick — one single interval for all expiry bars
let globalTick = 0;
let listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!intervalId) {
    intervalId = setInterval(() => {
      globalTick++;
      listeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getSnapshot() {
  return globalTick;
}

export default function VibeExpiryBar({ createdAt, isOfficial }: { createdAt: string; isOfficial?: boolean }) {
  useSyncExternalStore(subscribe, getSnapshot);

  if (isOfficial) return null;

  const age = Date.now() - new Date(createdAt).getTime();
  const pct = Math.max(0, 100 - (age / SIX_HOURS_MS) * 100);

  if (pct === 0) return null;

  const phase = pct > 75 ? "fresh" : pct > 40 ? "active" : pct > 10 ? "dying" : "dead";

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
        <p className={`text-2xs font-bold mb-1 ${phase === "dead" ? "text-destructive animate-pulse" : "text-orange-400"}`}>
          {labels[phase]}
        </p>
      )}
      <div className="h-0.5 w-full bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${colors[phase]} ${phase === "dying" || phase === "dead" ? "animate-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
