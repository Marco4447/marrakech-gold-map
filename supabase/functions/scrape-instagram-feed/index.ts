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

async function scrapeInstagramProfile(handle: string): Promise<ScrapedPost[]> {
  const cleanHandle = handle.replace(/^@/, '').trim();
  const url = `https://www.instagram.com/${cleanHandle}/`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.error(`Instagram returned ${response.status} for @${cleanHandle}`);
      return [];
    }

    const html = await response.text();
    const posts: ScrapedPost[] = [];

    // Strategy 1: Extract from og:image meta tag (always works for profile pic at minimum)
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
    const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/);

    // Strategy 2: Extract from window._sharedData or similar JSON blobs
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});<\/script>/);
    if (sharedDataMatch) {
      try {
        const data = JSON.parse(sharedDataMatch[1]);
        const user = data?.entry_data?.ProfilePage?.[0]?.graphql?.user;
        if (user?.edge_owner_to_timeline_media?.edges) {
          const edges = user.edge_owner_to_timeline_media.edges.slice(0, 6);
          for (const edge of edges) {
            const node = edge.node;
            posts.push({
              image_url: node.display_url || node.thumbnail_src,
              caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
              post_url: `https://www.instagram.com/p/${node.shortcode}/`,
            });
          }
        }
      } catch (e) {
        console.warn('Failed to parse _sharedData:', e);
      }
    }

    // Strategy 3: Try to find image URLs in script tags with media data
    if (posts.length === 0) {
      // Look for high-res image URLs in the page source
      const imgRegex = /https:\/\/(?:scontent[^"'\s]+|instagram[^"'\s]+)\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s]*)?/g;
      const foundUrls = new Set<string>();
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const imgUrl = match[0].replace(/\\u0026/g, '&');
        // Filter out tiny images (profile pics, icons)
        if (!imgUrl.includes('150x150') && !imgUrl.includes('44x44') && !imgUrl.includes('s150x150')) {
          foundUrls.add(imgUrl);
        }
      }

      // Take up to 6 unique image URLs
      const uniqueUrls = Array.from(foundUrls).slice(0, 6);
      for (const imgUrl of uniqueUrls) {
        posts.push({
          image_url: imgUrl,
          caption: ogDescMatch ? ogDescMatch[1].slice(0, 100) : '',
          post_url: `https://www.instagram.com/${cleanHandle}/`,
        });
      }
    }

    // Strategy 4: Fallback to og:image if nothing else found
    if (posts.length === 0 && ogImageMatch) {
      posts.push({
        image_url: ogImageMatch[1],
        caption: ogDescMatch ? ogDescMatch[1].slice(0, 100) : `Dernière photo de @${cleanHandle}`,
        post_url: url,
      });
    }

    return posts;
  } catch (err) {
    console.error(`Error scraping @${cleanHandle}:`, err);
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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get optional params (specific place_id or "all")
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

      console.log(`Scraping @${handle} for ${place.name}...`);
      const posts = await scrapeInstagramProfile(handle);
      console.log(`Found ${posts.length} posts for @${handle}`);

      for (const post of posts) {
        // Check if already imported
        const { data: existing } = await supabase
          .from('instagram_scrape_log')
          .select('id')
          .eq('post_url', post.post_url)
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
