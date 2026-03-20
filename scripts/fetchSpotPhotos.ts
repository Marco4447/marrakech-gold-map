/**
 * Fetch Google Places photos for all spots in Supabase
 *
 * Usage: npx tsx scripts/fetchSpotPhotos.ts
 *
 * Requires:
 * - VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env
 * - GOOGLE_PLACES_API_KEY in .env
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=["']?([^"'\n]*)["']?/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const GOOGLE_API_KEY = env.GOOGLE_PLACES_API_KEY || "AIzaSyDr2GxBwBQT5GhhvkIjGQeB99JfvZ6Isv4";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET = "spot-images";
const MAX_PHOTOS = 3;
const DELAY_MS = 500; // Rate limit: 500ms between Google API calls

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureBucket() {
  // Try using existing bucket — if it doesn't exist, use vibes_media instead
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) {
    console.log(`✅ Bucket "${BUCKET}" exists`);
  } else {
    console.log(`⚠️ Bucket "${BUCKET}" not found via API — trying to use it anyway (RLS may hide it)`);
    // Bucket exists but anon key can't list it — proceed anyway
  }
}

function getBucket() {
  return (globalThis as any).__bucket || BUCKET;
}

async function searchPlace(name: string): Promise<string | null> {
  const query = encodeURIComponent(`${name} Marrakech`);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.results?.length) {
    console.warn(`  ⚠️ No result for "${name}"`);
    return null;
  }

  return data.results[0].place_id;
}

async function getPhotoReferences(placeId: string): Promise<string[]> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${GOOGLE_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.result?.photos) {
    return [];
  }

  return data.result.photos
    .slice(0, MAX_PHOTOS)
    .map((p: any) => p.photo_reference);
}

async function downloadPhoto(photoRef: string): Promise<Buffer> {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;

  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToSupabase(slug: string, index: number, buffer: Buffer): Promise<string | null> {
  const filePath = `${slug}/${slug}-${index}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error(`  ❌ Upload failed for ${filePath}:`, error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function processSpot(spot: { id: string; name: string; slug: string; image_url: string | null }) {
  console.log(`\n📍 ${spot.name} (${spot.slug})`);

  // Skip if already has image
  if (spot.image_url) {
    console.log("  ⏭️ Already has image, skipping");
    return;
  }

  // Step 1: Search Google Places
  const placeId = await searchPlace(spot.name);
  if (!placeId) return;
  await sleep(DELAY_MS);

  // Step 2: Get photo references
  const photoRefs = await getPhotoReferences(placeId);
  if (photoRefs.length === 0) {
    console.log("  ⚠️ No photos available");
    return;
  }
  console.log(`  📸 Found ${photoRefs.length} photos`);
  await sleep(DELAY_MS);

  // Step 3-4: Download and upload each photo
  const urls: string[] = [];
  for (let i = 0; i < photoRefs.length; i++) {
    try {
      const buffer = await downloadPhoto(photoRefs[i]);
      console.log(`  ⬇️ Downloaded photo ${i + 1} (${(buffer.length / 1024).toFixed(0)} KB)`);

      const publicUrl = await uploadToSupabase(spot.slug, i, buffer);
      if (publicUrl) {
        urls.push(publicUrl);
        console.log(`  ⬆️ Uploaded → ${publicUrl.split("/").pop()}`);
      }
      await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  ❌ Error on photo ${i + 1}:`, err);
    }
  }

  // Step 5: Update spot with first image URL
  if (urls.length > 0) {
    const { error } = await supabase
      .from("places")
      .update({ image_url: urls[0] })
      .eq("id", spot.id);

    if (error) {
      console.error(`  ❌ DB update failed:`, error.message);
    } else {
      console.log(`  ✅ Updated image_url → ${urls[0].split("/").pop()}`);
    }
  }
}

async function main() {
  console.log("🚀 Spot Photos Fetcher\n");
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Google API: ${GOOGLE_API_KEY.slice(0, 10)}...`);

  await ensureBucket();

  // Fetch all spots
  const { data: spots, error } = await supabase
    .from("places")
    .select("id, name, slug, image_url")
    .order("name");

  if (error || !spots) {
    console.error("Failed to fetch spots:", error);
    process.exit(1);
  }

  console.log(`\n📊 ${spots.length} spots to process\n`);

  let processed = 0;
  let updated = 0;
  let skipped = 0;

  for (const spot of spots) {
    if (spot.image_url) {
      skipped++;
      continue;
    }
    await processSpot(spot);
    processed++;
    if (spot.image_url === null) updated++; // Will be updated by processSpot
  }

  console.log(`\n✅ Done! Processed: ${processed}, Skipped: ${skipped}`);
}

main().catch(console.error);
