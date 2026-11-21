"use client";

import { useState, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HEALTH_FORM_COPY as C } from "@/lib/constants/healthFormCopy";

/** Per user, in this browser (localStorage, like the push prompt's dismissal). */
export const parqNoticeKey = (userId: string) => `parq_notice_dismissed_${userId}`;

/**
 * Board parq W5: every gym starts with the PAR-Q switch off (design lead,
 * 20 Nov 2026), so a one-time notice sits above it until the user dismisses
 * it or the switch is on.
 */
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
function readDismissed(userId: string): boolean {
  if (!userId) return true;
  try {
    return localStorage.getItem(parqNoticeKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function ParqSwitchNotice({ switchOn }: { switchOn: boolean }) {
  const { user } = useAuth();
  const userId = user?.id ? String(user.id) : "";
  const [hiddenNow, setHiddenNow] = useState(false);
  // Read from localStorage; the server render counts it as dismissed, so a
  // dismissed notice never flashes.
  const stored = useSyncExternalStore(subscribe, () => readDismissed(userId), () => true);
  const dismissed = hiddenNow || stored;

  if (switchOn || dismissed || !userId) return null;
  return (
    <div
      data-testid="parq-switch-notice"
      className="flex items-start justify-between gap-3 rounded-(--r-2) px-3 py-2.5 mb-2.5 text-[13px] leading-relaxed"
      style={{ background: "var(--bg-3)", color: "var(--ink)" }}
    >
      <span>{C.switchNotice}</span>
      <button
        type="button"
        className="flex-none text-[13px]"
        style={{ color: "var(--fg-2)" }}
        onClick={() => {
          setHiddenNow(true);
          try {
            localStorage.setItem(parqNoticeKey(userId), "1");
          } catch {
            /* private mode: hidden for this visit only */
          }
          listeners.forEach((l) => l());
        }}
      >
        {C.dismiss}
      </button>
    </div>
  );
}
