/**
 * CRON SETUP REQUIRED:
 * Run this SQL via the SQL editor to auto-resolve challenges every hour:
 *
 *   select cron.schedule('resolve-challenges', '0 * * * *', $$
 *     select net.http_post(
 *       url := current_setting('app.supabase_url') || '/functions/v1/resolve-challenge',
 *       headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
 *     )
 *   $$);
 *
 * This runs every hour to auto-resolve ended challenges.
 */

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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find active challenges that have ended
    const { data: challenges } = await supabase
      .from("weekly_challenges")
      .select("*")
      .eq("status", "active")
      .lte("end_date", new Date().toISOString());

    if (!challenges || challenges.length === 0) {
      return new Response(JSON.stringify({ message: "No challenges to resolve" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const challenge of challenges) {
      // Get vibes posted during challenge period, aggregate by user
      const { data: vibes } = await supabase
        .from("vibes")
        .select("user_id, likes, super_vibes")
        .gte("created_at", challenge.start_date)
        .lte("created_at", challenge.end_date)
        .not("user_id", "is", null);

      if (!vibes || vibes.length === 0) {
        // No participants - just close
        await supabase
          .from("weekly_challenges")
          .update({ status: "completed" })
          .eq("id", challenge.id);
        results.push({ challenge_id: challenge.id, winner: null });
        continue;
      }

      // Calculate scores
      const scores: Record<string, number> = {};
      for (const v of vibes) {
        if (!v.user_id) continue;
        scores[v.user_id] = (scores[v.user_id] || 0) + (v.likes || 0) + (v.super_vibes || 0) * 3;
      }

      // Find winner
      const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
      if (!winner) continue;

      const winnerId = winner[0];

      // Grant 7 days VIP
      await supabase
        .from("profiles")
        .update({
          is_vip: true,
          vip_expires_at: new Date(
            Math.max(Date.now(), new Date().getTime()) + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq("user_id", winnerId);

      // Mark challenge as completed with winner
      await supabase
        .from("weekly_challenges")
        .update({ status: "completed", winner_user_id: winnerId })
        .eq("id", challenge.id);

      // Send in-app notification to the winner
      await supabase.from("notifications").insert({
        user_id: winnerId,
        type: "challenge_win",
        title: `🏆 Tu as gagné le challenge "${challenge.title}" !`,
        body: "Bravo ! Tu remportes 7 jours VIP gratuits 🎉",
        vibe_id: null,
      });

      console.log(`[CHALLENGE] Winner: ${winnerId} with score ${winner[1]}`);
      results.push({ challenge_id: challenge.id, winner: winnerId, score: winner[1] });
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CHALLENGE] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
