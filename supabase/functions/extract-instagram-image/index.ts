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

    const postMatch = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    if (!postMatch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not a valid Instagram post URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shortcode = postMatch[1];
    console.log(`[extract-ig] Extracting from shortcode: ${shortcode}`);

    let imageUrl: string | null = null;
    let caption: string | null = null;

    // Strategy 1: Use Firecrawl search for cached Google thumbnails
    try {
      console.log('[extract-ig] Strategy 1: Firecrawl search...');
      const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `instagram.com/p/${shortcode}`,
          limit: 5,
          scrapeOptions: { formats: ['markdown'] },
        }),
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const results = searchData?.data || [];
        console.log(`[extract-ig] Search returned ${results.length} results`);

        for (const item of results) {
          // Check thumbnail field
          if (item.thumbnail) {
            imageUrl = item.thumbnail;
            caption = item.title || '';
            console.log('[extract-ig] Found thumbnail in search result');
            break;
          }

          // Check markdown content for images
          const md = item.markdown || '';
          const mdImgMatch = md.match(/!\[[^\]]*\]\((https?:\/\/[^)]+\.(?:jpg|jpeg|png|webp)[^)]*)\)/);
          if (mdImgMatch) {
            imageUrl = mdImgMatch[1];
            caption = item.title || '';
            console.log('[extract-ig] Found image in markdown');
            break;
          }

          // Check for any image URL in the content
          const imgMatch = md.match(/(https?:\/\/[^\s"'()]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'()]*)?)/);
          if (imgMatch) {
            imageUrl = imgMatch[1];
            caption = item.title || '';
            console.log('[extract-ig] Found image URL in content');
            break;
          }
        }
      }
    } catch (e) {
      console.error('[extract-ig] Search error:', e);
    }

    // Strategy 2: Try scraping a Google cached/image search result
    if (!imageUrl) {
      try {
        console.log('[extract-ig] Strategy 2: Google Images search...');
        const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `"${shortcode}" site:instagram.com`,
            limit: 3,
          }),
        });

        if (searchRes.ok) {
          const data = await searchRes.json();
          const results = data?.data || [];
          console.log(`[extract-ig] Google search returned ${results.length} results`);

          for (const item of results) {
            if (item.thumbnail) {
              imageUrl = item.thumbnail;
              caption = item.title || '';
              console.log('[extract-ig] Found thumbnail via Google');
              break;
            }
          }
        }
      } catch (e) {
        console.error('[extract-ig] Google search error:', e);
      }
    }

    // Strategy 3: Try the Instagram embed API (returns JSON with thumbnail)
    if (!imageUrl) {
      try {
        console.log('[extract-ig] Strategy 3: Instagram oEmbed API...');
        const oembedRes = await fetch(
          `https://graph.facebook.com/v18.0/instagram_oembed?url=https://www.instagram.com/p/${shortcode}/&omit_script=true&fields=thumbnail_url,author_name,title`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData.thumbnail_url) {
            imageUrl = oembedData.thumbnail_url;
            caption = oembedData.title || oembedData.author_name || '';
            console.log('[extract-ig] Found via oEmbed API');
          }
        } else {
          console.log(`[extract-ig] oEmbed returned ${oembedRes.status}`);
        }
      } catch (e) {
        console.error('[extract-ig] oEmbed error:', e);
      }
    }

    // Strategy 4: Use a public embed proxy
    if (!imageUrl) {
      try {
        console.log('[extract-ig] Strategy 4: embed proxy...');
        const proxyRes = await fetch(`https://api.instagram.com/oembed/?url=https://www.instagram.com/p/${shortcode}/`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (proxyRes.ok) {
          const proxyData = await proxyRes.json();
          if (proxyData.thumbnail_url) {
            imageUrl = proxyData.thumbnail_url;
            caption = proxyData.title || proxyData.author_name || '';
            console.log('[extract-ig] Found via api.instagram.com/oembed');
          }
        } else {
          console.log(`[extract-ig] oembed proxy returned ${proxyRes.status}`);
        }
      } catch (e) {
        console.error('[extract-ig] Proxy error:', e);
      }
    }

    if (imageUrl) {
      console.log(`[extract-ig] ✅ Success! Image: ${imageUrl.slice(0, 80)}...`);
      return new Response(
        JSON.stringify({ success: true, image_url: imageUrl, caption: caption?.slice(0, 120) || '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[extract-ig] ❌ All strategies failed');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Impossible d\'extraire l\'image automatiquement. Astuce : ouvre le post Instagram dans ton navigateur, maintiens appuyé sur l\'image → "Enregistrer l\'image", puis uploade-la avec le bouton Fichiers.' 
      }),
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
