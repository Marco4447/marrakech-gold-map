// Edge Function: send-onboarding-email
// Trigger: INSERT on profiles table (via database webhook)
// Sends 3-email sequence: immediate, 24h, 72h

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const FROM_EMAIL = "WeshKech <noreply@weshkech.com>";
const BASE_URL = "https://weshkech.com";
const LOGO_URL = "https://weshkech.com/logo_72.png";

function layout(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1C1209;font-family:system-ui,-apple-system,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 24px">
<tr><td style="text-align:center;padding-bottom:24px"><img src="${LOGO_URL}" width="48" height="48" style="border-radius:12px" alt="WeshKech" /></td></tr>
<tr><td style="color:#F8EEE0;font-size:15px;line-height:1.6">${content}</td></tr>
<tr><td style="padding-top:32px;border-top:1px solid rgba(212,146,30,0.2);text-align:center">
<p style="color:rgba(248,238,224,0.3);font-size:11px;margin:0">WeshKech · Marrakech · <a href="${BASE_URL}" style="color:#D4921E;text-decoration:none">weshkech.com</a></p>
</td></tr></table></body></html>`;
}

function cta(text: string, url: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="text-align:center">
<a href="${url}" style="display:inline-block;background:#D4921E;color:#0E0904;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none">${text}</a>
</td></tr></table>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`Resend error: ${res.status} ${err}`);
  }
  return res.ok;
}

async function scheduleEmail(supabase: any, userId: string, email: string, delayHours: number, emailType: string) {
  // Store scheduled email in a queue table
  const sendAt = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();
  await supabase.from("email_queue").insert({
    user_id: userId,
    email,
    email_type: emailType,
    send_at: sendAt,
    status: "pending",
  });
}

serve(async (req) => {
  try {
    const { record } = await req.json();
    if (!record?.email || !record?.user_id) {
      return new Response(JSON.stringify({ error: "Missing email or user_id" }), { status: 400 });
    }

    const { email, user_id, full_name } = record;
    const name = full_name || email.split("@")[0];

    // EMAIL 1 — Immediate: Welcome
    const html1 = layout(`
      <h1 style="color:#F8EEE0;font-size:24px;font-weight:900;margin:0 0 8px;text-align:center">Marrakech comme les locaux</h1>
      <p style="text-align:center;color:rgba(248,238,224,0.6)">Salut ${name} ! 500 adresses vérifiées t'attendent. Commence par explorer la médina.</p>
      ${cta("Découvrir les spots", BASE_URL)}
      <p style="text-align:center;color:rgba(248,238,224,0.4);font-size:12px">Gratuit · Pas de pub · Par des locaux</p>
    `);
    await sendEmail(email, "Bienvenue sur WeshKech 🔥", html1);

    // Schedule EMAIL 2 (24h) and EMAIL 3 (72h)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    await scheduleEmail(supabase, user_id, email, 24, "user_spots");
    await scheduleEmail(supabase, user_id, email, 72, "user_vip_pass");

    return new Response(JSON.stringify({ success: true, email: email }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
