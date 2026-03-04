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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";

  try {
    // Verify admin using getClaims
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header");

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Not authenticated");

    const userId = claimsData.claims.sub as string;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");

    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");

    // --- Stripe stats ---
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    let stripeStats = null;

    // Known Weshkech product IDs
    const weshkechProductIds = new Set([
      "prod_U4veaYFPFrfRSD",
      "prod_U4vdXYPsFOtdJN",
      "prod_U4vdwFlBD3gYuO",
      "prod_U4vEDXfrrfUCCQ",
      "prod_U4Zmie9z5kvv9k",
      "prod_U4ZlJuIDMdaQMg",
      "prod_U4ZkOVawTSWsYD",
    ]);
    const jemarideProductIds = new Set([
      "prod_Tws8Y0htMwd8Ap",
    ]);

    if (stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      // Recent charges (last 30 days)
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      const charges = await stripe.charges.list({
        created: { gte: thirtyDaysAgo },
        limit: 100,
        expand: ["data.invoice"],
      });

      const succeededCharges = charges.data.filter((c) => c.status === "succeeded");

      const totalRevenue = succeededCharges.reduce((sum, c) => sum + c.amount, 0);

      // Build revenue_by_day from all succeeded charges
      const revenueByDay: Record<string, number> = {};
      for (const c of succeededCharges) {
        const day = new Date(c.created * 1000).toISOString().slice(0, 10);
        revenueByDay[day] = (revenueByDay[day] || 0) + c.amount / 100;
      }
      const revenue_by_day = Object.entries(revenueByDay)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // For each charge, try to find the product via checkout session
      const recentPayments = [];
      for (const c of succeededCharges.slice(0, 20)) {
        let app = "Autre";

        try {
          // Try to get checkout session for this payment intent
          if (c.payment_intent) {
            const sessions = await stripe.checkout.sessions.list({
              payment_intent: c.payment_intent as string,
              limit: 1,
              expand: ["data.line_items"],
            });
            if (sessions.data.length > 0 && sessions.data[0].line_items?.data) {
              for (const item of sessions.data[0].line_items.data) {
                const prodId = typeof item.price?.product === "string" ? item.price.product : (item.price?.product as any)?.id;
                if (prodId && weshkechProductIds.has(prodId)) {
                  app = "Weshkech";
                  break;
                }
                if (prodId && jemarideProductIds.has(prodId)) {
                  app = "Jemaride";
                  break;
                }
              }
            }
          }
        } catch (_) {
          // fallback: keep "Autre"
        }

        recentPayments.push({
          id: c.id,
          amount: c.amount / 100,
          currency: c.currency,
          email: c.billing_details?.email || c.receipt_email || "—",
          description: c.description || "—",
          created: new Date(c.created * 1000).toISOString(),
          app,
        });
      }

      // Active subscriptions
      const subs = await stripe.subscriptions.list({ status: "active", limit: 100 });

      stripeStats = {
        total_revenue_30d: totalRevenue / 100,
        currency: charges.data[0]?.currency || "eur",
        successful_charges_30d: succeededCharges.length,
        active_subscriptions: subs.data.length,
        recent_payments: recentPayments,
        revenue_by_day,
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
        .select("user_id, full_name, email, avatar_url, created_at")
        .in("user_id", partnerIds);

      const { data: credits } = await supabaseClient
        .from("partner_credits")
        .select("user_id, credits")
        .in("user_id", partnerIds);

      const { data: requests } = await supabaseClient
        .from("partner_requests")
        .select("user_id, business_name, category, status, offer_description, whatsapp_number, created_at")
        .in("user_id", partnerIds);

      // Get vibes per partner
      const { data: vibes } = await supabaseClient
        .from("vibes")
        .select("user_id, id, image_url, caption, location, likes, super_vibes, created_at, is_official")
        .in("user_id", partnerIds)
        .order("created_at", { ascending: false });

      // Get Stripe purchases per partner email
      const partnerEmails = (profiles || []).map((p) => p.email).filter(Boolean);
      let partnerPurchases: Record<string, any[]> = {};
      if (stripeKey && partnerEmails.length > 0) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        for (const email of partnerEmails) {
          try {
            const customers = await stripe.customers.list({ email, limit: 1 });
            if (customers.data.length > 0) {
              const charges = await stripe.charges.list({ customer: customers.data[0].id, limit: 10 });
              partnerPurchases[email] = charges.data
                .filter((c) => c.status === "succeeded")
                .map((c) => ({
                  amount: c.amount / 100,
                  currency: c.currency,
                  created: new Date(c.created * 1000).toISOString(),
                  description: c.description || "—",
                }));
            }
          } catch (_) {}
        }
      }

      partnerDetails = partnerIds.map((uid) => {
        const profile = profiles?.find((p) => p.user_id === uid);
        const credit = credits?.find((c) => c.user_id === uid);
        const partnerReqs = requests?.filter((r) => r.user_id === uid) || [];
        const approvedReq = partnerReqs.find((r) => r.status === "approved");
        const partnerVibes = vibes?.filter((v) => v.user_id === uid) || [];
        const purchases = partnerPurchases[profile?.email || ""] || [];
        return {
          user_id: uid,
          full_name: profile?.full_name || profile?.email || "—",
          email: profile?.email || "—",
          avatar_url: profile?.avatar_url,
          joined: profile?.created_at || null,
          credits: credit?.credits ?? 0,
          business_name: approvedReq?.business_name || "—",
          category: approvedReq?.category || "—",
          offer_description: approvedReq?.offer_description || null,
          whatsapp_number: approvedReq?.whatsapp_number || null,
          vibes: partnerVibes.slice(0, 10),
          total_vibes: partnerVibes.length,
          official_vibes: partnerVibes.filter((v) => v.is_official).length,
          purchases,
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
