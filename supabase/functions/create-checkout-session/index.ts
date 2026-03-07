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
  "price_1T6lm6J8RyilXHbfYe1I2cPh": 1,
  "price_1T6lmfJ8RyilXHbf7enV2Cxn": 5,
  "price_1T7jDDJ8RyilXHbfdeswNi24": 20,
};

// B2C VIP subscription price
const VIP_PRICE_ID = "price_1T6lnGJ8RyilXHbfsZBKku0a";

// Vibe Boost prices
const BOOST_PRICES: Record<string, string> = {
  "price_1T7idcJ8RyilXHbfu8quT9F2": "24h_visibility",
  "price_1T7idxJ8RyilXHbfUmO06T3U": "discover_featured",
  "price_1T7ieRJ8RyilXHbfaY93RC1O": "map_spotlight",
};

// Partner subscription prices
const PARTNER_SUB_PRICES: Record<string, string> = {
  "price_1T7jBpJ8RyilXHbf7rmKFQNd": "basic",
  "price_1T7jCKJ8RyilXHbfbWOr7fQS": "premium",
  "price_1T7jCjJ8RyilXHbfJ2oHd2wh": "featured",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { priceId, productType, creditAmount, boostType, vibeId, planType, placeId, amount, sponsoredTitle, sponsoredDate, boostLevel } = body;
    logStep("Request received", { priceId, productType });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) customerId = customers.data[0].id;
    logStep("Customer lookup", { customerId: customerId || "new" });

    const origin = req.headers.get("origin") || "https://weshkech.com";

    const isVip = productType === "b2c_vip" || priceId === VIP_PRICE_ID;
    const isBoost = productType === "vibe_boost" || !!BOOST_PRICES[priceId];
    const isPartnerSub = productType === "partner_subscription" || !!PARTNER_SUB_PRICES[priceId];
    const isSponsoredEvent = productType === "sponsored_event";
    const credits = CREDIT_PACKS[priceId] || creditAmount || 0;

    const metadata: Record<string, string> = { user_id: user.id };

    if (isPartnerSub) {
      metadata.type = "partner_subscription";
      metadata.plan_type = planType || PARTNER_SUB_PRICES[priceId] || "basic";
      if (placeId) metadata.place_id = placeId;
    } else if (isSponsoredEvent) {
      metadata.type = "sponsored_event";
      metadata.boost_level = boostLevel || "standard";
      metadata.sponsored_title = sponsoredTitle || "";
      metadata.sponsored_date = sponsoredDate || "";
      if (placeId) metadata.place_id = placeId;
    } else if (isVip) {
      metadata.type = "b2c_vip";
    } else if (isBoost) {
      metadata.type = "vibe_boost";
      metadata.boost_type = boostType || BOOST_PRICES[priceId] || "24h_visibility";
      metadata.vibe_id = vibeId || "";
    } else {
      metadata.type = "b2b_credits";
      metadata.credits = String(credits);
    }

    // Build line item
    const lineItem: any = { price: priceId, quantity: 1 };

    // Override for credit packs
    const packNames: Record<string, string> = {
      "price_1T6lm6J8RyilXHbfYe1I2cPh": "Marrakech Gold · Pulse Pack",
      "price_1T6lmfJ8RyilXHbf7enV2Cxn": "Marrakech Gold · Resonance Pack",
      "price_1T7jDDJ8RyilXHbfdeswNi24": "Marrakech Gold · Empire Pack",
    };
    const packDescriptions: Record<string, string> = {
      "price_1T6lm6J8RyilXHbfYe1I2cPh": "1 Vibe Credit — Publiez une Vibe Officielle épinglée sur la map",
      "price_1T6lmfJ8RyilXHbf7enV2Cxn": "5 Vibe Credits — Pack pro pour maximiser votre visibilité",
      "price_1T7jDDJ8RyilXHbfdeswNi24": "20 Vibe Credits — Pack volume pour les établissements actifs",
    };
    const packPrices: Record<string, number> = {
      "price_1T6lm6J8RyilXHbfYe1I2cPh": 990,
      "price_1T6lmfJ8RyilXHbf7enV2Cxn": 3990,
      "price_1T7jDDJ8RyilXHbfdeswNi24": 12900,
    };

    if (!isVip && !isPartnerSub && !isSponsoredEvent && packNames[priceId]) {
      lineItem.price_data = {
        currency: "eur",
        unit_amount: packPrices[priceId],
        product_data: { name: packNames[priceId], description: packDescriptions[priceId] },
      };
      delete lineItem.price;
    }

    // Sponsored event uses price_data
    if (isSponsoredEvent) {
      const boostLabels: Record<string, string> = { standard: "Standard", premium: "Premium", featured: "Featured" };
      lineItem.price_data = {
        currency: "eur",
        unit_amount: amount || 2900,
        product_data: {
          name: `Weshkech · Trending Tonight (${boostLabels[boostLevel] || "Standard"})`,
          description: `Sponsoring événement: ${sponsoredTitle || "Event"}`,
        },
      };
      delete lineItem.price;
    }

    const isSubscription = isVip || isPartnerSub;

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [lineItem],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${origin}/payment-success?type=${metadata.type}`,
      cancel_url: `${origin}/payment-canceled?type=${metadata.type}`,
      metadata,
    };

    if (isSubscription) {
      sessionParams.subscription_data = { metadata };
    } else {
      sessionParams.payment_intent_data = {
        description: isSponsoredEvent
          ? `Weshkech · Trending Tonight`
          : isBoost
            ? `Weshkech · Vibe Boost (${boostType || "visibility"})`
            : (packNames[priceId] || "Marrakech Gold · Vibe Credits"),
      };
      sessionParams.invoice_creation = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, mode: isSubscription ? "subscription" : "payment" });

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
