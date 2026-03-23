import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Camera, Handshake, Gift, Ticket, BookOpen, Activity, Loader2 } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";

interface AdminEvent {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const ICON_MAP: Record<string, { icon: typeof Activity; color: string }> = {
  signup: { icon: UserPlus, color: "text-green-400" },
  vibe: { icon: Camera, color: "text-blue-400" },
  partner_request: { icon: Handshake, color: "text-amber-400" },
  vip_offer: { icon: Gift, color: "text-purple-400" },
  vip_pass: { icon: Ticket, color: "text-red-400" },
  story: { icon: BookOpen, color: "text-pink-400" },
};

const FILTER_OPTIONS = [
  { key: "all", label: "Tout" },
  { key: "signup", label: "Inscriptions" },
  { key: "vibe", label: "Vibes" },
  { key: "partner_request", label: "Partenaires" },
  { key: "vip_offer", label: "Offres" },
  { key: "vip_pass", label: "Pass" },
  { key: "story", label: "Stories" },
];

export default function AdminActivityFeed() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [liveCount, setLiveCount] = useState(0);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from("admin_events" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setEvents(data as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel("admin-events-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_events" },
        (payload) => {
          const e = payload.new as any;
          setEvents((prev) => [e, ...prev].slice(0, 200));
          setLiveCount((c) => c + 1);
          setTimeout(() => setLiveCount((c) => Math.max(0, c - 1)), 3000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchEvents]);

  const filtered = filter === "all" ? events : events.filter((e) => e.event_type === filter);

  const getIcon = (type: string) => {
    const entry = ICON_MAP[type] || { icon: Activity, color: "text-muted-foreground" };
    const Icon = entry.icon;
    return <Icon className={`w-4 h-4 ${entry.color}`} />;
  };

  // Stats summary
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((e) => e.created_at.slice(0, 10) === today);
  const signupsToday = todayEvents.filter((e) => e.event_type === "signup").length;
  const vibestoday = todayEvents.filter((e) => e.event_type === "vibe").length;

  return (
    <div className="space-y-4">
      {/* Live indicator + stats */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${liveCount > 0 ? "bg-green-400 animate-pulse" : "bg-green-400/50"}`} />
          <span className="text-xs font-bold text-foreground">Temps réel</span>
        </div>
        <div className="flex gap-2 ml-auto">
          <span className="text-2xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 font-bold">
            +{signupsToday} inscriptions
          </span>
          <span className="text-2xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold">
            +{vibestoday} vibes
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.key
                ? "bg-gold/15 text-gold border border-gold/20"
                : "text-muted-foreground hover:text-foreground bg-card border border-border/50"
            }`}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1 opacity-60">
                {events.filter((e) => e.event_type === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Events list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
          <Activity className="w-8 h-8 opacity-30 mb-2" />
          <p className="text-xs">Aucun événement</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {filtered.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i < 5 ? i * 0.03 : 0 }}
              className="flex items-start gap-3 p-3 rounded-xl border border-border/30 bg-card"
            >
              <div className="w-8 h-8 rounded-full bg-background border border-border/50 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(e.event_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{e.title}</p>
                {e.body && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.body}</p>
                )}
                <p className="text-2xs text-muted-foreground/60 mt-1">{timeAgo(e.created_at)}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
