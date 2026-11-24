"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DSCard, StatusPill } from "@/components/ds";
import { toast } from "@/components/Toast";
import { apiClient } from "@/lib/api/client";
import type { Organization, UpdateOrganizationRequest } from "@/lib/api/teams";
import { useUpdateOrganization } from "@/lib/queries/teams";
import { MY_VERIFICATION_KEY, useMyVerification } from "@/lib/queries/verification";
import { providerVerificationCopy } from "@/lib/verification/labels";

type DocField = "doc_registration_url" | "doc_tax_url" | "doc_owner_id_url";

const DOCUMENTS: { field: DocField; label: string; hint: string }[] = [
  { field: "doc_registration_url", label: "Business registration certificate", hint: "PDF or photo" },
  { field: "doc_tax_url", label: "Tax registration", hint: "VAT number proof if registered" },
  { field: "doc_owner_id_url", label: "Owner ID", hint: "National ID or passport" },
];

/**
 * Where the gym stands on the verified badge, and its three documents: see
 * what was sent, replace one. A new upload after "Not approved" goes back
 * to the Binectics team automatically. Owner only: the documents are the
 * owner's, as on onboarding.
 */
export function VerificationSection({ org }: { org: Organization | undefined }) {
  const queryClient = useQueryClient();
  const updateOrg = useUpdateOrganization();
  const { data: mine, isLoading } = useMyVerification(Boolean(org?._id));
  const status = mine?.find((v) => v.subject_type === "organization" && v.subject_id === org?._id);
  const copy = providerVerificationCopy(status);
  const [busy, setBusy] = useState<DocField | null>(null);
  const inputs = useRef<Partial<Record<DocField, HTMLInputElement | null>>>({});

  const upload = async (field: DocField, file: File) => {
    if (!org?._id) return;
    setBusy(field);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "gyms/verification");
      const res = await apiClient.postFormData<{ url?: string }>("/upload/document", form);
      const url = res.success ? res.data?.url : undefined;
      if (!url) throw new Error(res.message || "Upload failed");
      const data: UpdateOrganizationRequest = { [field]: url };
      const saved = await updateOrg.mutateAsync({ orgId: org._id, data });
      if (!saved.success) throw new Error(saved.message || "Couldn't save the document");
      toast.success("Document uploaded. Our team will review it.");
      await queryClient.invalidateQueries({ queryKey: MY_VERIFICATION_KEY });
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Upload failed. Try again.");
    } finally {
      setBusy(null);
      const input = inputs.current[field];
      if (input) input.value = "";
    }
  };

  const stored = (field: DocField) => {
    const v = (org as Record<string, unknown> | undefined)?.[field];
    return typeof v === "string" && v ? v : null;
  };

  return (
    <DSCard className="flex flex-col gap-4 p-5.5">
      <div className="flex flex-wrap items-start gap-3">
        {isLoading ? (
          <span className="text-[13px]" style={{ color: "var(--fg-3)" }}>Checking your verification…</span>
        ) : copy ? (
          <>
            <StatusPill tone={copy.tone} label={copy.label} />
            <p className="text-[13px] flex-1 min-w-[220px]" style={{ color: "var(--fg-2)" }}>{copy.text}</p>
          </>
        ) : (
          <>
            <StatusPill tone="neutral" label="Not sent" />
            <p className="text-[13px] flex-1 min-w-[220px]" style={{ color: "var(--fg-2)" }}>
              Upload your documents. Our team reviews them and adds the verified badge to your listing.
            </p>
          </>
        )}
      </div>
      <ul className="flex flex-col">
        {DOCUMENTS.map((d, i) => {
          const url = stored(d.field);
          return (
            <li
              key={d.field}
              className="flex flex-wrap items-center gap-3 py-3"
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-[180px]">
                <div className="text-[13.5px]" style={{ color: "var(--ink)" }}>{d.label}</div>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>{url ? "Uploaded" : d.hint}</div>
              </div>
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-[12.5px]" style={{ color: "var(--ink)", textDecoration: "underline" }}>
                  View
                </a>
              ) : null}
              <input
                ref={(el) => {
                  inputs.current[d.field] = el;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                aria-label={`Upload ${d.label}`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(d.field, file);
                }}
              />
              <button
                type="button"
                className="btn-ghost-v2 sm"
                disabled={busy !== null || !org?._id}
                onClick={() => inputs.current[d.field]?.click()}
              >
                {busy === d.field ? "Uploading…" : url ? "Replace" : "Upload"}
              </button>
            </li>
          );
        })}
      </ul>
    </DSCard>
  );
}
