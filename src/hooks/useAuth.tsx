import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ttqTrack } from "@/lib/ttq";
import type { User } from "@supabase/supabase-js";

interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User, retries = 3): Promise<void> => {
    const fallbackProfile: Profile = {
      full_name:
        (currentUser.user_metadata?.full_name as string | undefined) ||
        (currentUser.user_metadata?.name as string | undefined) ||
        currentUser.email?.split("@")[0] ||
        null,
      email: currentUser.email || null,
      avatar_url: (currentUser.user_metadata?.avatar_url as string | undefined) || null,
    };

    for (let attempt = 0; attempt < retries; attempt++) {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (data) {
        setProfile({
          full_name: data.full_name || fallbackProfile.full_name,
          email: data.email || fallbackProfile.email,
          avatar_url: data.avatar_url || fallbackProfile.avatar_url,
        });
        return;
      }

      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }

      // No profile row yet: create one client-side (RLS owner-only)
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          user_id: currentUser.id,
          full_name: fallbackProfile.full_name,
          email: fallbackProfile.email,
          avatar_url: fallbackProfile.avatar_url,
        },
        { onConflict: "user_id" }
      );

      if (upsertError) {
        console.error("Failed to upsert profile:", upsertError, error);
      }

      setProfile(fallbackProfile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      await fetchProfile(user, 1);
    } catch (e) {
      console.error("Failed to refresh profile:", e);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;
    let initialSessionHandled = false;

    // 1. Set up listener FIRST — catches INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;

        // Mark initial session handled to avoid double-processing
        if (event === "INITIAL_SESSION") {
          initialSessionHandled = true;
        }

        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          if (event === "SIGNED_IN") {
            ttqTrack("CompleteRegistration", { content_name: "google_oauth" });
            // Process referral code if present
            try {
              const refCode = localStorage.getItem("weshkech_ref");
              if (refCode) {
                localStorage.removeItem("weshkech_ref");
                const { data: codeData } = await supabase
                  .from("referral_codes" as any)
                  .select("user_id, code")
                  .eq("code", refCode)
                  .maybeSingle();
                if (codeData && (codeData as any).user_id !== currentUser.id) {
                  await supabase.from("referral_uses" as any).insert({
                    code: refCode,
                    referred_user_id: currentUser.id,
                    referrer_user_id: (codeData as any).user_id,
                  });
                }
              }
            } catch (e) {
              console.warn("Referral processing failed:", e);
            }
          }

          // TOKEN_REFRESHED means the session was restored — still fetch profile
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
            fetchProfile(currentUser).catch((e) => {
              console.error("Failed to fetch profile:", e);
            });
          }
        } else {
          setProfile(null);
        }
      }
    );

    // 2. Also call getSession immediately as a safety net
    // (some Supabase versions don't emit INITIAL_SESSION reliably on mobile)
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || initialSessionHandled) return;
      initialSessionHandled = true;
      const currentUser = data?.session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        fetchProfile(currentUser).catch(console.error);
      }
    }).catch((err) => {
      console.error("getSession failed:", err);
      if (mounted && !initialSessionHandled) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const signOutWithTimeout = async (scope: "global" | "local") => {
      const timeoutMs = 3500;
      return Promise.race([
        supabase.auth.signOut({ scope }),
        new Promise<{ error: Error }>((resolve) =>
          setTimeout(() => resolve({ error: new Error(`signOut ${scope} timeout`) }), timeoutMs)
        ),
      ]);
    };

    try {
      const globalResult = await signOutWithTimeout("global");
      if (globalResult?.error) {
        await signOutWithTimeout("local");
      }
    } catch (e) {
      console.error("Sign out error:", e);
      await signOutWithTimeout("local").catch(() => undefined);
    } finally {
      localStorage.removeItem("wk_landed");

      // Force clear persisted auth tokens
      for (const key of Object.keys(localStorage)) {
        if (
          (key.startsWith("sb-") && key.includes("-auth-token")) ||
          key.toLowerCase().includes("lovable") ||
          key.toLowerCase().includes("cloud-auth")
        ) {
          localStorage.removeItem(key);
        }
      }
      for (const key of Object.keys(sessionStorage)) {
        if (
          (key.startsWith("sb-") && key.includes("-auth-token")) ||
          key.toLowerCase().includes("lovable") ||
          key.toLowerCase().includes("cloud-auth")
        ) {
          sessionStorage.removeItem(key);
        }
      }

      setUser(null);
      setProfile(null);
      window.location.replace(window.location.origin);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
