const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ScrapedPost {
  image_url: string;
  caption: string;
  post_url: string;
}

async function scrapeInstagramWithFirecrawl(handle: string, apiKey: string): Promise<ScrapedPost[]> {
  const cleanHandle = handle.replace(/^@/, '').trim();
  const url = `https://www.instagram.com/${cleanHandle}/`;

  try {
    console.log(`[Firecrawl] Scraping ${url}...`);
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'links'],
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error(`[Firecrawl] API error ${response.status}: ${errData}`);
      return [];
    }

    const result = await response.json();
    const html = result?.data?.html || result?.html || '';
    const links: string[] = result?.data?.links || result?.links || [];
    const posts: ScrapedPost[] = [];

    // Strategy 1: Extract post URLs from links
    const postLinks = links
      .filter((l: string) => /instagram\.com\/p\/[A-Za-z0-9_-]+/.test(l))
      .slice(0, 6);

    // Strategy 2: Extract image URLs from HTML
    const imgRegex = /https:\/\/(?:scontent[^"'\s]+|instagram[^"'\s]+)\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s]*)?/g;
    const foundUrls = new Set<string>();
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const imgUrl = match[0].replace(/\\u0026/g, '&');
      if (!imgUrl.includes('150x150') && !imgUrl.includes('44x44') && !imgUrl.includes('s150x150')) {
        foundUrls.add(imgUrl);
      }
    }

    // Strategy 3: Extract from og:image
    const ogImageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/);
    const ogDescMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/);

    // Strategy 4: Extract from JSON data in HTML (Instagram embeds data in scripts)
    const jsonDataRegex = /"display_url"\s*:\s*"([^"]+)"/g;
    while ((match = jsonDataRegex.exec(html)) !== null) {
      const imgUrl = match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      foundUrls.add(imgUrl);
    }

    const captionRegex = /"text"\s*:\s*"([^"]{5,120})"/g;
    const captions: string[] = [];
    while ((match = captionRegex.exec(html)) !== null) {
      captions.push(match[1].replace(/\\n/g, ' ').slice(0, 120));
    }

    const uniqueUrls = Array.from(foundUrls).slice(0, 6);
    for (let i = 0; i < uniqueUrls.length; i++) {
      posts.push({
        image_url: uniqueUrls[i],
        caption: captions[i] || (ogDescMatch ? ogDescMatch[1].slice(0, 100) : `📸 @${cleanHandle}`),
        post_url: postLinks[i] || `https://www.instagram.com/${cleanHandle}/`,
      });
    }

    // Fallback to og:image
    if (posts.length === 0 && ogImageMatch) {
      posts.push({
        image_url: ogImageMatch[1],
        caption: ogDescMatch ? ogDescMatch[1].slice(0, 100) : `📸 @${cleanHandle}`,
        post_url: url,
      });
    }

    console.log(`[Firecrawl] Found ${posts.length} posts for @${cleanHandle}`);
    return posts;
  } catch (err) {
    console.error(`[Firecrawl] Error scraping @${cleanHandle}:`, err);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get optional params
    let targetPlaceId: string | null = null;
    try {
      const body = await req.json();
      targetPlaceId = body.place_id || null;
    } catch { /* cron calls with no body */ }

    // Fetch places with instagram_handle set
    let query = supabase
      .from('places')
      .select('id, name, instagram_handle, latitude, longitude')
      .not('instagram_handle', 'is', null)
      .neq('instagram_handle', '');

    if (targetPlaceId) {
      query = query.eq('id', targetPlaceId);
    }

    const { data: places, error: placesErr } = await query;
    if (placesErr) throw placesErr;

    if (!places || places.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No places with Instagram handles found', imported: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalImported = 0;
    const results: { place: string; handle: string; imported: number; errors: string[] }[] = [];

    for (const place of places) {
      const handle = place.instagram_handle!;
      const errors: string[] = [];
      let imported = 0;

      const posts = await scrapeInstagramWithFirecrawl(handle, firecrawlKey);

      for (const post of posts) {
        // Check if already imported
        const { data: existing } = await supabase
          .from('instagram_scrape_log')
          .select('id')
          .eq('image_url', post.image_url)
          .maybeSingle();

        if (existing) continue;

        // Create an official vibe
        const { data: vibe, error: vibeErr } = await supabase
          .from('vibes')
          .insert({
            image_url: post.image_url,
            caption: post.caption ? post.caption.slice(0, 120) : `📸 @${handle}`,
            location: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            mood: 'hot',
            media_type: 'photo',
            is_official: true,
            username: place.name,
          })
          .select('id')
          .single();

        if (vibeErr) {
          errors.push(`Vibe insert failed: ${vibeErr.message}`);
          continue;
        }

        // Log the scrape
        await supabase.from('instagram_scrape_log').insert({
          place_id: place.id,
          instagram_handle: handle,
          post_url: post.post_url,
          image_url: post.image_url,
          caption: post.caption,
          vibe_id: vibe.id,
        });

        imported++;
        totalImported++;
      }

      results.push({ place: place.name, handle, imported, errors });
    }

    console.log(`Total imported: ${totalImported} vibes from ${places.length} places`);

    return new Response(
      JSON.stringify({ success: true, imported: totalImported, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
