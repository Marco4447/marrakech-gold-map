// TikTok Pixel helper – thin wrapper around the global ttq object
declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
      identify: (params: Record<string, unknown>) => void;
    };
  }
}

export function ttqTrack(event: string, params?: Record<string, unknown>) {
  try {
    window.ttq?.track(event, {
      ...params,
      // EMQ-required standard params
      content_type: params?.content_type || "product",
      currency: "MAD",
      value: params?.value ?? 0,
    });
  } catch {
    // silently ignore if pixel not loaded
  }
}

/** Identify user for Advanced Matching (improves EMQ) */
export function ttqIdentify(email?: string | null) {
  try {
    if (email) {
      window.ttq?.identify({ email: email.toLowerCase().trim() });
    }
  } catch {
    // silently ignore
  }
}
