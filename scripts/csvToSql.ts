import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function esc(v: string): string {
  return v.replace(/'/g, "''");
}

function sqlVal(v: string, type: string): string {
  if (!v || v === "") return "NULL";
  if (type === "text") return `'${esc(v)}'`;
  if (type === "float") { const n = parseFloat(v); return isNaN(n) ? "NULL" : String(n); }
  if (type === "int") { const n = parseInt(v); return isNaN(n) ? "50" : String(n); }
  if (type === "bool") return v.toLowerCase() === "true" ? "true" : "false";
  if (type === "tags") {
    const inner = v.replace(/^\{/, "").replace(/\}$/, "");
    if (!inner) return "NULL";
    return `ARRAY[${inner.split(",").map(t => `'${esc(t.trim())}'`).join(",")}]`;
  }
  return `'${esc(v)}'`;
}

const COL_TYPES: Record<string, string> = {
  name: "text", slug: "text", description: "text", category: "text",
  neighborhood: "text", address: "text", latitude: "float", longitude: "float",
  image_url: "text", rating: "float", price_range: "text", opening_hours: "text",
  phone: "text", music_style: "text", dress_code: "text", menu_url: "text",
  drinks_menu_url: "text", instagram_handle: "text", tags: "tags",
  is_partner: "bool", is_premium: "bool", is_founder: "bool",
  is_outdoor: "bool", has_active_offer: "bool", listing_tier: "text",
  vip_perk_description: "text", energy_score: "int",
};

let sql = "-- Auto-generated from CSV files\n\n";

for (const file of ["weshkech_cafes.csv", "weshkech_restaurants.csv", "weshkech_rooftops.csv"]) {
  const filepath = path.resolve(__dirname, "..", file);
  const content = fs.readFileSync(filepath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());
  const headers = parseCsvLine(lines[0]);

  sql += `-- ${file}\n`;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length < 5) continue;

    const cols: string[] = [];
    const vals: string[] = [];
    headers.forEach((h, idx) => {
      const type = COL_TYPES[h];
      if (!type) return;
      cols.push(h);
      vals.push(sqlVal(values[idx] || "", type));
    });

    sql += `INSERT INTO places (${cols.join(", ")}) VALUES (${vals.join(", ")}) ON CONFLICT (slug) DO UPDATE SET ${cols.filter(c => c !== "slug").map(c => `${c} = EXCLUDED.${c}`).join(", ")};\n`;
  }
  sql += "\n";
}

const outPath = path.resolve(__dirname, "..", "supabase", "import_csv_spots.sql");
fs.writeFileSync(outPath, sql);
console.log(`✅ SQL written to supabase/import_csv_spots.sql`);
console.log(`   Paste into Supabase SQL Editor and run.`);
