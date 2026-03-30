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

    progressService
      .acceptClientInvitation({ token })
      .then((res) => {
        if (res.success) {
          // Only remove token after confirmed acceptance
          sessionStorage.removeItem("binectics_invite_token");
        }
        // If not successful, keep token for potential retry on next page load
      })
      .catch(() => {
        // Keep token in sessionStorage so it can be retried on next navigation
        // Reset attempted flag so next mount can retry
        attempted.current = false;
      });
  }, []);
}
