const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "pyocqorzbsshawgknmpr";

/**
 * Returns an OG-friendly share URL that serves rich meta tags to crawlers
 * and auto-redirects humans to the SPA.
 */
export function getShareUrl(type: "place" | "vibe", id: string): string {
  const param = type === "vibe" ? "vibe_id" : "id";
  return `https://${PROJECT_ID}.supabase.co/functions/v1/og-place?${param}=${id}`;
}
