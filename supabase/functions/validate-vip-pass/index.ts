import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Authenticate staff
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ status: "error", message: "Non authentifié" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  const { data: userData } = await supabaseClient.auth.getUser(token);
  if (!userData.user) {
    return new Response(JSON.stringify({ status: "error", message: "Non authentifié" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  // Check role (partner or admin)
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .in("role", ["partner", "admin"]);

  if (!roleData || roleData.length === 0) {
    return new Response(JSON.stringify({ status: "error", message: "Accès réservé au staff" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  try {
    const { pass_id } = await req.json();
    if (!pass_id) {
      return new Response(JSON.stringify({ status: "invalid", message: "ID du pass manquant" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch pass
    const { data: pass } = await supabaseAdmin
      .from("vip_passes")
      .select("*")
      .eq("id", pass_id)
      .single();

    if (!pass) {
      return new Response(JSON.stringify({ status: "invalid", message: "Pass introuvable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check status
    if (pass.status === "redeemed") {
      return new Response(JSON.stringify({ status: "already_used" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (new Date(pass.expires_at) < new Date()) {
      return new Response(JSON.stringify({ status: "expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch offer
    const { data: offer } = await supabaseAdmin
      .from("vip_offers")
      .select("*")
      .eq("id", pass.offer_id)
      .single();

    if (!offer || !offer.is_active) {
      return new Response(JSON.stringify({ status: "invalid", message: "Offre inactive" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check max redemptions
    if (offer.max_redemptions) {
      const { count } = await supabaseAdmin
        .from("vip_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("offer_id", offer.id);

      if ((count ?? 0) >= offer.max_redemptions) {
        return new Response(JSON.stringify({ status: "max_reached" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch place name
    const { data: place } = await supabaseAdmin
      .from("places")
      .select("name")
      .eq("id", offer.place_id)
      .single();

    // Create redemption
    await supabaseAdmin.from("vip_redemptions").insert({
      user_id: pass.user_id,
      place_id: offer.place_id,
      offer_id: offer.id,
      pass_id: pass.id,
    });

    // Mark pass as redeemed
    await supabaseAdmin
      .from("vip_passes")
      .update({ status: "redeemed" })
      .eq("id", pass_id);

    return new Response(
      JSON.stringify({
        status: "valid",
        offer_title: offer.title,
        place_name: place?.name || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur interne";
    console.error("[VALIDATE-VIP-PASS] Error:", message);
    return new Response(JSON.stringify({ status: "error", message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
