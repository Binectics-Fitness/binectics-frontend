import { useEffect, useRef } from "react";
import { progressService } from "@/lib/api/progress";

/**
 * After a user logs in or registers via a client invite link,
 * the invite token is stored in sessionStorage. This hook
 * automatically accepts it once the user is authenticated on
 * any dashboard page.
 */
export function useAutoAcceptInvite() {
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    if (typeof window === "undefined") return;

    const token = sessionStorage.getItem("binectics_invite_token");
    if (!token) return;

    attempted.current = true;
    sessionStorage.removeItem("binectics_invite_token");

    progressService.acceptClientInvitation({ token }).catch(() => {
      // Silent failure — token may have expired or already been used
    });
  }, []);
}
