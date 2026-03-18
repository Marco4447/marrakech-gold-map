import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

const isDynamicImportLoadError = (reason: unknown) => {
  if (!(reason instanceof Error)) return false;
  const message = reason.message.toLowerCase();

  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("loading chunk")
  );
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

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    void recoverFromStaleAssets();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!isDynamicImportLoadError(event.reason)) return;

    event.preventDefault();
    void recoverFromStaleAssets();
  });

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
