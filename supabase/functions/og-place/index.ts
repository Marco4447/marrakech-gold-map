import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data: place } = await supabase
    .from("places")
    .select("name, description, category, image_url, address, rating, neighborhood")
    .eq("id", id)
    .maybeSingle();

  if (!place) {
    return new Response("Place not found", { status: 404 });
  }

  const appUrl = "https://weshkech.com";
  const redirectUrl = `${appUrl}/place/${id}`;

  const title = `${place.name} – Weshkech 🔥`;
  const description = place.description
    ? place.description.slice(0, 155)
    : `${place.category || "Spot"} à ${place.neighborhood || "Marrakech"}${place.rating ? ` · ⭐ ${place.rating}` : ""}${place.address ? ` · ${place.address}` : ""}`;

  const imageUrl = place.image_url || `${appUrl}/images/fine-mama.png`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:url" content="${escapeHtml(redirectUrl)}" />
  <meta property="og:site_name" content="Weshkech" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

  <meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl)}" />
  <link rel="canonical" href="${escapeHtml(redirectUrl)}" />
</head>
<body>
  <p>Redirection vers <a href="${escapeHtml(redirectUrl)}">${escapeHtml(place.name)} sur Weshkech</a>…</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
