/**
 * Detects TikTok's in-app browser and redirects to the system browser.
 * TikTok's WebView doesn't support Google OAuth popups/redirects properly.
 *
 * Detection: TikTok injects "BytedanceWebview" or "TikTok" in the UA string.
 * Redirect strategy:
 *   - iOS: use an intent-like URL via Safari's x-safari-https scheme
 *   - Android: use an Intent URL to open Chrome / default browser
 *   - Fallback: prompt the user to copy the link
 */

const TIKTOK_UA_PATTERNS = [
  /BytedanceWebview/i,
  /ByteLocale/i,
  /musical_ly/i,
  /TikTok/i,
];

export function isTikTokInAppBrowser(): boolean {
  const ua = navigator.userAgent || "";
  return TIKTOK_UA_PATTERNS.some((p) => p.test(ua));
}

export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || "";
  // Covers TikTok, Instagram, Facebook, Line, etc.
  return (
    isTikTokInAppBrowser() ||
    /FBAN|FBAV|Instagram|Line\//i.test(ua) ||
    // Generic WebView indicators
    (/wv\)/.test(ua) && /Android/.test(ua))
  );
}

/**
 * Attempts to break out of the in-app browser.
 * Returns true if a redirect was attempted.
 */
export function redirectToExternalBrowser(url?: string): boolean {
  const targetUrl = url || window.location.href;

  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (isAndroid) {
    // Android intent: opens the URL in the default browser
    const intentUrl = `intent://${targetUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;end`;
    window.location.href = intentUrl;
    return true;
  }

  if (isIOS) {
    // On iOS, try to open in Safari using the x-safari-https scheme
    // Some WebViews block this, so we also try window.open as fallback
    const safariUrl = targetUrl.replace(/^https:/, "x-safari-https:");
    window.location.href = safariUrl;

    // Fallback after a short delay if the scheme didn't work
    setTimeout(() => {
      window.open(targetUrl, "_blank");
    }, 500);
    return true;
  }

  // Generic fallback
  window.open(targetUrl, "_blank");
  return true;
}
