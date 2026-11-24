"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminDashboardShell, refreshVerificationCount } from "@/components/ds/AdminDashboardShell";
import { ActionModal } from "@/components/ds/ActionModal";
import { AsyncSpinner, EmptySlate, StatusPill, DSCard } from "@/components/ds";
import { toast } from "@/components/Toast";
import {
  verificationService,
  type VerificationDetail,
  type VerificationDocument,
  type VerificationReasonCode,
  type VerificationSubjectType,
} from "@/lib/api/verification";
import {
  MIN_VERIFICATION_MESSAGE,
  VERIFICATION_KIND_LABEL,
  VERIFICATION_REASONS,
  VERIFICATION_STATUS_PILL,
  documentViewKind,
} from "@/lib/verification/labels";
import { formatAdminDate, formatAdminDateTime } from "@/lib/admin/moderation";

type Decision = "approve" | "reject" | "revoke";

const DECISION_COPY: Record<Decision, { title: string; description: string; confirm: string }> = {
  approve: {
    title: "Approve verification",
    description:
      "The verified badge goes on this provider's listings and they're told by email and in the app. A premium or featured badge stays as it is.",
    confirm: "Approve",
  },
  reject: {
    title: "Don't approve",
    description:
      "The provider gets the reason and your message by email and in the app. When they upload new documents, the review comes back to this queue.",
    confirm: "Send rejection",
  },
  revoke: {
    title: "Revoke verified badge",
    description:
      "The verified badge comes off every listing this provider has. They get the reason and your message, and can upload new documents.",
    confirm: "Revoke badge",
  },
};

const ACTION_LABEL: Record<VerificationDetail["history"][number]["action"], string> = {
  approved: "Approved",
  rejected: "Not approved",
  revoked: "Badge revoked",
};

const isSubjectType = (v: string): v is VerificationSubjectType => v === "organization" || v === "dietitian";

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <DSCard className="p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </DSCard>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-[13px]" style={{ borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--fg-3)" }}>{label}</span>
      <span className="text-right min-w-0 break-words" style={{ color: "var(--ink)" }}>
        {children}
      </span>
    </div>
  );
}

/** One document, inline: an image, a PDF in a frame, or a link to download it. */
function DocumentViewer({ doc }: { doc: VerificationDocument }) {
  if (!doc.url) {
    return (
      <div className="rounded-(--r-2) p-6 text-[13px] text-center" style={{ background: "var(--bg-2)", color: "var(--fg-2)" }}>
        {doc.unavailable_reason === "not_private"
          ? "This file is stored in an old public format, so it isn't shown here. Ask the provider to upload it again."
          : "No file uploaded for this one."}
      </div>
    );
  }
  const kind = documentViewKind(doc.format);
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-(--r-2) overflow-hidden flex items-center justify-center" style={{ background: "var(--bg-2)", minHeight: 320 }}>
        {kind === "image" ? (
          // A signed, short-lived link: next/image would cache it past expiry.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={doc.url} alt={doc.label} className="max-w-full max-h-[70vh] object-contain" />
        ) : kind === "pdf" ? (
          <object data={doc.url} type="application/pdf" className="w-full" style={{ height: "70vh" }} aria-label={doc.label}>
            <p className="p-6 text-[13px]" style={{ color: "var(--fg-2)" }}>
              Your browser can&apos;t show this PDF here. Open it in a new tab.
            </p>
          </object>
        ) : (
          <p className="p-6 text-[13px]" style={{ color: "var(--fg-2)" }}>
            This file type can&apos;t be previewed. Open it in a new tab.
          </p>
        )}
      </div>
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12.5px] self-start"
        style={{ color: "var(--ink)", textDecoration: "underline" }}
      >
        Open {doc.label} in a new tab
      </a>
    </div>
  );
}

