/**
 * Serves the FCM service worker with the Firebase web config injected from
 * the server environment at request time — a static file in /public can't
 * read env vars, and hardcoding the config would couple the repo to one
 * Firebase project. Must live at the root path so its scope covers "/".
 */
export function GET() {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (!raw) {
    return new Response("// push not configured", {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const body = `
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

firebase.initializeApp(${raw});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // When the payload carries a \`notification\` block the Firebase SDK has
  // already shown it (and opens its webpush link on click); showing it here
  // too made every push appear twice. Only data-only payloads are drawn here.
  if (payload.notification) return;
  const title = (payload.data && payload.data.title) || "Binectics";
  const body = (payload.data && payload.data.body) || "";
  const link = (payload.data && payload.data.link) || "/";
  self.registration.showNotification(title, {
    body,
    icon: "/favicon.ico",
    data: { link },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if ("focus" in win) {
          win.navigate(link);
          return win.focus();
        }
      }
      return clients.openWindow(link);
    }),
  );
});
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
    },
  });
}
