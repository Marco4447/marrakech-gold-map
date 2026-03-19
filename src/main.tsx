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

  // Cache reset disabled — was causing reload loops for new visitors
  // If stale caches are an issue, the stale-entry check below handles it.

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

  // Stale-entry check — only runs after app is rendered, no reload loop
  setTimeout(() => {
    void checkForNewEntryOnBoot();
  }, 3000);

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
