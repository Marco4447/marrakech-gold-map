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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to get the authenticated user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Token manquant" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for privileged operations
    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch the invite
    const { data: invite, error: inviteError } = await admin
      .from("partner_invites")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ error: "Invitation invalide" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invite.used_by) {
      return new Response(JSON.stringify({ error: "Invitation déjà utilisée" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invitation expirée" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Assign partner role
    await admin.from("user_roles").upsert(
      { user_id: user.id, role: "partner" },
      { onConflict: "user_id,role" }
    );

    // 2. Create partner_account linking user to place
    await admin.from("partner_accounts").upsert(
      { user_id: user.id, place_id: invite.place_id, approved: true, role: "manager" },
      { onConflict: "user_id,place_id" }
    );

    // 3. Initialize partner credits
    await admin.from("partner_credits").upsert(
      { user_id: user.id, credits: 0 },
      { onConflict: "user_id" }
    );

    // 4. Set place as partner
    await admin.from("places").update({ is_partner: true }).eq("id", invite.place_id);

    // 5. Mark invite as used
    await admin.from("partner_invites").update({
      used_by: user.id,
      used_at: new Date().toISOString(),
    }).eq("id", invite.id);

    // 6. Log admin event
    await admin.from("admin_events").insert({
      event_type: "partner_onboarded",
      title: "🤝 Partenaire activé",
      body: `${invite.business_name} — via lien d'invitation`,
      metadata: { user_id: user.id, place_id: invite.place_id, invite_id: invite.id },
    });

    return new Response(
      JSON.stringify({ success: true, place_id: invite.place_id, business_name: invite.business_name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Accept invite error:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
