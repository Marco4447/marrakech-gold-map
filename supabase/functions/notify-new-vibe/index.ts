import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "pierre.valentin82@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    const record = payload?.record;

    if (!record) {
      return new Response(JSON.stringify({ error: "No record" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("user_id", record.user_id)
      .maybeSingle();

    const userName = profile?.full_name || profile?.email || "Utilisateur inconnu";
    const userEmail = profile?.email || "N/A";
    const location = record.location || "Non spécifié";
    const mood = record.mood || "—";
    const caption = record.caption || "—";
    const mediaType = record.media_type || "photo";
    const createdAt = new Date(record.created_at).toLocaleString("fr-FR", {
      timeZone: "Africa/Casablanca",
      dateStyle: "full",
      timeStyle: "short",
    });

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Weshkech <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `📸 Nouvelle vibe de ${userName} — ${location}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; color: white;">
              <h1 style="margin: 0 0 8px; font-size: 20px; color: #d4a843;">📸 Nouvelle Vibe publiée</h1>
              <p style="margin: 0 0 24px; color: #a0a0b0; font-size: 14px;">Un utilisateur vient de poster du contenu sur Weshkech.</p>
              
              <div style="background: rgba(212, 168, 67, 0.1); border: 1px solid rgba(212, 168, 67, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                <p style="margin: 0 0 4px; font-size: 13px; color: #a0a0b0;">Utilisateur</p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: white;">${userName}</p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #a0a0b0;">${userEmail}</p>
              </div>
              
              <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                <div style="flex: 1; background: rgba(212, 168, 67, 0.1); border: 1px solid rgba(212, 168, 67, 0.2); border-radius: 12px; padding: 12px;">
                  <p style="margin: 0 0 4px; font-size: 11px; color: #a0a0b0;">Lieu</p>
                  <p style="margin: 0; font-size: 14px; font-weight: 600; color: white;">${location}</p>
                </div>
                <div style="flex: 1; background: rgba(212, 168, 67, 0.1); border: 1px solid rgba(212, 168, 67, 0.2); border-radius: 12px; padding: 12px;">
                  <p style="margin: 0 0 4px; font-size: 11px; color: #a0a0b0;">Mood</p>
                  <p style="margin: 0; font-size: 14px; font-weight: 600; color: white;">${mood}</p>
                </div>
              </div>

              <div style="background: rgba(212, 168, 67, 0.1); border: 1px solid rgba(212, 168, 67, 0.2); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
                <p style="margin: 0 0 4px; font-size: 11px; color: #a0a0b0;">Caption</p>
                <p style="margin: 0; font-size: 13px; color: white;">${caption}</p>
              </div>

              <div style="display: flex; gap: 12px;">
                <div style="flex: 1; background: rgba(212, 168, 67, 0.1); border: 1px solid rgba(212, 168, 67, 0.2); border-radius: 12px; padding: 12px;">
                  <p style="margin: 0 0 4px; font-size: 11px; color: #a0a0b0;">Type</p>
                  <p style="margin: 0; font-size: 13px; font-weight: 600; color: white;">${mediaType === "video" ? "🎥 Vidéo" : "📷 Photo"}</p>
                </div>
                <div style="flex: 1; background: rgba(212, 168, 67, 0.1); border: 1px solid rgba(212, 168, 67, 0.2); border-radius: 12px; padding: 12px;">
                  <p style="margin: 0 0 4px; font-size: 11px; color: #a0a0b0;">Date</p>
                  <p style="margin: 0; font-size: 13px; font-weight: 600; color: white;">${createdAt}</p>
                </div>
              </div>
              
              <p style="margin: 24px 0 0; text-align: center; font-size: 12px; color: #666;">Weshkech Admin · Alerte vibe automatique</p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      throw new Error(`Resend API error: ${emailRes.status}`);
    }

    console.log(`[NOTIFY] New vibe notification sent for ${userName} at ${location}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[NOTIFY] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
