"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import {
  AsyncSpinner,
  EmptySlate,
  FilterPill,
  StatusPill,
  DSTable,
  DSTableHead,
  DSTableTh,
  DSTableRow,
  DSTableTd,
  PageHeader,
  DSCard,
} from "@/components/ds";
import { providerTone, toneColors } from "@/lib/ui/tones";
import {
  verificationService,
  type VerificationKind,
  type VerificationQueueItem,
  type VerificationStatus,
} from "@/lib/api/verification";
import { VERIFICATION_KIND_LABEL, VERIFICATION_STATUS_PILL } from "@/lib/verification/labels";
import { formatAdminDate } from "@/lib/admin/moderation";
import { refreshVerificationCount } from "@/components/ds/AdminDashboardShell";

type StatusFilter = VerificationStatus | "all";
type KindFilter = VerificationKind | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Not approved" },
  { value: "revoked", label: "Revoked" },
  { value: "all", label: "All" },
];

const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All providers" },
  { value: "gym", label: "Gyms" },
  { value: "trainer", label: "Trainers" },
  { value: "dietitian", label: "Dietitians" },
];

const EMPTY_HINT: Record<StatusFilter, string> = {
  pending: "Nothing waiting. Providers appear here when they upload verification documents.",
  verified: "No provider has been verified yet.",
  rejected: "No verification has been turned down.",
  revoked: "No verified badge has been revoked.",
  all: "No provider has uploaded verification documents yet.",
};

function TypePill({ kind }: { kind: VerificationKind }) {
  const label = VERIFICATION_KIND_LABEL[kind];
  const { fill, ink } = toneColors(providerTone(label));
  return (
    <span
      className="font-mono text-[9.5px] px-1.5 py-[2px] rounded-(--r-1) uppercase tracking-[0.04em]"
      style={{ background: fill, color: ink }}
    >
      {label}
    </span>
  );
}

/** The verification queue: pending oldest first, then decisions newest first. */
export function VerificationQueueClient() {
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [kind, setKind] = useState<KindFilter>("all");
  const [rows, setRows] = useState<VerificationQueueItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const res = await verificationService.list({
        status: status === "all" ? undefined : status,
        kind: kind === "all" ? undefined : kind,
      });
      if (!active) return;
      if (res.success && res.data) {
        setRows(res.data);
        setError(null);
        // The nav count follows what the queue shows.
        if (status === "pending" && kind === "all") {
          void refreshVerificationCount();
        }
      } else {
        setError(res.message || "We couldn't load the verification queue.");
      }
      setLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [status, kind]);

  return (
    <AdminDashboardShell activeItem="Verification" crumb="Verification">
      <PageHeader
        className="mb-0!"
        title="Verification"
        subtitle={
          <span className="block max-w-[64ch]">
            Gyms, trainers and dietitians who sent documents for the verified badge. Open one to check the documents, then
            approve or say what to fix.
          </span>
        }
      />

      <div className="flex items-center gap-2 mt-4 flex-wrap" role="group" aria-label="Status">
        {STATUS_FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            label={f.label}
            count={status === f.value && rows ? rows.length : undefined}
            active={status === f.value}
            onClick={() => setStatus(f.value)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 flex-wrap" role="group" aria-label="Provider type">
        {KIND_FILTERS.map((f) => (
          <FilterPill key={f.value} label={f.label} active={kind === f.value} onClick={() => setKind(f.value)} />
        ))}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-(--r-3) p-4 mt-4 text-[13px]"
          style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger-ink)" }}
        >
          <div className="font-medium">Couldn&apos;t load the queue</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>
            {error}
          </div>
        </div>
      ) : null}

      {loading ? (
        <AsyncSpinner />
      ) : !error && rows && rows.length === 0 ? (
        <EmptySlate message={status === "pending" ? "Queue clear" : "Nothing here"} hint={EMPTY_HINT[status]} />
      ) : !error && rows ? (
        <DSCard className="mt-4">
          <DSTable minWidth={760}>
            <DSTableHead>
              <DSTableTh>Provider</DSTableTh>
              <DSTableTh>Type</DSTableTh>
              <DSTableTh>Documents</DSTableTh>
              <DSTableTh>{status === "pending" ? "Sent" : status === "all" ? "Sent or decided" : "Decided"}</DSTableTh>
              <DSTableTh>Status</DSTableTh>
            </DSTableHead>
            <tbody>
              {rows.map((r, i) => {
                const pill = VERIFICATION_STATUS_PILL[r.status];
                return (
                  <DSTableRow key={`${r.subject_type}:${r.subject_id}`} last={i === rows.length - 1}>
                    <DSTableTd>
                      <Link
                        href={`/admin/verification/${r.subject_type}/${r.subject_id}`}
                        className="block no-underline"
                        style={{ color: "var(--ink)" }}
                      >
                        <span className="block text-[13.5px] font-medium">{r.name}</span>
                        <span className="block font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                          {[r.owner.name, r.owner.email].filter(Boolean).join(" · ") || "Owner unknown"}
                        </span>
                      </Link>
                    </DSTableTd>
                    <DSTableTd>
                      <TypePill kind={r.kind} />
                    </DSTableTd>
                    <DSTableTd className="text-[13px] tabular-nums">{r.document_count}</DSTableTd>
                    <DSTableTd className="whitespace-nowrap text-[12.5px]">
                      {formatAdminDate(r.status === "pending" ? r.updated_at : r.decided_at)}
                    </DSTableTd>
                    <DSTableTd>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusPill tone={pill.tone} label={pill.label} />
                        {r.resubmitted ? <StatusPill tone="neutral" dot={false} label="Re-uploaded" /> : null}
                        {r.status === "verified" && r.documents_changed ? (
                          <StatusPill tone="neutral" dot={false} label="Documents changed" />
                        ) : null}
                      </div>
                    </DSTableTd>
                  </DSTableRow>
                );
              })}
            </tbody>
          </DSTable>
        </DSCard>
      ) : null}
    </AdminDashboardShell>
  );
}
