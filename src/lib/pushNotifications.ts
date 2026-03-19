// PWA Notification Permission + Local Notifications
// Full web push requires VAPID keys + server-side — this handles permission + local fallback

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

type NotificationOptionsWithVibrate = NotificationOptions & {
  vibrate?: number[];
};

export function showLocalNotification(title: string, body: string, icon?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const options: NotificationOptionsWithVibrate = {
    body,
    icon: icon || "/images/weshkech-logo.png",
    badge: "/images/weshkech-logo.png",
    tag: `wk-${Date.now()}`,
    vibrate: [100, 50, 100],
  };

  // Use service worker notification if available (works when app is in background)
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, options);
    });
  } else {
    new Notification(title, options);
  }
}

export function getNotificationStatus(): "granted" | "denied" | "default" | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}
