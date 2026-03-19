import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorReporting } from "./lib/errorReporting";

initErrorReporting();

// Catch synchronous render errors
try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (err) {
  showError(err);
}

// Catch async errors that happen during React rendering
window.addEventListener("error", (e) => {
  if (document.getElementById("boot-loader")) showError(e.error || e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  // Only show if app hasn't mounted yet (boot-loader still visible)
  if (document.getElementById("boot-loader")) showError(e.reason);
});

function showError(err: unknown) {
  const root = document.getElementById("root");
  if (!root) return;
  const msg = err instanceof Error ? `${err.message}\n\n${err.stack || ""}` : String(err);
  root.innerHTML = `<div style="min-height:100dvh;width:100%;background:#0a0a0a;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:24px;font-family:system-ui">
    <p style="color:#D4AF37;font-size:18px;font-weight:bold">Erreur de chargement</p>
    <pre style="color:#f87171;font-size:11px;max-width:90vw;overflow:auto;white-space:pre-wrap;background:#1a1a1a;padding:16px;border-radius:12px;max-height:60vh">${msg.replace(/</g,"&lt;")}</pre>
    <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" style="background:linear-gradient(135deg,#BF953F,#FCF6BA,#B38728);color:#000;font-weight:bold;padding:12px 24px;border:none;border-radius:12px;cursor:pointer;font-size:14px">Vider le cache et recharger</button>
  </div>`;
}

// Stale chunk handler
if (import.meta.env.PROD) {
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    if (!sessionStorage.getItem("wk_cr")) { sessionStorage.setItem("wk_cr", "1"); location.reload(); }
  });
}
