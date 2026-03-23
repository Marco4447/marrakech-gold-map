import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://pyocqorzbsshawgknmpr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5b2Nxb3J6YnNzaGF3Z2tubXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDYxMTQsImV4cCI6MjA4NzgyMjExNH0.52YGLnnUSyZysyuBSVT68Pw3yj9A6l6PXQVKJRGpG9M"
);

const BASE = "https://pyocqorzbsshawgknmpr.supabase.co/storage/v1/object/public/vibes_media";

async function fix() {
  const { data: spots } = await supabase
    .from("places")
    .select("id, name, slug, image_url")
    .is("image_url", null);

  if (!spots || spots.length === 0) {
    console.log("No spots without images");
    return;
  }

  console.log(`Found ${spots.length} spots without images\n`);

  let fixed = 0;
  for (const spot of spots) {
    const photoUrl = `${BASE}/${spot.slug}/${spot.slug}-0.jpg`;
    try {
      const res = await fetch(photoUrl, { method: "HEAD" });
      if (res.ok) {
        const { error } = await supabase
          .from("places")
          .update({ image_url: photoUrl })
          .eq("id", spot.id);
        if (!error) {
          console.log(`✅ ${spot.name}`);
          fixed++;
        } else {
          console.log(`❌ ${spot.name}: ${error.message}`);
        }
      }
    } catch {}
  }

  console.log(`\n✅ Fixed ${fixed} / ${spots.length} spots`);
}

fix().catch(console.error);
