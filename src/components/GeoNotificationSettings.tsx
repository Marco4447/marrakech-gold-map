import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, MapPin, Navigation, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface GeoNotificationSettingsProps {
  userId: string;
}

type NotifStatus = "enabled" | "disabled" | "not-supported" | "denied";

const STORAGE_KEY = "wk_geo_notifs_enabled";

function getNotifSupport(): NotifStatus {
  if (typeof window === "undefined") return "not-supported";
  if (!("Notification" in window) || !("geolocation" in navigator)) return "not-supported";
  if (Notification.permission === "denied") return "denied";
  return "disabled";
}

export default function GeoNotificationSettings({ userId }: GeoNotificationSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<NotifStatus>("disabled");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const support = getNotifSupport();
    if (support === "not-supported" || support === "denied") {
      setStatus(support);
      setEnabled(false);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true" && Notification.permission === "granted") {
      setEnabled(true);
      setStatus("enabled");
    } else {
      setEnabled(false);
      setStatus("disabled");
    }
  }, []);

  const handleToggle = async () => {
    if (status === "not-supported") {
      toast.error("Les notifications ne sont pas supportées sur ce navigateur");
      return;
    }
    if (status === "denied") {
      toast.error("Les notifications sont bloquées. Vérifie les paramètres de ton navigateur.");
      return;
    }

    if (enabled) {
      // Disable
      setEnabled(false);
      setStatus("disabled");
      localStorage.setItem(STORAGE_KEY, "false");
      toast.success("Notifications désactivées");
      return;
    }

    // Enable — request permission if needed
    setLoading(true);
    try {
      if (Notification.permission !== "granted") {
        const result = await Notification.requestPermission();
        if (result !== "granted") {
          setStatus(result === "denied" ? "denied" : "disabled");
          toast.error("Permission de notification refusée");
          setLoading(false);
          return;
        }
      }

      // Request geolocation permission
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
        });
      });

      setEnabled(true);
      setStatus("enabled");
      localStorage.setItem(STORAGE_KEY, "true");
      toast.success("Notifications à proximité activées !");
    } catch (err) {
      console.error("Permission error:", err);
      toast.error("Impossible d'activer les notifications de proximité");
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    enabled: { label: "Activé", dotColor: "bg-emerald-400" },
    disabled: { label: "Désactivé", dotColor: "bg-white/20" },
    "not-supported": { label: "Non supporté", dotColor: "bg-red-400/50" },
    denied: { label: "Bloqué", dotColor: "bg-red-400" },
  };

  const currentStatus = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4"
    >
      {/* Header row with toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white text-sm font-semibold">Notifications à proximité</h3>
            <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
              Reçois une alerte quand tu es près d'un spot avec offre VIP
            </p>
          </div>
        </div>

        {/* Custom toggle */}
        <button
          onClick={handleToggle}
          disabled={loading || status === "not-supported"}
          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
            enabled ? "bg-[#D4AF37]" : "bg-white/10"
          } ${loading ? "opacity-50 cursor-wait" : ""} ${
            status === "not-supported" ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <motion.div
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
            animate={{ left: enabled ? 24 : 4 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotColor}`} />
        <span className="text-white/30 text-xs">{currentStatus.label}</span>
      </div>

      {/* Info text */}
      <div className="flex items-start gap-2 bg-white/[0.03] rounded-xl px-3 py-2.5">
        <Bell className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
        <p className="text-white/25 text-[11px] leading-relaxed">
          Max 3 notifications par jour · Rayon de 200m
        </p>
      </div>

      {/* Warning for denied state */}
      {status === "denied" && (
        <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 rounded-xl px-3 py-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400/60 mt-0.5 shrink-0" />
          <p className="text-red-400/50 text-[11px] leading-relaxed">
            Les notifications sont bloquées. Va dans les paramètres de ton navigateur pour les
            réactiver.
          </p>
        </div>
      )}
    </motion.div>
  );
}
