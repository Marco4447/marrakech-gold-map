import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface NotifPrefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  challenges: boolean;
  vip_offers: boolean;
}

const DEFAULTS: NotifPrefs = {
  likes: true,
  comments: true,
  follows: true,
  messages: true,
  challenges: true,
  vip_offers: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchPrefs = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("notification_preferences" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      const d = data as any;
      setPrefs({
        likes: d.likes ?? true,
        comments: d.comments ?? true,
        follows: d.follows ?? true,
        messages: d.messages ?? true,
        challenges: d.challenges ?? true,
        vip_offers: d.vip_offers ?? true,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const updatePref = useCallback(async (key: keyof NotifPrefs, value: boolean) => {
    if (!user) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);

    await supabase.from("notification_preferences" as any).upsert({
      user_id: user.id,
      ...updated,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "user_id" });
  }, [user, prefs]);

  return { prefs, loading, updatePref };
}
