import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorReporting } from "./lib/errorReporting";

initErrorReporting();

// Mount app synchronously
createRoot(document.getElementById("root")!).render(<App />);

// Production: handle stale chunks after deploys
if (import.meta.env.PROD) {
  const reloaded = sessionStorage.getItem("wk_chunk_reload");
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    if (!reloaded) { sessionStorage.setItem("wk_chunk_reload", "1"); location.reload(); }
  });
  window.addEventListener("unhandledrejection", (e) => {
    if (!(e.reason instanceof Error)) return;
    const m = e.reason.message.toLowerCase();
    if ((m.includes("failed to fetch dynamically imported module") || m.includes("loading chunk")) && !reloaded) {
      e.preventDefault(); sessionStorage.setItem("wk_chunk_reload", "1"); location.reload();
    }
  });
}
