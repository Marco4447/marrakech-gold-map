import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Camera, Clock } from "lucide-react";
import { timeAgoShort } from "@/lib/timeAgo";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_vip: boolean;
  created_at: string;
  vibes_count: number;
  last_vibe_at: string | null;
}

// timeAgo imported from shared lib

export default function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Fetch all profiles (admin RLS policy allows this)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, avatar_url, is_vip, created_at")
          .order("created_at", { ascending: false });

        if (!profiles) { setLoading(false); return; }

        // Fetch vibe counts per user
        const { data: vibes } = await supabase
          .from("vibes")
          .select("user_id, created_at")
          .not("user_id", "is", null);

        const vibeMap: Record<string, { count: number; lastAt: string | null }> = {};
        (vibes || []).forEach((v: any) => {
          if (!v.user_id) return;
          if (!vibeMap[v.user_id]) {
            vibeMap[v.user_id] = { count: 0, lastAt: null };
          }
          vibeMap[v.user_id].count++;
          if (!vibeMap[v.user_id].lastAt || v.created_at > vibeMap[v.user_id].lastAt!) {
            vibeMap[v.user_id].lastAt = v.created_at;
          }
        });

        const enriched: UserProfile[] = profiles.map((p: any) => ({
          ...p,
          vibes_count: vibeMap[p.user_id]?.count || 0,
          last_vibe_at: vibeMap[p.user_id]?.lastAt || null,
        }));

        setUsers(enriched);
      } catch (e) {
       
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Utilisateurs inscrits ({users.length})
      </h3>
      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.user_id}
            className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden shrink-0">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-gold font-bold">
                  {(u.full_name || u.email || "?")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-foreground truncate">{u.full_name || "Sans nom"}</p>
                {u.is_vip && <span className="text-2xs font-bold bg-gold/15 text-gold px-1.5 py-0.5 rounded-full">VIP</span>}
              </div>
              <p className="text-2xs text-muted-foreground truncate flex items-center gap-1">
                <Mail className="w-2.5 h-2.5" /> {u.email || "—"}
              </p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-2xs text-muted-foreground flex items-center gap-0.5">
                  <Camera className="w-2.5 h-2.5" /> {u.vibes_count} vibes
                </span>
                <span className="text-2xs text-muted-foreground flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> {u.last_vibe_at ? timeAgoShort(u.last_vibe_at) : "aucune"}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xs text-muted-foreground">{timeAgoShort(u.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
