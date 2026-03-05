import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// B2B Credit packs: priceId -> credits
const CREDIT_PACKS: Record<string, number> = {
  "price_1T6lm6J8RyilXHbfYe1I2cPh": 1,   // Pulse Pack
  "price_1T6lmfJ8RyilXHbf7enV2Cxn": 5,   // Resonance Pack
};

// B2C VIP subscription price
const VIP_PRICE_ID = "price_1T6lnGJ8RyilXHbfsZBKku0a";

// Vibe Boost prices
const BOOST_PRICES: Record<string, string> = {
  "price_1T7idcJ8RyilXHbfu8quT9F2": "24h_visibility",
  "price_1T7idxJ8RyilXHbfUmO06T3U": "discover_featured",
  "price_1T7ieRJ8RyilXHbfaY93RC1O": "map_spotlight",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId, productType, creditAmount, boostType, vibeId } = await req.json();
    if (!priceId) throw new Error("Missing priceId");
    logStep("Request received", { priceId, productType, creditAmount, boostType, vibeId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or reference existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
    logStep("Customer lookup", { customerId: customerId || "new" });

    const origin = req.headers.get("origin") || "https://marrakech-gold-map.lovable.app";

    // Determine mode and metadata based on product type
    const isVip = productType === "b2c_vip" || priceId === VIP_PRICE_ID;
    const isBoost = productType === "vibe_boost" || !!BOOST_PRICES[priceId];
    const credits = CREDIT_PACKS[priceId] || creditAmount || 0;

    const metadata: Record<string, string> = {
      user_id: user.id,
      type: isVip ? "b2c_vip" : isBoost ? "vibe_boost" : "b2b_credits",
    };
    if (isBoost) {
      metadata.boost_type = boostType || BOOST_PRICES[priceId] || "24h_visibility";
      metadata.vibe_id = vibeId || "";
    }
    if (!isVip && !isBoost) {
      metadata.credits = String(credits);
    }

    // Build rich product descriptions for Stripe Checkout
    const packNames: Record<string, string> = {
      "price_1T6lm6J8RyilXHbfYe1I2cPh": "Marrakech Gold · Pulse Pack",
      "price_1T6lmfJ8RyilXHbf7enV2Cxn": "Marrakech Gold · Resonance Pack",
    };
    const packDescriptions: Record<string, string> = {
      "price_1T6lm6J8RyilXHbfYe1I2cPh": "1 Vibe Credit — Publiez une Vibe Officielle épinglée sur la map",
      "price_1T6lmfJ8RyilXHbf7enV2Cxn": "5 Vibe Credits — Pack pro pour maximiser votre visibilité",
    };

    const lineItem: any = { price: priceId, quantity: 1 };

    // Override product name/description inline for a polished checkout
    if (!isVip && packNames[priceId]) {
      lineItem.price_data = {
        currency: "eur",
        unit_amount: priceId === "price_1T6lm6J8RyilXHbfYe1I2cPh" ? 990 : 3990,
        product_data: {
          name: packNames[priceId],
          description: packDescriptions[priceId],
        },
      };
      delete lineItem.price;
    }

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [lineItem],
      mode: isVip ? "subscription" : "payment",
      success_url: isVip
        ? `${origin}/payment-success?type=vip`
        : isBoost
          ? `${origin}/payment-success?type=boost`
          : `${origin}/payment-success?type=credits&credits=${credits}`,
      cancel_url: isVip
        ? `${origin}/payment-canceled?type=vip`
        : isBoost
          ? `${origin}/payment-canceled?type=boost`
          : `${origin}/payment-canceled?type=credits`,
      metadata,
      ...(isVip ? {} : {
        payment_intent_data: {
          description: isBoost
            ? `Weshkech · Vibe Boost (${boostType || "visibility"})`
            : (packNames[priceId] || "Marrakech Gold · Vibe Credits"),
        },
      }),
    };

    // Enable automatic invoice generation for one-time payments
    if (!isVip) {
      sessionParams.invoice_creation = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id, mode: isVip ? "subscription" : "payment" });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
