import { UserRole } from "@/lib/types";

/**
 * Where the seat prompt on the Binectics billing page sends each provider,
 * and what it says frees a seat. A gym archives members to free one; a
 * trainer's or dietitian's seats are their active clients, and there is no
 * archive for them on the web yet, so their way out is a bigger plan.
 */
export function seatReviewFor(role: UserRole | string | undefined): {
  href: string;
  label: string;
  advice: string;
} {
  switch (role) {
    case UserRole.TRAINER:
      return {
        href: "/dashboard/trainer/clients",
        label: "Review clients",
        advice: "Each active client takes a seat. Upgrade for more room.",
      };
    case UserRole.DIETITIAN:
      return {
        href: "/dashboard/dietitian/clients",
        label: "Review clients",
        advice: "Each active client takes a seat. Upgrade for more room.",
      };
    default:
      return {
        href: "/dashboard/gym-owner/members",
        label: "Review members",
        advice:
          "Archiving a member frees their seat. Paused and suspended members still occupy one, so review those first, or upgrade for more room.",
      };
  }
}
