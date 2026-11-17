"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/queries/keys";
import { readIsSolo } from "@/lib/solo/state";
import { isSoloMemberEnabled } from "@/lib/solo/flag";
import { UserRole } from "@/lib/types";

/** A successful read is good for this long; page moves do not re-read seven endpoints. */
export const SOLO_STALE_MS = 60_000;

const cacheKey = (userId: string) => `bx.solo.state.${userId}`;

/**
 * The last answer for this account in this tab, so a reload opens in the
 * layout the member left (no flicker). Session storage on purpose: it is a
 * single boolean, per account, and is gone when the tab closes (nothing about
 * how someone uses the app stays on a shared computer). Always wrapped:
 * private windows and blocked storage throw.
 */
function readCached(userId: string): boolean | undefined {
  try {
    const raw = window.sessionStorage.getItem(cacheKey(userId));
    return raw === "1" ? true : raw === "0" ? false : undefined;
  } catch {
    return undefined;
  }
}

function writeCached(userId: string, solo: boolean): void {
  try {
    window.sessionStorage.setItem(cacheKey(userId), solo ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}

export interface SoloMemberState {
  /** true / false once known; null while the first answer is still coming. */
  solo: boolean | null;
  isLoading: boolean;
}

/**
 * Whether the signed-in account is a solo member (see lib/solo/rule.ts).
 *
 * - OFF (null, no requests) unless NEXT_PUBLIC_FEATURE_SOLO_MEMBER is on and
 *   the account is a plain member, so every other role and a build with the
 *   switch off behave exactly as before.
 * - No flicker: the previous answer stays while a read runs, a read that fails
 *   never changes the answer (every source must answer), and the last answer
 *   survives a reload for the tab.
 */
export function useIsSoloMember(): SoloMemberState {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const eligible = isSoloMemberEnabled() && !!userId && user?.role === UserRole.USER;
  const role = user?.role;

  const query = useQuery<boolean>({
    queryKey: queryKeys.solo.state(userId ?? "anon"),
    enabled: eligible,
    networkMode: "always",
    staleTime: SOLO_STALE_MS,
    retry: 1,
    queryFn: () => readIsSolo(role),
    // The cached answer shows at once, and is marked stale so it is re-read.
    initialData: () => (eligible && userId ? readCached(userId) : undefined),
    initialDataUpdatedAt: 0,
  });

  const data = query.data;
  useEffect(() => {
    if (userId && typeof data === "boolean") writeCached(userId, data);
  }, [userId, data]);

  if (!eligible) return { solo: null, isLoading: false };
  return { solo: typeof data === "boolean" ? data : null, isLoading: query.isLoading };
}
