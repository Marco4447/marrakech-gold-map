import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorReporting } from "./lib/errorReporting";

initErrorReporting();

// ── Mount app immediately — no async, no watchdog, no cache cleanup ──
createRoot(document.getElementById("root")!).render(<App />);

// ── Production: handle stale chunks after deploys ──
if (import.meta.env.PROD) {
  const reloaded = sessionStorage.getItem("wk_chunk_reload");

  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    if (!reloaded) {
      sessionStorage.setItem("wk_chunk_reload", "1");
      window.location.reload();
    }
  });

  window.addEventListener("unhandledrejection", (e) => {
    if (!(e.reason instanceof Error)) return;
    const msg = e.reason.message.toLowerCase();
    if (
      (msg.includes("failed to fetch dynamically imported module") ||
       msg.includes("importing a module script failed") ||
       msg.includes("loading chunk")) &&
      !reloaded
    ) {
      e.preventDefault();
      sessionStorage.setItem("wk_chunk_reload", "1");
      window.location.reload();
    }
  });
}
