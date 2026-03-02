import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Credit packs mapping
const CREDIT_PACKS: Record<string, number> = {
  "price_1T6QadJ8RyilXHbfjF49QgrT": 5,
  "price_1T6QbfJ8RyilXHbfwFp0DNVJ": 15,
  "price_1T6QdDJ8RyilXHbfcrJHkLtG": 40,
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
    if (!signature) throw new Error("No signature");

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    let event: Stripe.Event;
    if (webhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const credits = parseInt(session.metadata?.credits || "0", 10);

      if (userId && credits > 0) {
        // Upsert partner_credits
        const { data: existing } = await supabaseAdmin
          .from("partner_credits")
          .select("credits")
          .eq("user_id", userId)
          .single();

        if (existing) {
          await supabaseAdmin
            .from("partner_credits")
            .update({ credits: existing.credits + credits })
            .eq("user_id", userId);
        } else {
          await supabaseAdmin
            .from("partner_credits")
            .insert({ user_id: userId, credits });
        }

        // Ensure user has partner role
        const { data: roleExists } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", "partner")
          .single();

        if (!roleExists) {
          await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: userId, role: "partner" });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
