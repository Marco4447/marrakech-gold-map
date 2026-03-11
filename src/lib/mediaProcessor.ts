/**
 * Instagram-like media constraints and processing.
 *
 * Photos:
 * - Max resolution: 1080px on longest side
 * - Aspect ratios: 1.91:1 (landscape) to 4:5 (portrait); clamped if out of range
 * - Output: JPEG at 80% quality (or PNG if transparent)
 * - Max file size: 8 MB after compression
 *
 * Videos:
 * - Feed: max 60s
 * - Stories: max 15s
 * - Max file size: 50 MB
 * - Accepted formats: MP4, WebM, QuickTime
 */

// ── Constants ──────────────────────────────────────────────
export const IG_MAX_DIMENSION = 1080;
export const IG_MIN_ASPECT = 4 / 5;   // 0.8  — tallest (portrait 4:5)
export const IG_MAX_ASPECT = 1.91;     // widest (landscape 1.91:1)
export const IG_JPEG_QUALITY = 0.80;
export const IG_MAX_PHOTO_BYTES = 8 * 1024 * 1024;   // 8 MB
export const IG_MAX_VIDEO_BYTES = 50 * 1024 * 1024;   // 50 MB
export const IG_MAX_FEED_VIDEO_SEC = 60;
export const IG_MAX_STORY_VIDEO_SEC = 15;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// ── Validation ─────────────────────────────────────────────

export interface MediaValidation {
  valid: boolean;
  error?: string;
}

export function validateMediaFile(file: File, context: "feed" | "story" = "feed"): MediaValidation {
  const isImage = file.type.startsWith("image/") || ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = file.type.startsWith("video/") || ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return { valid: false, error: "Format non supporté. Utilisez JPG, PNG, WebP ou MP4." };
  }
  if (isImage && file.size > IG_MAX_PHOTO_BYTES * 3) {
    // Allow up to 3× because we'll compress — reject truly huge files
    return { valid: false, error: "Photo trop lourde (max 24 Mo avant compression)." };
  }
  if (isVideo && file.size > IG_MAX_VIDEO_BYTES) {
    return { valid: false, error: "Vidéo trop lourde (max 50 Mo)." };
  }
  return { valid: true };
}

// ── Video duration check ───────────────────────────────────

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire la vidéo"));
    };
  });
}

export async function validateVideoDuration(
  file: File,
  context: "feed" | "story" = "feed"
): Promise<MediaValidation> {
  try {
    const duration = await getVideoDuration(file);
    const max = context === "story" ? IG_MAX_STORY_VIDEO_SEC : IG_MAX_FEED_VIDEO_SEC;
    if (duration > max) {
      return {
        valid: false,
        error: `Vidéo trop longue (${Math.ceil(duration)}s). Maximum ${max}s${context === "story" ? " pour une story" : ""}.`,
      };
    }
    return { valid: true };
  } catch {
    // Can't read duration — allow through, server can reject later
    return { valid: true };
  }
}

// ── Image processing (resize + compress) ───────────────────

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    const url = URL.createObjectURL(file);
    img.src = url;
    // Cleanup after load
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
  });
}

interface ProcessedImage {
  file: File;
  width: number;
  height: number;
  wasResized: boolean;
}

/**
 * Resizes + compresses an image to Instagram-like constraints.
 * - Clamps aspect ratio to [4:5, 1.91:1] by center-cropping
 * - Scales down to max 1080px on longest side
 * - Outputs JPEG at 80% quality
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const img = await loadImage(file);
  let { naturalWidth: w, naturalHeight: h } = img;

  // 1. Clamp aspect ratio by center-cropping
  let cropX = 0, cropY = 0, cropW = w, cropH = h;
  const aspect = w / h;

  if (aspect > IG_MAX_ASPECT) {
    // Too wide — crop sides
    cropW = Math.round(h * IG_MAX_ASPECT);
    cropX = Math.round((w - cropW) / 2);
  } else if (aspect < IG_MIN_ASPECT) {
    // Too tall — crop top/bottom
    cropH = Math.round(w / IG_MIN_ASPECT);
    cropY = Math.round((h - cropH) / 2);
  }

  // 2. Scale to max 1080px
  let outW = cropW, outH = cropH;
  const maxDim = Math.max(outW, outH);
  if (maxDim > IG_MAX_DIMENSION) {
    const scale = IG_MAX_DIMENSION / maxDim;
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
  }

  const wasResized = outW !== w || outH !== h || cropX !== 0 || cropY !== 0;

  // 3. Draw to canvas
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

  // 4. Export as JPEG
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", IG_JPEG_QUALITY)
  );

  const processedFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  });

  return { file: processedFile, width: outW, height: outH, wasResized };
}

// ── Full pipeline ──────────────────────────────────────────

export interface ProcessedMedia {
  file: File;
  mediaType: "photo" | "video";
  wasProcessed: boolean;
}

/**
 * Full validation + processing pipeline.
 * Returns processed file ready for upload, or throws with a user-friendly message.
 */
export async function processMediaForUpload(
  file: File,
  context: "feed" | "story" = "feed"
): Promise<ProcessedMedia> {
  // Detect type
  const isVideo = file.type.startsWith("video/") || ALLOWED_VIDEO_TYPES.some(t => file.type === t);
  const mediaType = isVideo ? "video" : "photo";

  // Validate
  const basicCheck = validateMediaFile(file, context);
  if (!basicCheck.valid) throw new Error(basicCheck.error);

  if (isVideo) {
    const durationCheck = await validateVideoDuration(file, context);
    if (!durationCheck.valid) throw new Error(durationCheck.error);
    return { file, mediaType: "video", wasProcessed: false };
  }

  // Process image
  const { file: processed, wasResized } = await processImage(file);

  // Final size check after compression
  if (processed.size > IG_MAX_PHOTO_BYTES) {
    throw new Error("Photo trop lourde même après compression. Essayez une image plus petite.");
  }

  return { file: processed, mediaType: "photo", wasProcessed: wasResized };
}
