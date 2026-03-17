/**
 * Generates an optimized thumbnail URL using Supabase Storage image transformations.
 * Falls back to original URL if not a Supabase storage URL.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return '';
  
  // Only transform Supabase storage URLs
  if (!url.includes("/storage/v1/object/public/")) return url;
  
  // Don't transform data: or blob: URLs
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  
  const { width = 800, height, quality = 80 } = options;

  // Convert /object/public/ to /render/image/public/ for transforms
  const transformUrl = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const params = new URLSearchParams();
  params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("quality", String(quality));
  params.set("format", "webp");
  
  const separator = transformUrl.includes("?") ? "&" : "?";
  return `${transformUrl}${separator}${params.toString()}`;
}
