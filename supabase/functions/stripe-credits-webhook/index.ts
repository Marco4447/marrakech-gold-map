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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const metaType = session.metadata?.type;

      logStep("Session completed", { userId, metaType, sessionId: session.id });

      if (!userId) {
        logStep("ERROR: No user_id in metadata");
        throw new Error("Missing user_id in session metadata");
      }

      if (metaType === "b2c_vip") {
        // ===== VIP Guest Pass Activation =====
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { error: updateErr } = await supabaseAdmin
          .from("profiles")
          .update({ is_vip: true, vip_expires_at: expiresAt })
          .eq("user_id", userId);

        if (updateErr) {
          logStep("ERROR updating VIP status", { error: updateErr.message });
          throw updateErr;
        }

        logStep("VIP activated", { userId, expiresAt });
      } else if (metaType === "b2b_credits") {
        // ===== B2B Credit Top-up =====
        const credits = parseInt(session.metadata?.credits || "0", 10);
        if (credits <= 0) {
          logStep("ERROR: Invalid credit amount", { credits });
          throw new Error("Invalid credit amount");
        }

        // Upsert credits (increment if exists, insert if not)
        const { data: existing } = await supabaseAdmin
          .from("partner_credits")
          .select("credits")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          const { error: upErr } = await supabaseAdmin
            .from("partner_credits")
            .update({ credits: existing.credits + credits })
            .eq("user_id", userId);
          if (upErr) throw upErr;
        } else {
          const { error: insErr } = await supabaseAdmin
            .from("partner_credits")
            .insert({ user_id: userId, credits });
          if (insErr) throw insErr;
        }

        logStep("Credits added", { userId, credits, newTotal: (existing?.credits ?? 0) + credits });

        // Ensure partner role
        const { data: roleExists } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", "partner")
          .maybeSingle();

        if (!roleExists) {
          await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: userId, role: "partner" });
          logStep("Partner role assigned", { userId });
        }
      } else {
        logStep("Unknown product type, skipping", { metaType });
      }
    }

    // Handle subscription renewals
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;
      if (subscriptionId && invoice.billing_reason === "subscription_cycle") {
        // Renewal: extend VIP by 30 days
        const sub = await stripe.subscriptions.retrieve(subscriptionId as string);
        const userId = sub.metadata?.user_id;
        if (userId) {
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          await supabaseAdmin
            .from("profiles")
            .update({ is_vip: true, vip_expires_at: expiresAt })
            .eq("user_id", userId);
          logStep("VIP renewed", { userId, expiresAt });
        }
      }
    }

    // Handle subscription cancellations
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as any;
      const userId = sub.metadata?.user_id;
      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ is_vip: false })
          .eq("user_id", userId);
        logStep("VIP deactivated (subscription canceled)", { userId });
      }
    }

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
