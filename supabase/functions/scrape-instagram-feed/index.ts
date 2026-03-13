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

async function scrapeWithFirecrawlScrape(handle: string, apiKey: string): Promise<ScrapedPost[]> {
  const cleanHandle = handle.replace(/^@/, '').trim();
  const url = `https://www.instagram.com/${cleanHandle}/`;

  try {
    console.log(`[Firecrawl] Scraping profile ${url}...`);
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'links', 'screenshot'],
        waitFor: 5000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Firecrawl] Scrape error ${response.status}: ${errText}`);
      return [];
    }

    const result = await response.json();
    const data = result?.data || result;
    const markdown = data?.markdown || '';
    const links: string[] = data?.links || [];
    const screenshot = data?.screenshot || '';
    const posts: ScrapedPost[] = [];

    console.log(`[Firecrawl] Got markdown length: ${markdown.length}, links: ${links.length}, screenshot: ${screenshot ? 'yes' : 'no'}`);

    const mdImgRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = mdImgRegex.exec(markdown)) !== null) {
      const imgUrl = match[2];
      if (imgUrl.includes('scontent') || imgUrl.includes('instagram') || imgUrl.includes('cdninstagram')) {
        posts.push({
          image_url: imgUrl,
          caption: match[1] || `📸 @${cleanHandle}`,
          post_url: url,
        });
      }
    }

    const postLinks = links.filter((l: string) => /instagram\.com\/p\/[A-Za-z0-9_-]+/.test(l));

    const imgRegex = /https:\/\/(?:scontent[^\s"')]+|cdninstagram[^\s"')]+)\.(?:jpg|jpeg|png|webp)(?:\?[^\s"')]*)?/g;
    while ((match = imgRegex.exec(markdown)) !== null) {
      const imgUrl = match[0];
      if (!imgUrl.includes('150x150') && !imgUrl.includes('44x44') && !posts.some(p => p.image_url === imgUrl)) {
        posts.push({
          image_url: imgUrl,
          caption: `📸 @${cleanHandle}`,
          post_url: postLinks.shift() || url,
        });
      }
    }

    console.log(`[Firecrawl] Extracted ${posts.length} posts from scrape`);
    return posts.slice(0, 6);
  } catch (err) {
    console.error(`[Firecrawl] scrape error for @${cleanHandle}:`, err);
    return [];
  }
}

async function scrapeWithFirecrawlSearch(handle: string, placeName: string, apiKey: string): Promise<ScrapedPost[]> {
  const cleanHandle = handle.replace(/^@/, '').trim();

  try {
    console.log(`[Firecrawl] Searching for @${cleanHandle} posts...`);
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:instagram.com ${cleanHandle} ${placeName} marrakech`,
        limit: 6,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Firecrawl] Search error ${response.status}: ${errText}`);
      return [];
    }

    const result = await response.json();
    const searchData = result?.data || [];
    const posts: ScrapedPost[] = [];

    console.log(`[Firecrawl] Search returned ${searchData.length} results`);

    for (const item of searchData) {
      const itemUrl = item.url || '';
      const itemMarkdown = item.markdown || '';

      const imgRegex = /https:\/\/(?:scontent[^\s"')]+|cdninstagram[^\s"')]+)\.(?:jpg|jpeg|png|webp)(?:\?[^\s"')]*)?/g;
      let match;
      while ((match = imgRegex.exec(itemMarkdown)) !== null) {
        const imgUrl = match[0];
        if (!imgUrl.includes('150x150') && !imgUrl.includes('44x44')) {
          posts.push({
            image_url: imgUrl,
            caption: (item.title || `📸 @${cleanHandle}`).slice(0, 120),
            post_url: itemUrl || `https://www.instagram.com/${cleanHandle}/`,
          });
          break;
        }
      }

      const mdImgRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
      while ((match = mdImgRegex.exec(itemMarkdown)) !== null) {
        if (!posts.some(p => p.image_url === match[2])) {
          posts.push({
            image_url: match[2],
            caption: (item.title || match[1] || `📸 @${cleanHandle}`).slice(0, 120),
            post_url: itemUrl || `https://www.instagram.com/${cleanHandle}/`,
          });
          break;
        }
      }
    }

    console.log(`[Firecrawl] Extracted ${posts.length} posts from search`);
    return posts.slice(0, 6);
  } catch (err) {
    console.error(`[Firecrawl] search error for @${cleanHandle}:`, err);
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

    let targetPlaceId: string | null = null;
    let createStories = false;
    let createPhotos = false;
    let updateCover = false;
    try {
      const body = await req.json();
      targetPlaceId = body.place_id || null;
      createStories = body.create_stories === true;
      createPhotos = body.create_photos === true;
      updateCover = body.update_cover === true;
    } catch { /* cron calls with no body */ }

    let query = supabase
      .from('places')
      .select('id, name, instagram_handle, latitude, longitude, image_url')
      .not('instagram_handle', 'is', null)
      .neq('instagram_handle', '');

    if (targetPlaceId) {
      query = query.eq('id', targetPlaceId);
    }

    const { data: places, error: placesErr } = await query;
    if (placesErr) throw placesErr;

    if (!places || places.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No places with Instagram handles', imported: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalImported = 0;
    let storiesCreated = 0;
    let photosCreated = 0;
    const results: { place: string; handle: string; imported: number; stories: number; photos: number; errors: string[] }[] = [];

    for (const place of places) {
      const handle = place.instagram_handle!;
      const errors: string[] = [];
      let imported = 0;
      let placeStories = 0;
      let placePhotos = 0;

      // Try scrape first, fall back to search
      let posts = await scrapeWithFirecrawlScrape(handle, firecrawlKey);
      if (posts.length === 0) {
        posts = await scrapeWithFirecrawlSearch(handle, place.name, firecrawlKey);
      }

      // Update cover image if requested and place has no cover
      if (updateCover && !place.image_url && posts.length > 0) {
        await supabase.from('places').update({ image_url: posts[0].image_url }).eq('id', place.id);
        console.log(`[scrape] Updated cover for ${place.name}`);
      }

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];

        // Deduplicate by image_url
        const { data: existing } = await supabase
          .from('instagram_scrape_log')
          .select('id')
          .eq('image_url', post.image_url)
          .maybeSingle();

        if (existing) continue;

        // Create vibe
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
          errors.push(`Vibe insert: ${vibeErr.message}`);
          continue;
        }

        // Log scrape
        await supabase.from('instagram_scrape_log').insert({
          place_id: place.id,
          instagram_handle: handle,
          post_url: post.post_url,
          image_url: post.image_url,
          caption: post.caption,
          vibe_id: vibe.id,
        });

        // Create story from first 2 images
        if (createStories && i < 2) {
          const { error: storyErr } = await supabase.from('stories').insert({
            source_type: 'admin',
            place_id: place.id,
            media_url: post.image_url,
            media_type: 'photo',
            caption: post.caption ? post.caption.slice(0, 60) : `📸 @${handle}`,
            badge: 'HOT TONIGHT',
            is_featured: i === 0,
            latitude: place.latitude,
            longitude: place.longitude,
          });
          if (storyErr) {
            errors.push(`Story insert: ${storyErr.message}`);
          } else {
            placeStories++;
            storiesCreated++;
          }
        }

        // Create place_photos
        if (createPhotos) {
          const { error: photoErr } = await supabase.from('place_photos').insert({
            place_id: place.id,
            photo_url: post.image_url,
            caption: post.caption ? post.caption.slice(0, 60) : null,
            sort_order: i,
          });
          if (photoErr) {
            errors.push(`Photo insert: ${photoErr.message}`);
          } else {
            placePhotos++;
            photosCreated++;
          }
        }

        imported++;
        totalImported++;
      }

      results.push({ place: place.name, handle, imported, stories: placeStories, photos: placePhotos, errors });
    }

    console.log(`Total imported: ${totalImported} vibes, ${storiesCreated} stories, ${photosCreated} photos from ${places.length} places`);

    return new Response(
      JSON.stringify({ success: true, imported: totalImported, stories: storiesCreated, photos: photosCreated, results }),
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
