import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  "https://pyocqorzbsshawgknmpr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5b2Nxb3J6YnNzaGF3Z2tubXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDYxMTQsImV4cCI6MjA4NzgyMjExNH0.52YGLnnUSyZysyuBSVT68Pw3yj9A6l6PXQVKJRGpG9M"
);

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let inBraces = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "{" && !inQuotes) { inBraces = true; current += ch; }
    else if (ch === "}" && inBraces) { inBraces = false; current += ch; }
    else if (ch === '"' && !inBraces) { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes && !inBraces) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function parseTags(raw: string): string[] | null {
  if (!raw || raw === "") return null;
  // Format: {tag1,tag2,tag3}
  const inner = raw.replace(/^\{/, "").replace(/\}$/, "");
  if (!inner) return null;
  return inner.split(",").map(t => t.trim()).filter(Boolean);
}

function toBool(v: string): boolean {
  return v.toLowerCase() === "true";
}

function toFloat(v: string): number | null {
  if (!v || v === "") return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function toInt(v: string): number {
  if (!v || v === "") return 50;
  const n = parseInt(v);
  return isNaN(n) ? 50 : n;
}

async function importFile(filename: string) {
  const filepath = path.resolve(__dirname, "..", filename);
  console.log(`\n📄 ${filename}`);

  const content = fs.readFileSync(filepath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());
  const headers = parseCsvLine(lines[0]);

  console.log(`   ${lines.length - 1} rows, ${headers.length} columns`);

  let inserted = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < 5) continue;

    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      const v = values[idx] || "";
      switch (h) {
        case "name": row.name = v; break;
        case "slug": row.slug = v; break;
        case "description": row.description = v || null; break;
        case "category": row.category = v || null; break;
        case "neighborhood": row.neighborhood = v || null; break;
        case "address": row.address = v || null; break;
        case "latitude": row.latitude = toFloat(v); break;
        case "longitude": row.longitude = toFloat(v); break;
        case "image_url": row.image_url = v || null; break;
        case "rating": row.rating = toFloat(v); break;
        case "price_range": row.price_range = v || null; break;
        case "opening_hours": row.opening_hours = v || null; break;
        case "phone": row.phone = v || null; break;
        case "music_style": row.music_style = v || null; break;
        case "dress_code": row.dress_code = v || null; break;
        case "menu_url": row.menu_url = v || null; break;
        case "drinks_menu_url": row.drinks_menu_url = v || null; break;
        case "instagram_handle": row.instagram_handle = v || null; break;
        case "tags": row.tags = parseTags(v); break;
        case "is_partner": row.is_partner = toBool(v); break;
        case "is_premium": row.is_premium = toBool(v); break;
        case "is_founder": row.is_founder = toBool(v); break;
        case "is_outdoor": row.is_outdoor = toBool(v); break;
        case "has_active_offer": row.has_active_offer = toBool(v); break;
        case "listing_tier": row.listing_tier = v || null; break;
        case "vip_perk_description": row.vip_perk_description = v || null; break;
        case "energy_score": row.energy_score = toInt(v); break;
      }
    });

    if (!row.name || !row.slug || row.latitude == null) {
      console.log(`   ⚠️ Skip row ${i}: missing name/slug/lat`);
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from("places")
      .upsert(row, { onConflict: "slug" });

    if (error) {
      console.log(`   ❌ ${row.name}: ${error.message}`);
      skipped++;
    } else {
      console.log(`   ✅ ${row.name}`);
      inserted++;
    }
  }

  console.log(`   → ${inserted} inserted, ${skipped} skipped`);
  return inserted;
}

async function main() {
  console.log("🚀 CSV Import\n");
  let total = 0;
  for (const file of ["weshkech_cafes.csv", "weshkech_restaurants.csv", "weshkech_rooftops.csv"]) {
    total += await importFile(file);
  }
  console.log(`\n✅ Total: ${total} spots imported`);
}

main().catch(console.error);
