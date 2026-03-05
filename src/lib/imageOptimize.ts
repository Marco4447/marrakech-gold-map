/**
 * Generates an optimized thumbnail URL using Supabase Storage image transformations.
 * Falls back to original URL if not a Supabase storage URL.
 */
export function getOptimizedImageUrl(url: string, options: { width?: number; height?: number; quality?: number } = {}): string {
  const { width = 400, quality = 75 } = options;
  
  // Only transform Supabase storage URLs
  if (!url.includes("/storage/v1/object/")) return url;
  
  // Convert /object/public/ to /render/image/public/ for transforms
  const transformUrl = url.replace("/storage/v1/object/", "/storage/v1/render/image/");
  const separator = transformUrl.includes("?") ? "&" : "?";
  return `${transformUrl}${separator}width=${width}&quality=${quality}`;
}
