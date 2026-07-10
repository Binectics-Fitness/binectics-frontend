import { apiClient } from "@/lib/api/client";

/**
 * Web-push (FCM) client. Configuration-optional like the backend half:
 * without NEXT_PUBLIC_FIREBASE_CONFIG + NEXT_PUBLIC_FIREBASE_VAPID_KEY
 * every entry point is a silent no-op, so environments without a Firebase
 * project keep working.
 *
 * NEXT_PUBLIC_FIREBASE_CONFIG: the JSON web-app config object from
 * Firebase console → Project settings → Your apps, as one JSON string.
 * NEXT_PUBLIC_FIREBASE_VAPID_KEY: Cloud Messaging → Web Push certificates.
 */

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
}

export function getFirebaseConfig(): FirebaseWebConfig | null {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FirebaseWebConfig;
    return parsed.apiKey && parsed.projectId && parsed.messagingSenderId
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function isPushConfigured(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    Boolean(getFirebaseConfig()) &&
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY)
  );
}

let activeToken: string | null = null;

/**
 * Requests permission if needed (must be called from a user gesture when
 * permission is still "default"), obtains the FCM token, and registers it
 * with the API. Also wires foreground messages to the given handler.
 * Returns true when push ended up active.
 */
export async function enablePush(
  onForegroundMessage: (title: string, body: string, link?: string) => void,
): Promise<boolean> {
  if (!isPushConfigured()) return false;

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return false;

  try {
    // Dynamic imports keep firebase out of every other page's bundle.
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getMessaging, getToken, onMessage } = await import(
      "firebase/messaging"
    );

    const config = getFirebaseConfig()!;
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return false;

    const res = await apiClient.post("/notifications/push-tokens", {
      token,
      platform: "web",
    });
    if (!res.success) return false;
    activeToken = token;

    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "Binectics";
      const body = payload.notification?.body ?? "";
      const link = payload.data?.link;
      onForegroundMessage(title, body, link);
    });
    return true;
  } catch {
    return false;
  }
}

/** Best-effort unregister on logout so a shared browser stops receiving
 *  the previous account's pushes immediately. */
export async function teardownPush(): Promise<void> {
  if (!activeToken) return;
  const token = activeToken;
  activeToken = null;
  try {
    await apiClient.delete("/notifications/push-tokens", { token });
  } catch {
    // Non-fatal: the server prunes dead tokens on FCM's word anyway.
  }
}
