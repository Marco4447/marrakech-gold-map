import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorReporting } from "./lib/errorReporting";

initErrorReporting();

createRoot(document.getElementById("root")!).render(<App />);

// Production: handle stale chunks after deploys
if (import.meta.env.PROD) {
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    if (!sessionStorage.getItem("wk_cr")) {
      sessionStorage.setItem("wk_cr", "1");
      location.reload();
    }
  });
}
