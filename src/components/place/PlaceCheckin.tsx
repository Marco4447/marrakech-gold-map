import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PlaceCheckinProps {
  placeId: string;
  placeName: string;
}

interface CheckinUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const THREE_HOURS = 3 * 60 * 60 * 1000;

export default function PlaceCheckin({ placeId, placeName }: PlaceCheckinProps) {
  const { user } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState<CheckinUser[]>([]);
  const [count, setCount] = useState(0);

  // Fetch active check-ins for this place
  useEffect(() => {
    const fetchCheckins = async () => {
      const cutoff = new Date(Date.now() - THREE_HOURS).toISOString();
      const { data, error } = await supabase
        .from("checkins")
        .select("user_id")
        .eq("place_id", placeId)
        .gte("created_at", cutoff);

      if (error || !data) return;
      setCount(data.length);

      // Check if current user is checked in
      if (user && data.some((c: any) => c.user_id === user.id)) {
        setCheckedIn(true);
      }

      // Fetch profiles for avatars (max 5)
      const userIds = data.slice(0, 5).map((c: any) => c.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles_public")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        if (profiles) setActiveUsers(profiles as CheckinUser[]);
      }
    };
    fetchCheckins();
  }, [placeId, user]);

  const handleCheckin = async () => {
    if (!user) {
      toast("Connecte-toi pour faire un check-in 📍", {
        action: { label: "S'inscrire", onClick: () => window.dispatchEvent(new CustomEvent("wk:goto-auth")) },
      });
      return;
    }

    setLoading(true);
    try {
      if (checkedIn) {
        // Check out — delete active checkin
        await supabase
          .from("checkins")
          .delete()
          .eq("user_id", user.id)
          .eq("place_id", placeId);
        setCheckedIn(false);
        setCount((c) => Math.max(0, c - 1));
        toast("Tu as quitté " + placeName);
      } else {
        // First, remove any existing checkin (user can only be at one place)
        await supabase
          .from("checkins")
          .delete()
          .eq("user_id", user.id);

        // Check in
        await supabase
          .from("checkins")
          .insert({ user_id: user.id, place_id: placeId });
        setCheckedIn(true);
        setCount((c) => c + 1);
        toast.success("Check-in ! 📍 Tu es au " + placeName);
        try { navigator.vibrate?.([10, 20, 10]); } catch {}
      }
    } catch (err) {
     
      toast.error("Erreur de check-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Active count */}
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 3).map((u) => (
              <div key={u.user_id} className="w-6 h-6 rounded-full border-2 border-background overflow-hidden bg-muted">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xs font-bold text-foreground">
                    {(u.full_name || "?")[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{count}</span> personne{count > 1 ? "s" : ""} ici maintenant
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </motion.div>
      )}

      {/* Check-in button */}
      <button
        onClick={handleCheckin}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-50 ${
          checkedIn
            ? "bg-green-500/10 border border-green-500/30 text-green-400"
            : "bg-card border border-border text-foreground hover:border-gold/30"
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : checkedIn ? (
          <><LogOut className="w-4 h-4" /> Je pars</>
        ) : (
          <><MapPin className="w-4 h-4" /> Je suis là</>
        )}
      </button>
    </div>
  );
}
