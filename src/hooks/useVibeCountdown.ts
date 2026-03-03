import { useState, useEffect, useCallback } from "react";

const SIX_HOURS = 6 * 60 * 60 * 1000;

export function useVibeCountdown(createdAt: string | null, isOfficial?: boolean) {
  const getRemaining = useCallback(() => {
    if (!createdAt || isOfficial) return null;
    const expiresAt = new Date(createdAt).getTime() + SIX_HOURS;
    return Math.max(0, expiresAt - Date.now());
  }, [createdAt, isOfficial]);

  const [remaining, setRemaining] = useState<number | null>(getRemaining);

  useEffect(() => {
    setRemaining(getRemaining());
    if (!createdAt || isOfficial) return;

    const interval = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r !== null && r <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, isOfficial, getRemaining]);

  const expired = remaining !== null && remaining <= 0;

  const formatted = remaining !== null && remaining > 0
    ? formatCountdown(remaining)
    : remaining === 0 ? "00:00:00" : null;

  return { remaining, formatted, expired };
}

function formatCountdown(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function isUnderTwoHours(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 2 * 60 * 60 * 1000;
}
