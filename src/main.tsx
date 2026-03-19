import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorReporting } from "./lib/errorReporting";

initErrorReporting();

const BOOT_CACHE_CLEANUP_KEY = "wk_boot_cache_cleanup_v3";

const shouldRunCleanupOnce = () => {
  try {
    return localStorage.getItem(BOOT_CACHE_CLEANUP_KEY) !== "1";
  } catch {
    return false;
  }
};

const markCleanupDone = () => {
  try {
    localStorage.setItem(BOOT_CACHE_CLEANUP_KEY, "1");
  } catch {
    // Ignore storage errors
  }
};

const cleanupStalePwaAssets = async (): Promise<boolean> => {
  if (!import.meta.env.PROD) return false;
  if (!shouldRunCleanupOnce()) return false;

  markCleanupDone();

  let didCleanup = false;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        didCleanup = true;
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    }

    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      if (cacheKeys.length > 0) {
        didCleanup = true;
        await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
      }
    }
  } catch (error) {
    console.warn("[BootCleanup] Failed to clean stale assets", error);
  }

  return didCleanup;
};

const mountApp = () => {
  createRoot(document.getElementById("root")!).render(<App />);
};

const bootstrap = async () => {
  const cleaned = await cleanupStalePwaAssets();

  if (cleaned) {
    window.location.replace(window.location.href);
    return;
  }

  mountApp();
};

void bootstrap();
