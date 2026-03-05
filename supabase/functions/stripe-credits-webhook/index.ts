import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No Stripe signature");

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;
    if (webhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      logStep("WARNING: No STRIPE_WEBHOOK_SECRET set, parsing raw body");
      event = JSON.parse(body) as Stripe.Event;
    }

    logStep("Event received", { type: event.type, id: event.id });

    // === IDEMPOTENCE CHECK ===
    const { data: existing } = await supabaseAdmin
      .from("processed_stripe_events")
      .select("event_id")
      .eq("event_id", event.id)
      .maybeSingle();

    if (existing) {
      logStep("Event already processed, skipping", { id: event.id });
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    await supabaseAdmin.from("processed_stripe_events").insert({ event_id: event.id });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const metaType = session.metadata?.type;

      logStep("Session completed", { userId, metaType, sessionId: session.id });
      if (!userId) throw new Error("Missing user_id in session metadata");

      if (metaType === "b2c_vip") {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const { error } = await supabaseAdmin.from("profiles").update({ is_vip: true, vip_expires_at: expiresAt }).eq("user_id", userId);
        if (error) throw error;
        logStep("VIP activated", { userId, expiresAt });

      } else if (metaType === "b2b_credits") {
        const credits = parseInt(session.metadata?.credits || "0", 10);
        if (credits <= 0) throw new Error("Invalid credit amount");

        const { data: existingCredits } = await supabaseAdmin.from("partner_credits").select("credits").eq("user_id", userId).maybeSingle();
        if (existingCredits) {
          await supabaseAdmin.from("partner_credits").update({ credits: existingCredits.credits + credits }).eq("user_id", userId);
        } else {
          await supabaseAdmin.from("partner_credits").insert({ user_id: userId, credits });
        }
        logStep("Credits added", { userId, credits });

        // Ensure partner role
        const { data: roleExists } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", userId).eq("role", "partner").maybeSingle();
        if (!roleExists) {
          await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "partner" });
          logStep("Partner role assigned", { userId });
        }

      } else if (metaType === "vibe_boost") {
        const boostType = session.metadata?.boost_type || "24h_visibility";
        const vibeId = session.metadata?.vibe_id;
        if (!vibeId) throw new Error("Missing vibe_id for boost");

        const durations: Record<string, number> = {
          "24h_visibility": 24 * 60 * 60 * 1000,
          "discover_featured": 48 * 60 * 60 * 1000,
          "map_spotlight": 72 * 60 * 60 * 1000,
        };
        const boostExpiresAt = new Date(Date.now() + (durations[boostType] || 24 * 60 * 60 * 1000)).toISOString();

        await supabaseAdmin.from("vibe_boosts").insert({
          vibe_id: vibeId, user_id: userId, boost_type: boostType,
          boost_expires_at: boostExpiresAt, stripe_session_id: session.id,
        });
        logStep("Vibe boost created", { vibeId, boostType, boostExpiresAt });

      } else if (metaType === "partner_subscription") {
        const planType = session.metadata?.plan_type || "basic";
        const placeId = session.metadata?.place_id || null;
        const stripeSubId = session.subscription as string || null;

        // Deactivate old subscriptions
        await supabaseAdmin.from("partner_subscriptions").update({ status: "canceled" }).eq("partner_id", userId).eq("status", "active");

        await supabaseAdmin.from("partner_subscriptions").insert({
          partner_id: userId,
          place_id: placeId,
          plan_type: planType,
          status: "active",
          stripe_customer_id: session.customer as string || null,
          stripe_subscription_id: stripeSubId,
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Ensure partner role
        const { data: roleExists } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", userId).eq("role", "partner").maybeSingle();
        if (!roleExists) {
          await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "partner" });
        }

        logStep("Partner subscription created", { userId, planType });

      } else if (metaType === "sponsored_event") {
        const placeId = session.metadata?.place_id;
        const boostLevel = session.metadata?.boost_level || "standard";
        const title = session.metadata?.sponsored_title || "Événement sponsorisé";
        const eventDate = session.metadata?.sponsored_date || new Date().toISOString().slice(0, 10);

        if (placeId) {
          await supabaseAdmin.from("sponsored_events").insert({
            place_id: placeId, user_id: userId, title, event_date: eventDate,
            boost_level: boostLevel, price_paid: (session.amount_total || 0) / 100,
            stripe_session_id: session.id, status: "active",
          });
          logStep("Sponsored event created", { userId, placeId, title });
        }
      } else {
        logStep("Unknown product type, skipping", { metaType });
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;
      if (subscriptionId && invoice.billing_reason === "subscription_cycle") {
        const sub = await stripe.subscriptions.retrieve(subscriptionId as string);
        const userId = sub.metadata?.user_id;
        if (userId) {
          const metaType = sub.metadata?.type;
          if (metaType === "partner_subscription") {
            const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            await supabaseAdmin.from("partner_subscriptions").update({ end_date: endDate, status: "active" })
              .eq("partner_id", userId).eq("stripe_subscription_id", subscriptionId);
            logStep("Partner subscription renewed", { userId });
          } else {
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            await supabaseAdmin.from("profiles").update({ is_vip: true, vip_expires_at: expiresAt }).eq("user_id", userId);
            logStep("VIP renewed", { userId, expiresAt });
          }
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as any;
      const userId = sub.metadata?.user_id;
      if (userId) {
        const metaType = sub.metadata?.type;
        if (metaType === "partner_subscription") {
          await supabaseAdmin.from("partner_subscriptions").update({ status: "canceled" })
            .eq("partner_id", userId).eq("stripe_subscription_id", sub.id);
          logStep("Partner subscription canceled", { userId });
        } else {
          await supabaseAdmin.from("profiles").update({ is_vip: false }).eq("user_id", userId);
          logStep("VIP deactivated", { userId });
        }
      }
    }

    await supabaseAdmin.rpc("cleanup_old_stripe_events").catch(() => {});

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("FATAL ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
