import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function AuthDebugBadge() {
  const { user, loading } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const status = loading ? "loading" : user ? "connected" : "guest";
  const color =
    status === "loading"
      ? "bg-amber-500"
      : status === "connected"
      ? "bg-emerald-500"
      : "bg-red-500";
  const label =
    status === "loading"
      ? "⏳ Auth…"
      : status === "connected"
      ? "✅ Connecté"
      : "👤 Invité";

  return (
    <div className="fixed top-2 right-2 z-debug select-none">
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`${color} text-white text-2xs font-mono font-bold px-2 py-1 rounded-full shadow-lg backdrop-blur-sm opacity-80 hover:opacity-100 transition-opacity active:scale-95`}
      >
        {label}
      </button>
      {expanded && (
        <div className="mt-1 bg-black/90 text-white text-2xs font-mono p-3 rounded-xl shadow-xl max-w-[240px] space-y-1">
          <p>
            <span className="text-muted-foreground">status:</span> {status}
          </p>
          <p>
            <span className="text-muted-foreground">uid:</span>{" "}
            {user?.id?.slice(0, 8) ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">email:</span>{" "}
            {user?.email ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">provider:</span>{" "}
            {user?.app_metadata?.provider ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">loading:</span>{" "}
            {String(loading)}
          </p>
        </div>
      )}
    </div>
  );
}