export function VerificationDetailClient({ subjectType, subjectId }: { subjectType: string; subjectId: string }) {
  const [detail, setDetail] = useState<VerificationDetail | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState<Decision | null>(null);
  const [reason, setReason] = useState<VerificationReasonCode | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isSubjectType(subjectType)) {
      setError("This verification doesn't exist.");
      setLoading(false);
      return;
    }
    const res = await verificationService.detail(subjectType, subjectId);
    if (res.success && res.data) {
      setDetail(res.data);
      setLoadedAt(Date.now());
      setError(null);
      setSelected((cur) =>
        cur && res.data!.documents.some((d) => d.key === cur)
          ? cur
          : (res.data!.documents.find((d) => d.url) ?? res.data!.documents[0])?.key ?? null,
      );
    } else {
      setError(res.status === 404 ? "This provider doesn't exist." : res.message || "We couldn't load this review.");
    }
    setLoading(false);
  }, [subjectType, subjectId]);

  useEffect(() => {
    const kick = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(kick);
  }, [load]);

  const open = (d: Decision) => {
    setReason(null);
    setMessage("");
    setPending(d);
  };

  const needsReason = pending === "reject" || pending === "revoke";
  const trimmed = message.trim();
  const canConfirm = !saving && (!needsReason || (reason !== null && trimmed.length >= MIN_VERIFICATION_MESSAGE));

  const confirm = async () => {
    if (!pending || !detail || !canConfirm) return;
    setSaving(true);
    const type = detail.subject_type;
    const res =
      pending === "approve"
        ? await verificationService.approve(type, detail.subject_id)
        : pending === "reject"
          ? await verificationService.reject(type, detail.subject_id, { reason_code: reason!, message: trimmed })
          : await verificationService.revoke(type, detail.subject_id, { reason_code: reason!, message: trimmed });
    setSaving(false);
    if (!res.success || !res.data) {
      toast.error(res.message || "That didn't go through. Try again.");
      if (res.status === 409) await load();
      return;
    }
    toast.success(
      pending === "approve" ? "Verified. The provider has been told." : pending === "reject" ? "Rejection sent" : "Badge revoked",
    );
    setPending(null);
    setDetail(res.data);
    setLoadedAt(Date.now());
    void refreshVerificationCount();
  };

  const doc = detail?.documents.find((d) => d.key === selected) ?? null;
  const statusPill = detail ? VERIFICATION_STATUS_PILL[detail.status] : null;
  const linksExpireAt = detail ? loadedAt + detail.documents_expire_in_seconds * 1000 : 0;
  const hasViewable = detail?.documents.some((d) => d.url) ?? false;

  const actions = detail ? (
    <div className="flex flex-wrap items-center gap-2">
      {detail.status === "pending" ? (
        <button
          type="button"
          className="btn-ghost-v2"
          style={{ color: "var(--danger-ink)", borderColor: "var(--danger)" }}
          onClick={() => open("reject")}
        >
          Reject
        </button>
      ) : null}
      {detail.status === "verified" ? (
        <button
          type="button"
          className="btn-ghost-v2"
          style={{ color: "var(--danger-ink)", borderColor: "var(--danger)" }}
          onClick={() => open("revoke")}
        >
          Revoke badge
        </button>
      ) : (
        <button
          type="button"
          className="btn-primary-v2 disabled:opacity-40"
          disabled={!hasViewable}
          title={hasViewable ? undefined : "There's no document to verify yet"}
          onClick={() => open("approve")}
        >
          Approve
        </button>
      )}
    </div>
  ) : null;

  return (
    <>
      <AdminDashboardShell activeItem="Verification" crumb="Verification" actions={actions}>
        <div className="text-[13px] mb-3" style={{ color: "var(--fg-3)" }}>
          <Link href="/admin/verification" style={{ color: "var(--fg-3)" }}>
            Verification
          </Link>
          <span> / </span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{detail?.name ?? "Review"}</span>
        </div>

        {loading ? (
          <AsyncSpinner />
        ) : error || !detail ? (
          <EmptySlate message="Couldn't open this review" hint={error ?? undefined} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="text-[26px] font-medium tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                {detail.name}
              </h1>
              {statusPill ? <StatusPill tone={statusPill.tone} label={statusPill.label} /> : null}
              {detail.resubmitted ? <StatusPill tone="neutral" dot={false} label="Re-uploaded" /> : null}
            </div>
            <p className="text-[13px] mb-5" style={{ color: "var(--fg-3)" }}>
              {VERIFICATION_KIND_LABEL[detail.kind]}
              {detail.country ? ` · ${detail.country}` : ""}
              {detail.updated_at ? ` · documents updated ${formatAdminDate(detail.updated_at)}` : ""}
            </p>

            {detail.status === "verified" && detail.documents_changed ? (
              <div className="rounded-(--r-3) p-3.5 mb-4 text-[13px]" style={{ background: "var(--warn-soft)", color: "var(--ink)" }}>
                The provider changed their documents after they were verified. Check the new ones; revoke the badge if
                they don&apos;t hold up.
              </div>
            ) : null}

            {(detail.status === "rejected" || detail.status === "revoked") && detail.reason ? (
              <div className="rounded-(--r-3) p-3.5 mb-4 text-[13px]" style={{ background: "var(--bg-3)", color: "var(--ink)" }}>
                <div className="font-medium">
                  {detail.status === "revoked" ? "Revoked" : "Not approved"} {formatAdminDate(detail.decided_at)}
                  {detail.reason_label ? `: ${detail.reason_label}` : ""}
                </div>
                <div className="mt-1" style={{ color: "var(--fg-2)" }}>
                  {detail.reason}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <Card
                title="Documents"
                action={
                  <button type="button" className="btn-ghost-v2 sm" onClick={() => void load()}>
                    Refresh links
                  </button>
                }
              >
                {detail.documents.length === 0 ? (
                  <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                    No documents. There&apos;s nothing to verify until the provider uploads some.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3" role="tablist" aria-label="Documents">
                      {detail.documents.map((d) => {
                        const on = d.key === selected;
                        return (
                          <button
                            key={d.key}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            onClick={() => setSelected(d.key)}
                            className="h-8 px-3 rounded-(--r-2) text-[12.5px] flex items-center gap-1.5"
                            style={{
                              background: on ? "var(--ink)" : "transparent",
                              color: on ? "var(--bg)" : d.url ? "var(--fg-2)" : "var(--fg-4)",
                              border: on ? "1px solid var(--ink)" : "1px solid var(--border)",
                            }}
                          >
                            {d.label}
                            {d.format ? <span className="font-mono text-[10px] uppercase opacity-70">{d.format}</span> : null}
                          </button>
                        );
                      })}
                    </div>
                    {doc ? (
                      <>
                        {doc.license ? (
                          <div className="mb-3">
                            <Row label="Licence">{doc.license.name}</Row>
                            <Row label="Issued by">{doc.license.issuing_body}</Row>
                            <Row label="Number">{doc.license.number ?? "Not given"}</Row>
                            <Row label="Country">{doc.license.country_code}</Row>
                            <Row label="Expires">
                              {formatAdminDate(doc.license.expires_at)}
                              {doc.license.is_current ? "" : " (expired)"}
                            </Row>
                          </div>
                        ) : null}
                        <DocumentViewer doc={doc} />
                      </>
                    ) : null}
                    <p className="text-[11.5px] mt-3" style={{ color: "var(--fg-3)" }}>
                      Links are private and stop working{" "}
                      {new Date(linksExpireAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}.
                      Refresh links after that.
                    </p>
                  </>
                )}
              </Card>

              <div className="flex flex-col gap-4">
                <Card title="Provider">
                  {detail.owner ? (
                    <>
                      <Row label="Owner">
                        <Link href={`/admin/users/${detail.owner.id}`} style={{ color: "var(--ink)", textDecoration: "underline" }}>
                          {detail.owner.name || "Unnamed"}
                        </Link>
                      </Row>
                      <Row label="Email">{detail.owner.email ?? "-"}</Row>
                      {detail.owner.phone_number ? <Row label="Phone">{detail.owner.phone_number}</Row> : null}
                      <Row label="Joined">{formatAdminDate(detail.owner.joined_at)}</Row>
                      {detail.owner.is_suspended ? (
                        <Row label="Account">
                          <StatusPill tone="danger" label="Suspended" />
                        </Row>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                      The owner&apos;s account no longer exists.
                    </p>
                  )}
                </Card>

                <Card title="Listings">
                  {detail.listings.length === 0 ? (
                    <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                      No listing yet. The badge goes on the listings that exist when you approve.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {detail.listings.map((l) => (
                        <li key={l.id} className="flex items-center justify-between gap-2 text-[13px]">
                          <Link href={`/admin/listings/${l.id}`} className="min-w-0 truncate" style={{ color: "var(--ink)" }}>
                            {l.headline || "Untitled listing"}
                          </Link>
                          <StatusPill
                            tone={l.is_suspended ? "danger" : l.verification_badge !== "none" ? "success" : "neutral"}
                            label={l.is_suspended ? "Suspended" : l.verification_badge !== "none" ? "Badge" : "No badge"}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card title="History">
                  {detail.history.length === 0 ? (
                    <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                      No decision yet.
                    </p>
                  ) : (
                    <ol className="flex flex-col gap-3">
                      {detail.history.map((h, i) => (
                        <li key={`${h.at}-${i}`} className="text-[13px]">
                          <div style={{ color: "var(--ink)", fontWeight: 500 }}>
                            {ACTION_LABEL[h.action]}
                            {h.reason_label ? `: ${h.reason_label}` : ""}
                          </div>
                          <div className="font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                            {formatAdminDateTime(h.at)} · {h.by.name ?? "an admin"}
                          </div>
                          {h.reason ? (
                            <div className="mt-1" style={{ color: "var(--fg-2)" }}>
                              {h.reason}
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </AdminDashboardShell>

      <ActionModal
        open={pending !== null}
        onClose={() => (saving ? undefined : setPending(null))}
        title={pending ? DECISION_COPY[pending].title : ""}
        description={pending ? DECISION_COPY[pending].description : undefined}
        footer={
          <>
            <button type="button" className="btn-ghost-v2" onClick={() => setPending(null)} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary-v2 disabled:opacity-40"
              onClick={() => void confirm()}
              disabled={!canConfirm}
              style={needsReason ? { background: "var(--danger)", borderColor: "var(--danger)", color: "white" } : undefined}
            >
              {saving ? "Saving..." : pending ? DECISION_COPY[pending].confirm : ""}
            </button>
          </>
        }
      >
        {needsReason ? (
          <>
            <fieldset className="mb-4">
              <legend className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Reason</legend>
              <div className="flex flex-col gap-1.5">
                {VERIFICATION_REASONS.map((r) => (
                  <label
                    key={r.code}
                    className="flex items-start gap-2.5 rounded-(--r-2) px-3 py-2 cursor-pointer"
                    style={{ border: `1px solid ${reason === r.code ? "var(--ink)" : "var(--border)"}` }}
                  >
                    <input
                      type="radio"
                      name="verification-reason"
                      value={r.code}
                      checked={reason === r.code}
                      onChange={() => setReason(r.code)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-[13.5px]" style={{ color: "var(--ink)" }}>
                        {r.label}
                      </span>
                      <span className="block text-[12px]" style={{ color: "var(--fg-3)" }}>
                        {r.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label htmlFor="verification-message" className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              Message to the provider
            </label>
            <textarea
              id="verification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
              placeholder="What's wrong and what to upload instead. The provider reads this."
            />
            <p className="text-[11.5px] mt-1" style={{ color: "var(--fg-3)" }}>
              {trimmed.length < MIN_VERIFICATION_MESSAGE
                ? `At least ${MIN_VERIFICATION_MESSAGE} characters.`
                : `${trimmed.length} / 1000`}
            </p>
          </>
        ) : detail ? (
          <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
            {detail.listings.length === 0
              ? "This provider has no listing yet."
              : `${detail.listings.length} listing${detail.listings.length === 1 ? "" : "s"} will show the verified badge.`}
          </p>
        ) : null}
      </ActionModal>
    </>
  );
}
