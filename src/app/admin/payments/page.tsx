"use client";

import { minorToMajor } from "@/lib/money/minorMoney";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { paymentStatusTone } from "@/lib/ui/statusTones";
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
import {
  adminService,
  type AdminTransaction,
  type AdminPaginated,
} from "@/lib/api/admin";

const PAGE_SIZE = 25;

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "succeeded", label: "Succeeded" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "reversed", label: "Reversed" },
];

function payerLabel(tx: AdminTransaction): {
  name: string;
  email: string | null;
} {
  const u = tx.user_id;
  if (!u) return { name: "-", email: null };
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return { name: name || u.email || "-", email: u.email ?? null };
}

function formatAmount(tx: AdminTransaction): string {
  const major = minorToMajor(tx.amount_minor, tx.currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: tx.currency,
    }).format(major);
  } catch {
    return `${major.toLocaleString()} ${tx.currency}`;
  }
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<AdminPaginated<AdminTransaction> | null>(
    null,
  );
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await adminService.listTransactions({
          page,
          limit: PAGE_SIZE,
          status: status || undefined,
        });
        if (!active) return;
        if (res.success && res.data) {
          setData(res.data);
          setError(null);
        } else {
          setError(res.message || "We couldn't load the transactions.");
        }
      } catch {
        if (active)
          setError("We couldn't load the transactions. Try again shortly.");
      } finally {
        if (active) setLoading(false);
      }
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [page, status]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <AdminDashboardShell activeItem="Payments" crumb="Payments">
      <PageHeader
        className="mb-0!"
        title="Payments"
        subtitle={<span className="block max-w-[64ch]">The platform-wide money ledger, every subscription, consultation, refund and payout recorded by the transactions service, newest first.</span>}
      />

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            label={f.label}
            active={status === f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
          />
        ))}
      </div>

      {error ? (
        <div
          className="rounded-(--r-3) p-4 mt-4 text-[13px]"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid oklch(0.92 0.05 25)",
            color: "var(--danger)",
          }}
        >
          <div className="font-medium">Couldn&apos;t load transactions</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>
            {error}
          </div>
        </div>
      ) : null}

      {loading ? (
        <AsyncSpinner />
      ) : !error && data && data.items.length === 0 ? (
        <EmptySlate
          message="No transactions yet"
          hint={
            status
              ? "No transactions match this filter."
              : "Money events appear here as soon as members subscribe, book, or get refunded."
          }
        />
      ) : !error && data ? (
        <>
          <DSCard className="mt-4">
            <DSTable minWidth={860}>
              <DSTableHead>
                <DSTableTh>Date</DSTableTh>
                <DSTableTh>Payer</DSTableTh>
                <DSTableTh>Organization</DSTableTh>
                <DSTableTh>Type</DSTableTh>
                <DSTableTh>Status</DSTableTh>
                <DSTableTh>Method</DSTableTh>
                <DSTableTh align="right">Amount</DSTableTh>
              </DSTableHead>
              <tbody>
                {data.items.map((tx, i) => {
                  const payer = payerLabel(tx);
                  return (
                    <DSTableRow key={tx._id} last={i === data.items.length - 1}>
                      <DSTableTd className="whitespace-nowrap">
                        <Link
                          href={`/admin/payments/${tx._id}`}
                          className="hover:underline"
                          style={{ color: "var(--ink)" }}
                        >
                          {formatWhen(tx.occurred_at)}
                        </Link>
                      </DSTableTd>
                      <DSTableTd>
                        <div style={{ color: "var(--ink)" }}>{payer.name}</div>
                        {payer.email ? (
                          <div
                            className="text-[12px]"
                            style={{ color: "var(--fg-3)" }}
                          >
                            {payer.email}
                          </div>
                        ) : null}
                      </DSTableTd>
                      <DSTableTd>{tx.organization_id?.name ?? "-"}</DSTableTd>
                      <DSTableTd className="capitalize">
                        {tx.type.replaceAll("_", " ")}
                      </DSTableTd>
                      <DSTableTd>
                        <StatusPill
                          tone={paymentStatusTone(tx.status)}
                          label={tx.status}
                        />
                      </DSTableTd>
                      <DSTableTd className="capitalize">
                        {tx.method.replaceAll("_", " ")}
                      </DSTableTd>
                      <DSTableTd align="right" className="whitespace-nowrap">
                        <span
                          style={{
                            color:
                              tx.direction === "debit"
                                ? "var(--danger)"
                                : "var(--ink)",
                          }}
                        >
                          {tx.direction === "debit" ? "−" : ""}
                          {formatAmount(tx)}
                        </span>
                      </DSTableTd>
                    </DSTableRow>
                  );
                })}
              </tbody>
            </DSTable>
          </DSCard>

          <div className="flex items-center justify-between mt-3 text-[13px]">
            <div style={{ color: "var(--fg-3)" }}>
              {data.total} transaction{data.total === 1 ? "" : "s"}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost-v2 sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ color: "var(--fg-3)" }}>
                Page {data.page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-ghost-v2 sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}
    </AdminDashboardShell>
  );
}
