import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");

    // --- Stripe stats ---
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    let stripeStats = null;
    if (stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      // Recent charges (last 30 days)
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      const charges = await stripe.charges.list({
        created: { gte: thirtyDaysAgo },
        limit: 100,
      });

      const totalRevenue = charges.data
        .filter((c) => c.status === "succeeded")
        .reduce((sum, c) => sum + c.amount, 0);

      const recentPayments = charges.data
        .filter((c) => c.status === "succeeded")
        .slice(0, 20)
        .map((c) => {
          // Detect app source from metadata, description, or product info
          const desc = (c.description || "").toLowerCase();
          const metaApp = c.metadata?.app;
          let app = "Autre";
          if (metaApp === "weshkech" || desc.includes("weshkech") || desc.includes("insider") || desc.includes("vip")) {
            app = "Weshkech";
          } else if (metaApp === "jemaride" || desc.includes("jemaride") || desc.includes("taxi") || desc.includes("ride")) {
            app = "Jemaride";
          }
          return {
            id: c.id,
            amount: c.amount / 100,
            currency: c.currency,
            email: c.billing_details?.email || c.receipt_email || "—",
            description: c.description || "—",
            created: new Date(c.created * 1000).toISOString(),
            app,
          };
        });

      // Active subscriptions
      const subs = await stripe.subscriptions.list({ status: "active", limit: 100 });

      stripeStats = {
        total_revenue_30d: totalRevenue / 100,
        currency: charges.data[0]?.currency || "eur",
        successful_charges_30d: charges.data.filter((c) => c.status === "succeeded").length,
        active_subscriptions: subs.data.length,
        recent_payments: recentPayments,
      };
    }

    // --- Supabase stats ---
    const { count: totalUsers } = await supabaseClient
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalVibes } = await supabaseClient
      .from("vibes")
      .select("*", { count: "exact", head: true });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: vibes24h } = await supabaseClient
      .from("vibes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    // Active partners with credits
    const { data: partners } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "partner");

    let partnerDetails: any[] = [];
    if (partners && partners.length > 0) {
      const partnerIds = partners.map((p) => p.user_id);

      const { data: profiles } = await supabaseClient
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", partnerIds);

      const { data: credits } = await supabaseClient
        .from("partner_credits")
        .select("user_id, credits")
        .in("user_id", partnerIds);

      const { data: requests } = await supabaseClient
        .from("partner_requests")
        .select("user_id, business_name, category, status")
        .in("user_id", partnerIds)
        .eq("status", "approved");

      partnerDetails = partnerIds.map((uid) => {
        const profile = profiles?.find((p) => p.user_id === uid);
        const credit = credits?.find((c) => c.user_id === uid);
        const request = requests?.find((r) => r.user_id === uid);
        return {
          user_id: uid,
          full_name: profile?.full_name || profile?.email || "—",
          email: profile?.email || "—",
          avatar_url: profile?.avatar_url,
          credits: credit?.credits ?? 0,
          business_name: request?.business_name || "—",
          category: request?.category || "—",
        };
      });
    }

    return new Response(
      JSON.stringify({
        stripe: stripeStats,
        users: {
          total: totalUsers || 0,
          total_vibes: totalVibes || 0,
          vibes_24h: vibes24h || 0,
        },
        partners: partnerDetails,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
