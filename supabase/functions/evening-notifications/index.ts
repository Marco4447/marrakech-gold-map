import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Find places with active checkins in the last 3 hours
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { data: activePlaces } = await admin
      .from("checkins")
      .select("place_id")
      .gte("created_at", threeHoursAgo);

    if (!activePlaces || activePlaces.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count checkins per place
    const placeCheckins: Record<string, number> = {};
    activePlaces.forEach((c: any) => {
      placeCheckins[c.place_id] = (placeCheckins[c.place_id] || 0) + 1;
    });

    // Get top 3 active places
    const topPlaces = Object.entries(placeCheckins)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id, count]) => ({ id, count }));

    // Get place names
    const placeIds = topPlaces.map((p) => p.id);
    const { data: places } = await admin
      .from("places")
      .select("id, name")
      .in("id", placeIds);

    const placeNames: Record<string, string> = {};
    places?.forEach((p: any) => {
      placeNames[p.id] = p.name;
    });

    // Get followers of these places
    const { data: followers } = await admin
      .from("place_follows")
      .select("user_id, place_id")
      .in("place_id", placeIds);

    if (!followers || followers.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduplicate users and send one notification per user
    const userNotifications: Record<string, { placeName: string; count: number }> = {};
    followers.forEach((f: any) => {
      const place = topPlaces.find((p) => p.id === f.place_id);
      if (!place) return;
      const existing = userNotifications[f.user_id];
      if (!existing || place.count > existing.count) {
        userNotifications[f.user_id] = {
          placeName: placeNames[f.place_id] || "Un lieu",
          count: place.count,
        };
      }
    });

    // Check which users already received this notification today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: alreadySent } = await admin
      .from("notifications")
      .select("user_id")
      .eq("type", "evening_nearby")
      .gte("created_at", today.toISOString());

    const sentUserIds = new Set((alreadySent || []).map((n: any) => n.user_id));

    // Insert notifications
    const notifications = Object.entries(userNotifications)
      .filter(([userId]) => !sentUserIds.has(userId))
      .map(([userId, { placeName, count }]) => ({
        user_id: userId,
        type: "evening_nearby",
        title: `🔥 ${placeName} est en feu ce soir`,
        body: `${count} personne${count > 1 ? "s" : ""} sur place — rejoins l'ambiance !`,
      }));

    if (notifications.length > 0) {
      await admin.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({ sent: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Evening notification error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
