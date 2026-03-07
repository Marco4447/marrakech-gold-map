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
  const placeId = url.searchParams.get("id");
  const vibeId = url.searchParams.get("vibe_id");

  if (!placeId && !vibeId) {
    return new Response("Missing id or vibe_id", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const appUrl = "https://weshkech.com";

  // ─── VIBE OG ───
  if (vibeId) {
    const { data: vibe } = await supabase
      .from("vibes")
      .select("id, caption, location, mood, image_url, media_type, likes, super_vibes, username, created_at")
      .eq("id", vibeId)
      .maybeSingle();

    if (!vibe) {
      return new Response("Vibe not found", { status: 404 });
    }

    const redirectUrl = `${appUrl}/vibe/${vibeId}`;
    const moodEmoji = vibe.mood || "";
    const title = vibe.caption
      ? `${moodEmoji} ${vibe.caption.slice(0, 50)} – Weshkech`.trim()
      : `${moodEmoji} Vibe à ${vibe.location || "Marrakech"} – Weshkech`.trim();
    const description = [
      vibe.location && `📍 ${vibe.location}`,
      vibe.username && `Par ${vibe.username}`,
      `❤️ ${vibe.likes || 0} likes · ⚡ ${vibe.super_vibes || 0} super vibes`,
    ].filter(Boolean).join(" · ");

    // For videos, use the thumbnail (image_url stores the thumbnail for videos too)
    const imageUrl = vibe.image_url || `${appUrl}/images/fine-mama.png`;

    return respondHtml({
      title,
      description,
      imageUrl,
      pageUrl: redirectUrl,
      type: vibe.media_type === "video" ? "video.other" : "article",
    });
  }

  // ─── PLACE OG ───
  const { data: place } = await supabase
    .from("places")
    .select("name, description, category, image_url, address, rating, neighborhood, vip_perk_description")
    .eq("id", placeId!)
    .maybeSingle();

  if (!place) {
    return new Response("Place not found", { status: 404 });
  }

  const redirectUrl = `${appUrl}/place/${placeId}`;
  const title = `${place.name} – Weshkech 🔥`;
  const description = place.description
    ? place.description.slice(0, 155)
    : [
        place.category || "Spot",
        `à ${place.neighborhood || "Marrakech"}`,
        place.rating && `⭐ ${place.rating}`,
        place.address,
        place.vip_perk_description && `🎁 ${place.vip_perk_description}`,
      ].filter(Boolean).join(" · ");
  const imageUrl = place.image_url || `${appUrl}/images/fine-mama.png`;

  return respondHtml({
    title,
    description,
    imageUrl,
    pageUrl: redirectUrl,
    type: "place",
  });
});

function respondHtml(opts: {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
  type: string;
}) {
  const { title, description, imageUrl, pageUrl, type } = opts;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />

  <meta property="og:type" content="${esc(type)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(imageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${esc(pageUrl)}" />
  <meta property="og:site_name" content="Weshkech" />
  <meta property="og:locale" content="fr_MA" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(imageUrl)}" />

  <meta http-equiv="refresh" content="0;url=${esc(pageUrl)}" />
  <link rel="canonical" href="${esc(pageUrl)}" />
</head>
<body>
  <p>Redirection vers <a href="${esc(pageUrl)}">${esc(title)}</a>…</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
