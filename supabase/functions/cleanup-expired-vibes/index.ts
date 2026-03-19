import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Delete non-official vibes older than 6 hours
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    // First delete related records
    const { data: expiredVibes } = await supabaseAdmin
      .from("vibes")
      .select("id")
      .eq("is_official", false)
      .lt("created_at", cutoff);

    if (expiredVibes && expiredVibes.length > 0) {
      const ids = expiredVibes.map((v: any) => v.id);

      // Delete related likes, super_vibes, comments
      await supabaseAdmin.from("vibe_likes").delete().in("vibe_id", ids);
      await supabaseAdmin.from("vibe_super_vibes").delete().in("vibe_id", ids);
      await supabaseAdmin.from("vibe_comments").delete().in("vibe_id", ids);

      // Delete the vibes themselves
      const { error, count } = await supabaseAdmin
        .from("vibes")
        .delete()
        .eq("is_official", false)
        .lt("created_at", cutoff);

      if (error) throw error;

      console.log(`[CLEANUP] Deleted ${count ?? ids.length} expired vibes and related data`);
    } else {
      console.log("[CLEANUP] No expired vibes to clean up");
    }

    // Also clean old processed stripe events
    await supabaseAdmin.rpc("cleanup_old_stripe_events").then(() => {}, () => {});

    return new Response(
      JSON.stringify({ success: true, cleaned: expiredVibes?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CLEANUP] Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
