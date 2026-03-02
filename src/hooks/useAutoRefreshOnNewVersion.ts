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

    void checkForNewVersion();
    intervalId = setInterval(() => {
      void checkForNewVersion();
    }, 45000);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
}
