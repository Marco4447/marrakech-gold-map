import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { initErrorReporting } from "./lib/errorReporting";

initErrorReporting();

const isDynamicImportLoadError = (reason: unknown) => {
  if (!(reason instanceof Error)) return false;
  const message = reason.message.toLowerCase();

  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("loading chunk")
  );
};

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
  const script = document.querySelector("script[type='module'][src]");
  if (!script) return null;

  try {
    return new URL(script.getAttribute("src") || "", window.location.origin).pathname;
  } catch {
    return null;
  }
};

if (import.meta.env.PROD) {
  const RECOVERY_KEY = "wk_boot_recovery_attempted";

  const recoverFromStaleAssets = async () => {
    if (sessionStorage.getItem(RECOVERY_KEY)) return;
    sessionStorage.setItem(RECOVERY_KEY, "1");

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
      }
    } finally {
      window.location.reload();
    }
  };

  const CACHE_RESET_VERSION = "v2";
  const CACHE_RESET_KEY = `wk_cache_reset_${CACHE_RESET_VERSION}`;

  const shouldForceResetCachesOnce = () => {
    try {
      return localStorage.getItem(CACHE_RESET_KEY) !== "1";
    } catch {
      return false;
    }
  };

  const markForcedResetDone = () => {
    try {
      localStorage.setItem(CACHE_RESET_KEY, "1");
    } catch {
      // ignore storage errors
    }
  };

  const forceResetCachesOnce = async () => {
    if (!shouldForceResetCachesOnce()) return;
    markForcedResetDone();

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
      }
    } finally {
      window.location.reload();
    }
  };

  const checkForNewEntryOnBoot = async () => {
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
        void recoverFromStaleAssets();
      }
    } catch {
      // Ignore transient network issues
    }
  };

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    void recoverFromStaleAssets();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!isDynamicImportLoadError(event.reason)) return;

    event.preventDefault();
    void recoverFromStaleAssets();
  });

  // One-time hard reset for clients stuck with stale service-worker caches.
  setTimeout(() => {
    void forceResetCachesOnce();
  }, 300);

  // Early stale-entry check before SW registration.
  setTimeout(() => {
    void checkForNewEntryOnBoot();
  }, 1200);

  // Register SW after a delay so it never blocks initial page load
  setTimeout(() => {
    registerSW({
      immediate: false,
      onRegisterError(error) {
        console.error("[PWA] service worker registration failed", error);
      },
    });
  }, 5000);
}

createRoot(document.getElementById("root")!).render(<App />);
