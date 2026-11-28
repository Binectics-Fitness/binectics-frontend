"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { effectiveFlag } from "@/lib/featureFlags/helpers";
import { MEMBER_SHELL_V2_FLAG } from "@/lib/member/shellV2";

const cacheKey = (userId: string) => `bx.memberShellV2.${userId}`;

function readRemembered(userId: string | null): boolean {
  if (!userId) return false;
  try {
    return window.sessionStorage.getItem(cacheKey(userId)) === "1";
  } catch {
    return false; // storage unavailable
  }
}

const noSubscribe = () => () => {};

/**
 * Does this member see the new navigation (runtime flag `member_shell_v2`,
 * default off, global value)? Off while the flags load, signed out or on
 * error, so nothing changes unless the API says on. The last answer is kept
 * for the tab (session storage, wrapped: private windows throw) so a reload
 * does not flash the old bar before the flags arrive.
 */
export function useMemberShellV2(): boolean {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { data } = useFeatureFlags();
  // false on the server and during hydration, the saved answer after.
  const remembered = useSyncExternalStore(noSubscribe, () => readRemembered(userId), () => false);

  const known = !!data;
  const live = effectiveFlag(data, MEMBER_SHELL_V2_FLAG);
  useEffect(() => {
    if (!userId || !known) return;
    try {
      window.sessionStorage.setItem(cacheKey(userId), live ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, [userId, known, live]);

  return known ? live : remembered;
}
