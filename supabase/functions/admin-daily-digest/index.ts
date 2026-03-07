import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch last 24h events
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: events } = await supabase
      .from("admin_events")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    const allEvents = events || [];
    const counts: Record<string, number> = {};
    for (const e of allEvents) {
      counts[e.event_type] = (counts[e.event_type] || 0) + 1;
    }

    const labelMap: Record<string, string> = {
      signup: "🆕 Inscriptions",
      vibe: "📸 Vibes",
      partner_request: "🤝 Demandes partenaires",
      vip_offer: "🎁 Offres VIP",
      vip_pass: "🎫 Pass générés",
      story: "📖 Stories",
    };

    const statRows = Object.entries(counts)
      .map(([type, count]) => {
        const label = labelMap[type] || type;
        return `<tr><td style="padding:8px 12px;font-size:14px;color:#e0e0e0;">${label}</td><td style="padding:8px 12px;font-size:20px;font-weight:700;color:#d4a843;text-align:right;">${count}</td></tr>`;
      })
      .join("");

    const recentItems = allEvents.slice(0, 15).map(
      (e) =>
        `<div style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#c0c0c0;">
          <span style="color:#d4a843;font-weight:600;">${e.title}</span>
          ${e.body ? `<br/><span style="color:#888;font-size:12px;">${e.body}</span>` : ""}
        </div>`
    ).join("");

    const date = new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Africa/Casablanca",
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
        subject: `📊 Digest Weshkech — ${date} (${allEvents.length} événements)`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;">
            <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;padding:32px;color:white;">
              <h1 style="margin:0 0 4px;font-size:22px;color:#d4a843;">📊 Digest quotidien</h1>
              <p style="margin:0 0 24px;color:#808090;font-size:13px;">${date} — dernières 24h</p>
              
              ${allEvents.length === 0
                ? '<p style="color:#888;font-size:14px;">Aucune activité dans les dernières 24h.</p>'
                : `
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:rgba(212,168,67,0.05);border:1px solid rgba(212,168,67,0.15);border-radius:12px;overflow:hidden;">
                  ${statRows}
                  <tr style="border-top:1px solid rgba(255,255,255,0.1);">
                    <td style="padding:10px 12px;font-size:14px;font-weight:700;color:white;">Total</td>
                    <td style="padding:10px 12px;font-size:22px;font-weight:800;color:#d4a843;text-align:right;">${allEvents.length}</td>
                  </tr>
                </table>
                
                <h3 style="color:#d4a843;font-size:14px;margin:16px 0 8px;">Dernières activités</h3>
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
                  ${recentItems}
                </div>
              `}
              
              <p style="margin:24px 0 0;text-align:center;font-size:11px;color:#555;">Weshkech Admin · Digest automatique</p>
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

    console.log(`[DIGEST] Sent daily digest: ${allEvents.length} events`);

    return new Response(JSON.stringify({ success: true, events_count: allEvents.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[DIGEST] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
