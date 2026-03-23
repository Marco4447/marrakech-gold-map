import { reportError } from "@/lib/errorReporting";
import { useEffect, useRef } from "react";

const extractModuleEntry = (html: string): string | null => {
  const match = html.match(/<script\s+type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>/i);
  if (!match?.[1]) return null;

  try {
    return new URL(match[1], window.location.origin).pathname;
  } catch {
    return null;
  }
};

const getCurrentModuleEntry = (): string | null => {
  const currentScript = Array.from(document.querySelectorAll("script[type='module']")).find(
    (script) => script.getAttribute("src")
  );

  if (!currentScript) return null;

  try {
    return new URL(currentScript.getAttribute("src") || "", window.location.origin).pathname;
  } catch {
    return null;
  }
};

const RELOAD_GUARD_KEY = "wk_reload_guard";
const MAX_RELOADS = 2;
const GUARD_WINDOW_MS = 30_000; // 30 seconds

/** Returns true if we're allowed to reload, false if we've hit the loop limit. */
function canReload(): boolean {
  try {
    const raw = sessionStorage.getItem(RELOAD_GUARD_KEY);
    const now = Date.now();
    if (raw) {
      const { count, ts } = JSON.parse(raw);
      if (now - ts < GUARD_WINDOW_MS) {
        if (count >= MAX_RELOADS) return false;
        sessionStorage.setItem(RELOAD_GUARD_KEY, JSON.stringify({ count: count + 1, ts }));
        return true;
      }
    }
    sessionStorage.setItem(RELOAD_GUARD_KEY, JSON.stringify({ count: 1, ts: now }));
    return true;
  } catch {
    return false;
  }
}

export function useAutoRefreshOnNewVersion() {
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const checkForNewVersion = async () => {
      if (reloadingRef.current) return;

      try {
        const response = await fetch(`${window.location.origin}/?v=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "cache-control": "no-cache",
            pragma: "no-cache",
          },
        });

        const latestHtml = await response.text();
        const latestEntry = extractModuleEntry(latestHtml);
        const currentEntry = getCurrentModuleEntry();

        if (latestEntry && currentEntry && latestEntry !== currentEntry) {
          if (!canReload()) {
            reportError("[AutoRefresh] Reload loop detected, skipping.");
            return;
          }
          reloadingRef.current = true;
          window.location.reload();
        }
      } catch {
        // Ignore transient network issues
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkForNewVersion();
      }
    };

    // Delay initial check to avoid competing with SW activation
    const initialTimeout = setTimeout(() => {
      void checkForNewVersion();
    }, 3000);

    intervalId = setInterval(() => {
      void checkForNewVersion();
    }, 45000);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
}
