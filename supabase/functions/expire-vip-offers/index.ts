import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 1. Deactivate expired vip_offers (end_time passed and still active)
    const { data: expired, error: expErr } = await supabaseAdmin
      .from("vip_offers")
      .update({ is_active: false })
      .eq("is_active", true)
      .lt("end_time", new Date().toISOString())
      .not("end_time", "is", null)
      .select("place_id");

    if (expErr) throw expErr;

    const expiredCount = expired?.length ?? 0;
    console.log(`[EXPIRE-VIP] Deactivated ${expiredCount} expired offers`);

    // 2. Sync has_active_offer for affected places
    const placeIds = [...new Set((expired || []).map((o: any) => o.place_id))];

    for (const placeId of placeIds) {
      const { count } = await supabaseAdmin
        .from("vip_offers")
        .select("id", { count: "exact", head: true })
        .eq("place_id", placeId)
        .eq("is_active", true);

      await supabaseAdmin
        .from("places")
        .update({ has_active_offer: (count ?? 0) > 0 })
        .eq("id", placeId);
    }

    console.log(`[EXPIRE-VIP] Synced ${placeIds.length} places`);

    return new Response(
      JSON.stringify({ success: true, expired: expiredCount, places_synced: placeIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("[EXPIRE-VIP] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
