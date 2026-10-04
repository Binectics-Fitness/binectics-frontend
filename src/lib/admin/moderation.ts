import type { AdminReviewReport, AdminReviewStatus, AdminReviewView } from "@/lib/api/admin";
import type { Tone } from "@/lib/ui/tones";

/**
 * A review's public state, as the moderation pages label it. Hidden is a
 * moderation block (danger); removed by its own author is neutral.
 */
export const REVIEW_STATUS_PILL: Record<AdminReviewStatus, { tone: Tone; label: string }> = {
  VISIBLE: { tone: "success", label: "Public" },
  HIDDEN: { tone: "danger", label: "Hidden" },
  REMOVED: { tone: "neutral", label: "Removed by author" },
};

/**
 * A report's state, including what the admin did when it was closed. An open
 * report is waiting on an admin (warn); a closed one is settled, so it is
 * neutral either way, the label says which way it went.
 */
export function reportPill(report: AdminReviewReport): { tone: Tone; label: string } {
  if (report.status === "OPEN") return { tone: "warn", label: "Open" };
  if (report.resolution?.action === "hide_review" || report.status === "RESOLVED") {
    return { tone: "neutral", label: "Review hidden" };
  }
  return { tone: "neutral", label: "Dismissed" };
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
