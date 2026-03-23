import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Bell, Users, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  placeId: string | null;
}

interface HabitueUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  checkin_count: number;
}

interface FollowerUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  followed_at: string;
}

const HABITUE_THRESHOLD = 3;

export default function PartnerCommunity({ placeId }: Props) {
  const [habitues, setHabitues] = useState<HabitueUser[]>([]);
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"habitues" | "followers">("habitues");

  useEffect(() => {
    if (!placeId) return;
    const load = async () => {
      // Fetch all checkins for this place, grouped by user
      const { data: checkins } = await (supabase
        .from("checkins") as any)
        .select("user_id")
        .eq("place_id", placeId);

      if (checkins) {
        const counts: Record<string, number> = {};
        checkins.forEach((c: any) => {
          counts[c.user_id] = (counts[c.user_id] || 0) + 1;
        });

        const habitueIds = Object.entries(counts)
          .filter(([, count]) => count >= HABITUE_THRESHOLD)
          .sort(([, a], [, b]) => b - a);

        if (habitueIds.length > 0) {
          const { data: profiles } = await (supabase
            .from("profiles_public") as any)
            .select("user_id, full_name, avatar_url")
            .in("user_id", habitueIds.map(([id]) => id));

          const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
          setHabitues(habitueIds.map(([uid, count]) => {
            const p = profileMap.get(uid) as any;
            return {
              user_id: uid,
              full_name: p?.full_name || null,
              avatar_url: p?.avatar_url || null,
              checkin_count: count,
            };
          }));
        }
      }

      // Fetch followers
      const { data: followsData } = await (supabase
        .from("place_follows" as any) as any)
        .select("user_id, created_at")
        .eq("place_id", placeId)
        .order("created_at", { ascending: false });

      if (followsData && followsData.length > 0) {
        const { data: profiles } = await (supabase
          .from("profiles_public") as any)
          .select("user_id, full_name, avatar_url")
          .in("user_id", followsData.map((f: any) => f.user_id));

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        setFollowers(followsData.map((f: any) => {
          const p = profileMap.get(f.user_id) as any;
          return {
            user_id: f.user_id,
            full_name: p?.full_name || null,
            avatar_url: p?.avatar_url || null,
            followed_at: f.created_at,
          };
        }));
      }

      setLoading(false);
    };
    load();
  }, [placeId]);

  const Avatar = ({ url, name }: { url: string | null; name: string | null }) => (
    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
      {url ? (
        <img src={url} alt={name || ""} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-muted-foreground">
          {(name || "?")[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gold" />
        <h3 className="font-display text-sm font-bold text-foreground">Communauté</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("habitues")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            tab === "habitues"
              ? "bg-gold/15 border border-gold/30 text-gold"
              : "bg-card/80 border border-border text-muted-foreground"
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          Habitués ({habitues.length})
        </button>
        <button
          onClick={() => setTab("followers")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            tab === "followers"
              ? "bg-gold/15 border border-gold/30 text-gold"
              : "bg-card/80 border border-border text-muted-foreground"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Followers ({followers.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">Chargement...</p>
        </div>
      ) : tab === "habitues" ? (
        <div className="space-y-2">
          {habitues.length === 0 ? (
            <div className="text-center py-6 bg-card/60 border border-border rounded-xl">
              <Star className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Pas encore d'habitués</p>
              <p className="text-2xs text-muted-foreground/60 mt-0.5">
                Un client devient Habitué après {HABITUE_THRESHOLD} visites
              </p>
            </div>
          ) : (
            habitues.map((h, i) => (
              <motion.div
                key={h.user_id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 bg-card/80 border border-border rounded-xl px-3 py-2.5"
              >
                <Avatar url={h.avatar_url} name={h.full_name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {h.full_name || "Utilisateur"}
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    {h.checkin_count} visites
                  </p>
                </div>
                <span className="text-2xs bg-gold/15 text-gold px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-gold" /> Habitué
                </span>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {followers.length === 0 ? (
            <div className="text-center py-6 bg-card/60 border border-border rounded-xl">
              <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Pas encore de followers</p>
              <p className="text-2xs text-muted-foreground/60 mt-0.5">
                Les clients suivent ton lieu via le QR code
              </p>
            </div>
          ) : (
            followers.map((f, i) => (
              <motion.div
                key={f.user_id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 bg-card/80 border border-border rounded-xl px-3 py-2.5"
              >
                <Avatar url={f.avatar_url} name={f.full_name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {f.full_name || "Utilisateur"}
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    Suit depuis {new Date(f.followed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <Bell className="w-3.5 h-3.5 text-gold" />
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
