import "./index.css";

function showError(msg: string) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `<div style="min-height:100dvh;width:100%;background:#0a0a0a;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:24px;font-family:system-ui;text-align:center">
    <p style="color:#D4AF37;font-size:18px;font-weight:bold">Erreur</p>
    <pre style="color:#f87171;font-size:11px;max-width:90vw;overflow:auto;white-space:pre-wrap;background:#1a1a1a;padding:16px;border-radius:12px;max-height:60vh">${msg.replace(/</g,"&lt;")}</pre>
    <button onclick="location.reload()" style="background:linear-gradient(135deg,#BF953F,#FCF6BA,#B38728);color:#000;font-weight:bold;padding:12px 24px;border:none;border-radius:12px;cursor:pointer">Recharger</button>
  </div>`;
}

// Use dynamic import so we can catch ANY error during module loading
import("./App").then((mod) => {
  const App = mod.default;
  if (!App) {
    showError("App module loaded but has no default export.\nKeys: " + Object.keys(mod).join(", "));
    return;
  }
  import("react-dom/client").then(({ createRoot }) => {
    import("react").then(({ createElement }) => {
      try {
        createRoot(document.getElementById("root")!).render(createElement(App));
      } catch (e) {
        showError("render() failed: " + (e instanceof Error ? e.message + "\n" + e.stack : String(e)));
      }
    });
  });
}).catch((err) => {
  showError("Import failed: " + (err instanceof Error ? err.message + "\n" + err.stack : String(err)));
});

// Also catch import of errorReporting
import("./lib/errorReporting").then(({ initErrorReporting }) => {
  initErrorReporting();
}).catch(() => {});

// Stale chunk handler
if (import.meta.env.PROD) {
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    if (!sessionStorage.getItem("wk_cr")) { sessionStorage.setItem("wk_cr", "1"); location.reload(); }
  });
}
