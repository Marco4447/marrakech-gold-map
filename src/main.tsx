import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorReporting } from "./lib/errorReporting";

initErrorReporting();

// Handle stale chunk errors gracefully (after deploys with new hashes)
if (import.meta.env.PROD) {
  const isDynamicImportLoadError = (reason: unknown) => {
    if (!(reason instanceof Error)) return false;
    const msg = reason.message.toLowerCase();
    return (
      msg.includes("failed to fetch dynamically imported module") ||
      msg.includes("importing a module script failed") ||
      msg.includes("loading chunk")
    );
  };

  const reloadOnce = () => {
    const key = "wk_stale_reload";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    window.location.reload();
  };

  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    reloadOnce();
  });

  window.addEventListener("unhandledrejection", (e) => {
    if (isDynamicImportLoadError(e.reason)) {
      e.preventDefault();
      reloadOnce();
    }
  });
}

// Mount app immediately — no async bootstrap, no cache cleanup blocking render
createRoot(document.getElementById("root")!).render(<App />);
