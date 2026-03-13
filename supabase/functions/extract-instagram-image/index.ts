const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the post shortcode from the URL
    const postMatch = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    if (!postMatch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not a valid Instagram post URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shortcode = postMatch[1];
    const cleanUrl = `https://www.instagram.com/p/${shortcode}/`;
    
    console.log(`[extract-ig] Extracting image from ${cleanUrl}...`);

    // Strategy 1: Try Firecrawl search to find the post with image
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `instagram.com/p/${shortcode}`,
        limit: 5,
      }),
    });

    let imageUrl: string | null = null;
    let caption: string | null = null;

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      const results = searchResult?.data || [];
      console.log(`[extract-ig] Search returned ${results.length} results`);

      for (const item of results) {
        // Check if this result has a thumbnail/image
        if (item.thumbnail) {
          imageUrl = item.thumbnail;
          caption = item.title || item.description || null;
          break;
        }
        // Check description for image URLs
        const desc = item.description || '';
        const title = item.title || '';
        if (title || desc) {
          caption = (title || desc).slice(0, 120);
        }
      }
    }

    // Strategy 2: Try using the Instagram embed endpoint (public, no auth needed)
    if (!imageUrl) {
      console.log('[extract-ig] Trying Instagram embed page...');
      try {
        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
        const embedRes = await fetch(embedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html',
          },
        });
        
        if (embedRes.ok) {
          const html = await embedRes.text();
          console.log(`[extract-ig] Embed page length: ${html.length}`);
          
          // Try multiple image extraction strategies on the embed HTML
          
          // 1. Look for "display_url" in JSON data
          const displayUrlMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
          if (displayUrlMatch) {
            imageUrl = displayUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
            console.log('[extract-ig] Found via display_url');
          }
          
          // 2. Look for image in "src" attributes with scontent
          if (!imageUrl) {
            const srcMatch = html.match(/src="(https:\/\/scontent[^"]+)"/);
            if (srcMatch) {
              imageUrl = srcMatch[1].replace(/&amp;/g, '&');
              console.log('[extract-ig] Found via src attr');
            }
          }
          
          // 3. Look for image in "poster" attributes (for videos)
          if (!imageUrl) {
            const posterMatch = html.match(/poster="(https:\/\/[^"]+scontent[^"]+)"/);
            if (posterMatch) {
              imageUrl = posterMatch[1].replace(/&amp;/g, '&');
              console.log('[extract-ig] Found via poster attr');
            }
          }
          
          // 4. Look for any CDN image URL pattern
          if (!imageUrl) {
            const cdnMatch = html.match(/(https:\/\/(?:scontent|instagram)[a-z0-9-]*\.(?:cdninstagram|fbcdn)\.net\/[^\s"'\\]+\.(?:jpg|jpeg|png|webp)[^\s"'\\]*)/);
            if (cdnMatch) {
              imageUrl = cdnMatch[1].replace(/&amp;/g, '&').replace(/\\u0026/g, '&');
              console.log('[extract-ig] Found via CDN pattern');
            }
          }
          
          // 5. Broad scan: find ALL image URLs and pick the largest-looking one
          if (!imageUrl) {
            const allMatches = [...html.matchAll(/(https?:\/\/[^\s"'\\>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'\\>]*)?)/g)];
            const filtered = allMatches
              .map(m => m[1].replace(/&amp;/g, '&').replace(/\\u0026/g, '&'))
              .filter(u => !u.includes('150x150') && !u.includes('44x44') && !u.includes('emoji') && !u.includes('static'));
            
            console.log(`[extract-ig] Broad scan found ${filtered.length} image URLs`);
            if (filtered.length > 0) {
              // Log first few for debugging
              console.log(`[extract-ig] Sample URLs: ${filtered.slice(0, 3).join(' | ')}`);
              imageUrl = filtered[0];
              console.log('[extract-ig] Using first broad match');
            }
          }
          
          // Extract caption
          if (!caption) {
            const captionMatch = html.match(/"caption"\s*:\s*\{[^}]*"text"\s*:\s*"([^"]{1,200})"/);
            if (captionMatch) {
              caption = captionMatch[1].replace(/\\n/g, ' ').slice(0, 120);
            }
            // Alternative caption pattern
            if (!caption) {
              const altCaption = html.match(/<div[^>]*class="[^"]*Caption[^"]*"[^>]*>([^<]{1,200})/);
              if (altCaption) caption = altCaption[1].trim().slice(0, 120);
            }
          }
        }
      } catch (embedErr) {
        console.error('[extract-ig] Embed fetch error:', embedErr);
      }
    }

    if (imageUrl) {
      console.log(`[extract-ig] Success! Image found, caption: ${caption?.slice(0, 50)}`);
      return new Response(
        JSON.stringify({ success: true, image_url: imageUrl, caption }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[extract-ig] No image found');
    return new Response(
      JSON.stringify({ success: false, error: 'Could not extract image from this post. Try saving the image to your phone and uploading it directly.' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[extract-ig] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
