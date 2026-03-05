import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Trophy, Bell, Star, UserPlus, Gift } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/timeAgo";

const ICON_MAP: Record<string, { icon: typeof Heart; color: string }> = {
  like: { icon: Heart, color: "text-red-400" },
  comment: { icon: MessageCircle, color: "text-blue-400" },
  challenge: { icon: Trophy, color: "text-yellow-400" },
  follow: { icon: UserPlus, color: "text-green-400" },
  vip: { icon: Star, color: "text-amber-400" },
  promo: { icon: Gift, color: "text-purple-400" },
};

export default function NotificationsPage() {
  const { notifications, markAllRead, fetchAll } = useNotifications();

  useEffect(() => {
    fetchAll();
    markAllRead();
  }, []);

  const getIcon = (type: string) => {
    const entry = ICON_MAP[type] || { icon: Bell, color: "text-muted-foreground" };
    const Icon = entry.icon;
    return <Icon className={`w-5 h-5 ${entry.color}`} />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">Notifications</h1>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <Bell className="w-10 h-10 opacity-30" />
            <p className="text-sm">Aucune notification pour le moment</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-start gap-3 px-4 py-3 border-b border-border/30 transition-colors ${
                  !n.is_read ? "bg-accent/20" : ""
                }`}
              >
                <div className="mt-0.5 w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{n.title}</p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
