import { createElement } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Show any boot error visually instead of black screen
function showBootError(err: unknown) {
  const root = document.getElementById("root");
  if (!root) return;
  const msg = err instanceof Error ? `${err.message}\n${err.stack || ""}` : String(err);
  root.innerHTML = `
    <div style="height:100dvh;width:100%;background:#0a0a0a;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:24px;font-family:system-ui">
      <p style="color:#D4AF37;font-size:18px;font-weight:bold">Erreur de chargement</p>
      <pre style="color:#f87171;font-size:11px;max-width:90vw;overflow:auto;white-space:pre-wrap;background:#1a1a1a;padding:16px;border-radius:12px;max-height:60vh">${msg.replace(/</g, "&lt;")}</pre>
      <button onclick="location.reload()" style="background:linear-gradient(135deg,#BF953F,#FCF6BA,#B38728);color:#000;font-weight:bold;padding:12px 24px;border:none;border-radius:12px;cursor:pointer;font-size:14px">Recharger</button>
    </div>
  `;
}

async function boot() {
  try {
    const { initErrorReporting } = await import("./lib/errorReporting");
    initErrorReporting();
    const { default: App } = await import("./App");
    createRoot(document.getElementById("root")!).render(createElement(App));
  } catch (err) {
    console.error("[BOOT CRASH]", err);
    showBootError(err);
  }
}

boot();

// Production: handle stale chunks
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
