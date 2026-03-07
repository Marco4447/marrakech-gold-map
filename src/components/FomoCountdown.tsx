import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface Props {
  endTime: string;
  className?: string;
}

export default function FomoCountdown({ endTime, className = "" }: Props) {
  const [remaining, setRemaining] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Expiré");
        setUrgent(true);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 7200000); // < 2h
      if (h > 0) setRemaining(`${h}h ${m.toString().padStart(2, "0")}m`);
      else setRemaining(`${m}m ${s.toString().padStart(2, "0")}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className={`flex items-center gap-1.5 ${urgent ? "text-destructive" : "text-gold"} ${className}`}>
      <Clock className={`w-3 h-3 ${urgent ? "animate-pulse" : ""}`} />
      <span className={`text-[11px] font-bold tabular-nums ${urgent ? "animate-pulse" : ""}`}>
        {remaining === "Expiré" ? "⏰ Expiré" : `⏳ Expire dans ${remaining}`}
      </span>
    </div>
  );
}
