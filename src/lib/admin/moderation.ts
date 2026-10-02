import type { AdminReviewReport, AdminReviewStatus, AdminReviewView } from "@/lib/api/admin";

type PillVariant = "confirmed" | "pending" | "done" | "cancelled";

/** A review's public state, as the moderation pages label it. */
export const REVIEW_STATUS_PILL: Record<AdminReviewStatus, { variant: PillVariant; label: string }> = {
  VISIBLE: { variant: "confirmed", label: "Public" },
  HIDDEN: { variant: "cancelled", label: "Hidden" },
  REMOVED: { variant: "done", label: "Removed by author" },
};

/** A report's state, including what the admin did when it was closed. */
export function reportPill(report: AdminReviewReport): { variant: PillVariant; label: string } {
  if (report.status === "OPEN") return { variant: "pending", label: "Open" };
  if (report.resolution?.action === "hide_review" || report.status === "RESOLVED") {
    return { variant: "cancelled", label: "Review hidden" };
  }
  return { variant: "done", label: "Dismissed" };
}

/** "★★★☆☆" for a 1-5 rating; the number is always shown beside it. */
export function stars(rating: number): string {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/** What the review is about: the listing headline, else the provider. */
export function reviewSubject(review: AdminReviewView | null): string {
  if (!review) return "Review no longer exists";
  return review.listing?.headline || review.provider?.name || "Unknown provider";
}

export const ACCOUNT_ROLE_LABEL: Record<string, string> = {
  fitness_member: "Member",
  personal_trainer: "Trainer",
  dietitian: "Dietitian",
  gym_owner: "Gym owner",
};

export function roleLabel(code: string | null | undefined): string {
  if (!code) return "No role";
  return ACCOUNT_ROLE_LABEL[code] ?? code.replace(/_/g, " ");
}

export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function formatAdminDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${formatAdminDate(iso)}, ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}
