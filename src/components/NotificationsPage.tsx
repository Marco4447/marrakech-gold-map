import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Trophy, Bell, Star, UserPlus, Gift, Settings } from "lucide-react";
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
  const [showSettings, setShowSettings] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem("wk_notif_prefs");
      return raw ? JSON.parse(raw) : {
        new_like: true, new_follower: true, new_comment: true,
        challenge_update: true, vip_offers: true,
      };
    } catch {
      return { new_like: true, new_follower: true, new_comment: true, challenge_update: true, vip_offers: true };
    }
  });

  const updatePref = (key: string, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    localStorage.setItem("wk_notif_prefs", JSON.stringify(updated));
  };

  useEffect(() => {
    fetchAll();
    markAllRead();
  }, []);

  const getIcon = (type: string) => {
    const entry = ICON_MAP[type] || { icon: Bell, color: "text-muted-foreground" };
    const Icon = entry.icon;
    return <Icon className={`w-5 h-5 ${entry.color}`} />;
  };

  // Filter notifications based on prefs
  const filteredNotifications = notifications.filter(n => {
    if (n.type === "like" && notifPrefs.new_like === false) return false;
    if (n.type === "follow" && notifPrefs.new_follower === false) return false;
    if (n.type === "comment" && notifPrefs.new_comment === false) return false;
    if (n.type === "challenge" && notifPrefs.challenge_update === false) return false;
    if (n.type === "vip" && notifPrefs.vip_offers === false) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Notifications</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <Bell className="w-10 h-10 opacity-30" />
            <p className="text-sm">Aucune notification pour le moment</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredNotifications.map((n, i) => (
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

      {/* Settings sheet */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[3000] flex flex-col justify-end" onClick={() => setShowSettings(false)}>
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-card border-t border-border rounded-t-3xl"
            >
              <div className="w-10 h-1 bg-muted/50 rounded-full mx-auto mt-3 mb-4" />
              <div className="px-4 pb-2">
                <h3 className="text-sm font-bold text-foreground mb-4">Paramètres de notifications</h3>
                <div className="space-y-4">
                  {[
                    { key: "new_like", label: "Nouveaux likes", emoji: "❤️" },
                    { key: "new_follower", label: "Nouveaux abonnés", emoji: "👤" },
                    { key: "new_comment", label: "Commentaires", emoji: "💬" },
                    { key: "challenge_update", label: "Challenges", emoji: "🏆" },
                    { key: "vip_offers", label: "Offres VIP à proximité", emoji: "✨" },
                  ].map(pref => (
                    <div key={pref.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{pref.emoji}</span>
                        <span className="text-sm text-foreground">{pref.label}</span>
                      </div>
                      <button
                        onClick={() => updatePref(pref.key, !notifPrefs[pref.key])}
                        className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                          notifPrefs[pref.key] ? "bg-gold" : "bg-muted/50"
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                          notifPrefs[pref.key] ? "translate-x-5" : "translate-x-0.5"
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="h-8" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
