"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { paymentStatusTone } from "@/lib/ui/statusTones";
import { AsyncSpinner, StatusPill, DSCard, DSStatCard } from "@/components/ds";
import {
  adminService,
  type AdminLinkedTransaction,
  type AdminPersonRef,
  type AdminTransactionDetail,
} from "@/lib/api/admin";
import { formatMinor } from "@/lib/currencies/helpers";

const REFERENCE_LABEL: Record<string, string> = {
  membership_subscription: "Membership subscription",
  provider_invoice: "Platform subscription",
  consultation_booking: "Consultation booking",
  marketplace_request: "Marketplace request",
  transaction: "Transaction",
  other: "Other",
};

function humanize(v?: string | null): string {
  if (!v) return "-";
  const s = v.replaceAll("_", " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function personName(p: AdminPersonRef | string | null | undefined): string | null {
  if (!p || typeof p === "string") return null;
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
  return name || p.email || null;
}

function refName(v: { name?: string } | string | null | undefined): string | null {
  return v && typeof v === "object" ? (v.name ?? null) : null;
}

function formatWhen(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Signed display amount; debits (refunds, payouts) carry a minus. */
export function signedAmount(row: {
  amount_minor: number;
  currency: string;
  direction: "credit" | "debit";
}): string {
  return `${row.direction === "debit" ? "−" : ""}${formatMinor(row.currency, row.amount_minor)}`;
}

export function PaymentDetailClient({ paymentId }: { paymentId: string }) {
  const [detail, setDetail] = useState<AdminTransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const kick = window.setTimeout(() => {
      void (async () => {
        const res = await adminService.getTransaction(paymentId);
        if (!active) return;
        if (res.success && res.data) {
          setDetail(res.data);
          setError(null);
        } else {
          setError(res.message || "We couldn't load this transaction.");
        }
        setLoading(false);
      })();
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [paymentId]);

  const tx = detail?.transaction;
  const shortRef = tx ? (tx.gateway_reference ?? tx._id) : null;

  return (
    <AdminDashboardShell activeItem="Payments" crumb={shortRef ? `Payments · ${shortRef}` : "Payments"}>
      <div>
        <Link href="/admin/payments" className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          ← All payments
        </Link>
      </div>

      {loading ? (
        <AsyncSpinner label="Loading transaction" />
      ) : error || !detail || !tx ? (
        <div
          className="rounded-(--r-3) p-4 text-[13px]"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid oklch(0.92 0.05 25)",
            color: "var(--danger)",
          }}
        >
          <div className="font-medium">Couldn&apos;t load this transaction</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>
            {error}
          </div>
        </div>
      ) : (
        <>
          <div>
            <h1
              className="text-[28px] font-medium break-all"
              style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}
            >
              Transaction · <span className="font-mono text-[22px]">{shortRef}</span>
            </h1>
            <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
              {humanize(tx.type)} · {formatWhen(tx.occurred_at)}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Kpi label="Status">
              <StatusPill tone={paymentStatusTone(tx.status)} label={tx.status} />
            </Kpi>
            <Kpi label="Amount">
              <span style={{ color: tx.direction === "debit" ? "var(--danger)" : "var(--ink)" }}>
                {signedAmount(tx)}
              </span>
            </Kpi>
            <Kpi label="Method">{humanize(tx.method)}</Kpi>
            <Kpi label="Direction">{humanize(tx.direction)}</Kpi>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5">
            <div className="flex flex-col gap-3.5">
              <Card title="Ledger row">
                <Rows
                  rows={[
                    { label: "Transaction ID", value: tx._id, mono: true },
                    { label: "Gateway", value: humanize(tx.gateway) },
                    { label: "Payment reference", value: tx.gateway_reference ?? "-", mono: true },
                    {
                      label: "Reference",
                      value: `${REFERENCE_LABEL[tx.reference_type] ?? humanize(tx.reference_type)} · ${tx.reference_id}`,
                      mono: true,
                    },
                    { label: "Occurred", value: formatWhen(tx.occurred_at) },
                    { label: "Recorded", value: formatWhen(tx.created_at) },
                    {
                      label: "Recorded by",
                      value: personName(tx.recorded_by) ?? "None (automated)",
                    },
                    ...(typeof tx.amount_usd_minor === "number"
                      ? [{ label: "USD at the time", value: formatMinor("USD", tx.amount_usd_minor) }]
                      : []),
                    ...(tx.note ? [{ label: "Note", value: tx.note }] : []),
                  ]}
                />
                {tx.proof_url ? (
                  <a
                    href={tx.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost-v2 sm mt-3 inline-flex"
                  >
                    View proof of payment
                  </a>
                ) : null}
              </Card>

              {detail.booking ? (
                <Card title="Booking">
                  <Rows
                    rows={[
                      { label: "Booking ID", value: detail.booking._id, mono: true },
                      {
                        label: "Session",
                        value: refName(detail.booking.consultation_type_id) ?? "-",
                      },
                      { label: "Provider", value: personName(detail.booking.provider_id) ?? "-" },
                      { label: "Starts", value: formatWhen(detail.booking.starts_at) },
                      { label: "Status", value: humanize(detail.booking.status) },
                      {
                        label: "Booking price",
                        value:
                          typeof detail.booking.amount_minor === "number" && detail.booking.currency
                            ? formatMinor(detail.booking.currency, detail.booking.amount_minor)
                            : "-",
                      },
                    ]}
                  />
                </Card>
              ) : null}

              {detail.subscription ? (
                <Card title="Subscription">
                  <Rows
                    rows={[
                      { label: "Subscription ID", value: detail.subscription._id, mono: true },
                      { label: "Plan", value: refName(detail.subscription.plan_id) ?? "-" },
                      { label: "Status", value: humanize(detail.subscription.status) },
                      {
                        label: "Period",
                        value: `${formatWhen(detail.subscription.start_date)} → ${formatWhen(detail.subscription.end_date)}`,
                      },
                      {
                        label: "Paid",
                        value:
                          typeof detail.subscription.amount_paid_minor === "number" &&
                          detail.subscription.currency
                            ? formatMinor(
                                detail.subscription.currency,
                                detail.subscription.amount_paid_minor,
                              )
                            : "-",
                      },
                      {
                        label: "Auto-renew",
                        value: detail.subscription.auto_renew ? "On" : "Off",
                      },
                    ]}
                  />
                </Card>
              ) : null}
            </div>

            <div className="flex flex-col gap-3.5">
              <Card title="Payer">
                <Rows
                  rows={[
                    { label: "Name", value: personName(tx.user_id) ?? "-" },
                    { label: "Email", value: tx.user_id?.email ?? "-" },
                  ]}
                />
              </Card>

              <Card title={detail.billed_organization ? "Billed organization" : "Organization"}>
                <Rows
                  rows={[
                    {
                      label: "Name",
                      value:
                        tx.organization_id?.name ??
                        detail.billed_organization?.name ??
                        "-",
                    },
                  ]}
                />
                {detail.billed_organization ? (
                  <p className="text-[12.5px] mt-2" style={{ color: "var(--fg-3)" }}>
                    A platform subscription: this organization paid Binectics.
                  </p>
                ) : null}
              </Card>

              <Card title="Refunds">
                {detail.reverses ? (
                  <div className="mb-3 text-[13px]" style={{ color: "var(--fg-2)" }}>
                    This row reverses{" "}
                    <LinkedTx row={detail.reverses} />.
                  </div>
                ) : null}
                {detail.reversed_by.length > 0 ? (
                  <ul className="flex flex-col gap-1.5 text-[13px]">
                    {detail.reversed_by.map((r) => (
                      <li key={r._id}>
                        <LinkedTx row={r} />
                      </li>
                    ))}
                  </ul>
                ) : !detail.reverses ? (
                  <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                    No refunds recorded against this payment.
                  </div>
                ) : null}
                <p className="text-[12px] mt-3" style={{ color: "var(--fg-4)" }}>
                  Refunds can&apos;t be issued from here yet.
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </AdminDashboardShell>
  );
}

function LinkedTx({ row }: { row: AdminLinkedTransaction }) {
  return (
    <Link href={`/admin/payments/${row._id}`} className="hover:underline" style={{ color: "var(--ink)" }}>
      {humanize(row.type)} · {signedAmount(row)} · {formatWhen(row.occurred_at)}
    </Link>
  );
}

function Kpi({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DSStatCard size="sm" label={label} value={children} />
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <DSCard className="p-[22px]">
      <h3 className="text-[14px] font-medium mb-1" style={{ color: "var(--ink)" }}>
        {title}
      </h3>
      {children}
    </DSCard>
  );
}

function Rows({ rows }: { rows: { label: string; value: string; mono?: boolean }[] }) {
  return (
    <dl className="mt-2 text-[13px]">
      {rows.map((r) => (
        <div
          key={r.label}
          className="grid grid-cols-[minmax(0,140px)_1fr] gap-3 py-2.5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <dt style={{ color: "var(--fg-3)" }}>{r.label}</dt>
          <dd
            className={`min-w-0 break-all ${r.mono ? "font-mono text-[12px]" : ""}`}
            style={{ color: "var(--ink)" }}
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
