// TikTok Pixel helper – thin wrapper around the global ttq object
declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
    };
  }
}

export function ttqTrack(event: string, params?: Record<string, unknown>) {
  try {
    window.ttq?.track(event, params);
  } catch {
    // silently ignore if pixel not loaded
  }
}
