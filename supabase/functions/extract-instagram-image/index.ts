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
          
          // Extract image from embed HTML
          // Look for the main image in the embed
          const imgPatterns = [
            /class="[^"]*EmbeddedMediaImage[^"]*"[^>]*src="([^"]+)"/,
            /<img[^>]+class="[^"]*"[^>]+src="(https:\/\/[^"]*scontent[^"]+)"/,
            /<img[^>]+src="(https:\/\/[^"]*scontent[^"]+)"[^>]*/,
            /background-image:\s*url\('?(https:\/\/[^'")]+scontent[^'")]+)'?\)/,
            /"display_url"\s*:\s*"([^"]+)"/,
            /"src"\s*:\s*"(https:\/\/[^"]*scontent[^"]+)"/,
            /img[^>]*src="(https:\/\/scontent[^"]+)"/g,
          ];
          
          for (const pattern of imgPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              imageUrl = match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&');
              console.log(`[extract-ig] Found image via pattern`);
              break;
            }
          }
          
          // Extract caption from embed
          if (!caption) {
            const captionMatch = html.match(/"caption"\s*:\s*\{[^}]*"text"\s*:\s*"([^"]{1,200})"/);
            if (captionMatch) {
              caption = captionMatch[1].replace(/\\n/g, ' ').slice(0, 120);
            }
          }

          // Also try to find ANY scontent URL in the page
          if (!imageUrl) {
            const allImgs = html.match(/https:\/\/scontent[^"'\s\\)]+\.(?:jpg|jpeg|png|webp)[^"'\s\\)]*/g);
            if (allImgs && allImgs.length > 0) {
              // Filter out tiny images
              const goodImgs = allImgs.filter(u => !u.includes('150x150') && !u.includes('44x44') && !u.includes('s150x150'));
              if (goodImgs.length > 0) {
                imageUrl = goodImgs[0].replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
                console.log(`[extract-ig] Found image via scontent scan`);
              }
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
