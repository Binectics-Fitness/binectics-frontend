import type { Tone } from "@/lib/ui/tones";
import type {
  MyVerification,
  VerificationKind,
  VerificationReasonCode,
  VerificationStatus,
} from "@/lib/api/verification";

/**
 * A review's state as the admin pages label it. Pending is waiting on an
 * admin (warn), verified is done (success), not approved is a block until
 * the provider re-uploads (danger), and a revoked badge is settled (neutral).
 */
export const VERIFICATION_STATUS_PILL: Record<VerificationStatus, { tone: Tone; label: string }> = {
  pending: { tone: "warn", label: "Pending" },
  verified: { tone: "success", label: "Verified" },
  rejected: { tone: "danger", label: "Not approved" },
  revoked: { tone: "neutral", label: "Revoked" },
};

export const VERIFICATION_KIND_LABEL: Record<VerificationKind, "Gym" | "Trainer" | "Dietitian"> = {
  gym: "Gym",
  trainer: "Trainer",
  dietitian: "Dietitian",
};

/**
 * The reasons a reviewer picks from (the API's VerificationReasonCode), with
 * what happens next. The provider sees the label and the message.
 */
export const VERIFICATION_REASONS: { code: VerificationReasonCode; label: string; hint: string }[] = [
  { code: "documents_missing_or_expired", label: "Missing or expired documents", hint: "Provider uploads them, review comes back to the queue" },
  { code: "documents_unreadable", label: "Documents unreadable", hint: "Provider uploads a clearer copy, review comes back to the queue" },
  { code: "details_do_not_match", label: "Details don’t match the documents", hint: "Provider fixes their details or documents and re-uploads" },
  { code: "not_eligible", label: "Not eligible", hint: "Say why in the message" },
  { code: "other", label: "Other", hint: "Say what’s wrong in the message" },
];

/** The shortest message a reviewer may send (the API's MinLength). */
export const MIN_VERIFICATION_MESSAGE = 10;

/** How a document opens: inline as an image, in a PDF frame, or only as a download. */
export function documentViewKind(format: string | null): "image" | "pdf" | "file" {
  const f = (format ?? "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(f)) return "image";
  if (f === "pdf") return "pdf";
  return "file";
}

/**
 * The provider's own status line. Null when there's nothing to say yet
 * (no documents sent).
 */
export function providerVerificationCopy(
  v: Pick<MyVerification, "status" | "reason_label" | "reason"> | null | undefined,
): { tone: Tone; label: string; text: string } | null {
  if (!v || v.status === "not_submitted") return null;
  switch (v.status) {
    case "pending":
      return {
        tone: "warn",
        label: "Under review",
        text: "Our team is reviewing your documents. Members see the verified badge once they’re approved.",
      };
    case "verified":
      return { tone: "success", label: "Verified", text: "Members see the verified badge on your listing." };
    case "rejected":
    case "revoked": {
      const why = [v.reason_label, v.reason].filter(Boolean).join(": ");
      return {
        tone: "danger",
        label: v.status === "revoked" ? "Badge removed" : "Not approved",
        text: `${why || "See the email we sent you."} Upload new documents and we’ll review them again.`,
      };
    }
  }
}
