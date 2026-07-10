"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/Toast";
import { enablePush, isPushConfigured } from "@/lib/push/push";

const DISMISS_KEY = "push_prompt_dismissed_at";
const DISMISS_DAYS = 7;

/**
 * Mounts globally; does nothing unless (a) push is configured, (b) a user
 * is signed in, and (c) they're inside the app shell. When permission is
 * already granted the token syncs silently; when it's still "default" a
 * small dismissible banner asks first — browsers require the permission
 * prompt to come from a user gesture, and unsolicited prompts get blocked.
 */
export function PushRegistrar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);

  const inApp =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  const onForeground = (title: string, body: string, link?: string) => {
    toast.info(
      `${title} — ${body}`,
      link ? { label: "View", onClick: () => router.push(link) } : undefined,
    );
  };

  useEffect(() => {
    // Deferred a tick: keeps setState out of the synchronous effect body
    // (project lint rule) and lets Notification/localStorage reads happen
    // safely post-hydration.
    const id = setTimeout(() => {
      if (!user || !inApp || !isPushConfigured()) {
        setShowBanner(false);
        return;
      }
      if (Notification.permission === "granted") {
        void enablePush(onForeground);
        setShowBanner(false);
        return;
      }
      if (Notification.permission === "denied") return;

      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (Date.now() - dismissedAt < DISMISS_DAYS * 86400_000) return;
      setShowBanner(true);
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, inApp]);

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-(--r-3) border border-border bg-bg p-4"
      style={{ boxShadow: "var(--shadow-2, 0 8px 30px rgba(0,0,0,0.12))" }}
    >
      <div className="text-sm font-semibold text-ink">Turn on notifications?</div>
      <p className="mt-1 text-[13px] leading-normal text-fg-2">
        Get check-in confirmations and important account updates as they
        happen.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded-(--r-2) px-4 py-2 text-[13px] font-semibold"
          style={{ background: "var(--ink)", color: "var(--bg)" }}
          onClick={() => {
            setShowBanner(false);
            void enablePush(onForeground).then((ok) => {
              if (ok) toast.success("Notifications on.");
            });
          }}
        >
          Enable
        </button>
        <button
          type="button"
          className="rounded-(--r-2) border border-border px-4 py-2 text-[13px] font-medium text-fg-2"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
            setShowBanner(false);
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
