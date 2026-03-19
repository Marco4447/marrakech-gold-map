import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorReporting } from "./lib/errorReporting";

initErrorReporting();

const STALE_RELOAD_KEY = "wk_stale_reload";
const BLACK_SCREEN_RECOVERY_KEY = "wk_boot_recovery_v4";
const ROOT_WATCHDOG_DELAY_MS = 2500;

const isDynamicImportLoadError = (reason: unknown) => {
  if (!(reason instanceof Error)) return false;
  const msg = reason.message.toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("loading chunk")
  );
};

const reloadOnce = (key = STALE_RELOAD_KEY) => {
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  window.location.reload();
};

async function clearClientRuntimeCaches() {
  let cleaned = false;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        cleaned = true;
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      if (keys.length > 0) {
        cleaned = true;
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    }
  } catch (error) {
    console.warn("[BootRecovery] Cache cleanup failed", error);
  }

  return cleaned;
}

async function recoverFromBlackScreenOnce() {
  if (!import.meta.env.PROD) return;

  try {
    if (localStorage.getItem(BLACK_SCREEN_RECOVERY_KEY) === "1") return;
    localStorage.setItem(BLACK_SCREEN_RECOVERY_KEY, "1");
  } catch {
    return;
  }

  await clearClientRuntimeCaches();
  reloadOnce("wk_black_screen_recovery_reload");
}

function installChunkErrorRecovery() {
  if (!import.meta.env.PROD) return;

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadOnce();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isDynamicImportLoadError(event.reason)) {
      event.preventDefault();
      reloadOnce();
    }
  });
}

function mountApp() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("[Boot] #root introuvable");
    void recoverFromBlackScreenOnce();
    return;
  }

  createRoot(rootElement).render(<App />);
}

function scheduleRootWatchdog() {
  if (!import.meta.env.PROD) return;

  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  window.setTimeout(() => {
    const hasContent =
      rootElement.childElementCount > 0 || ((rootElement.textContent?.trim().length ?? 0) > 0);

    if (!hasContent) {
      console.warn("[BootWatchdog] Root vide détecté, récupération en cours");
      void recoverFromBlackScreenOnce();
    }
  }, ROOT_WATCHDOG_DELAY_MS);
}

installChunkErrorRecovery();
mountApp();
scheduleRootWatchdog();
