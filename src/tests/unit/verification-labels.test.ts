import { describe, expect, it } from "vitest";
import {
  VERIFICATION_REASONS,
  VERIFICATION_STATUS_PILL,
  documentViewKind,
  providerVerificationCopy,
} from "@/lib/verification/labels";

describe("verification labels", () => {
  it("opens images inline, PDFs in a frame, anything else as a download", () => {
    expect(documentViewKind("jpg")).toBe("image");
    expect(documentViewKind("PNG")).toBe("image");
    expect(documentViewKind("pdf")).toBe("pdf");
    expect(documentViewKind("docx")).toBe("file");
    expect(documentViewKind(null)).toBe("file");
  });

  it("labels every status with a tone", () => {
    expect(VERIFICATION_STATUS_PILL.pending).toEqual({ tone: "warn", label: "Pending" });
    expect(VERIFICATION_STATUS_PILL.rejected.label).toBe("Not approved");
  });

  it("offers every reason code the API accepts", () => {
    expect(VERIFICATION_REASONS.map((r) => r.code)).toEqual([
      "documents_missing_or_expired",
      "documents_unreadable",
      "details_do_not_match",
      "not_eligible",
      "other",
    ]);
  });

  it("tells the provider where they stand", () => {
    expect(providerVerificationCopy(null)).toBeNull();
    expect(providerVerificationCopy({ status: "not_submitted", reason_label: null, reason: null })).toBeNull();
    expect(providerVerificationCopy({ status: "pending", reason_label: null, reason: null })?.label).toBe("Under review");
    expect(providerVerificationCopy({ status: "verified", reason_label: null, reason: null })?.label).toBe("Verified");
    const no = providerVerificationCopy({
      status: "rejected",
      reason_label: "Documents unreadable",
      reason: "The photo is blurred.",
    });
    expect(no).toMatchObject({ tone: "danger", label: "Not approved" });
    expect(no?.text).toContain("Documents unreadable: The photo is blurred.");
    expect(providerVerificationCopy({ status: "revoked", reason_label: null, reason: "Expired." })?.label).toBe("Badge removed");
  });
});
