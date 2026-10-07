"use client";

import { formatPercent } from "@/lib/admin/percent";
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
  DSStatCard,
  Eyebrow,
} from "@/components/ds";
import {
  adminService,
  type AdminPaginated,
  type AdminUserListItem,
  type PlatformMetricsOverview,
} from "@/lib/api/admin";
import { revenueHeadline, revenueRows } from "@/lib/admin/revenue";
import { formatAdminDate, roleLabel } from "@/lib/admin/moderation";

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

const ROLE_FILTERS = [
  { value: "", label: "All" },
  { value: "fitness_member", label: "Members" },
  { value: "personal_trainer", label: "Trainers" },
  { value: "dietitian", label: "Dietitians" },
  { value: "gym_owner", label: "Gym owners" },
];

function initials(u: AdminUserListItem): string {
  const s = `${u.first_name.charAt(0)}${u.last_name.charAt(0)}`.toUpperCase();
  return s || u.email.charAt(0).toUpperCase() || "?";
}

export default function AdminUsersPage() {
  const [metrics, setMetrics] = useState<PlatformMetricsOverview | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminPaginated<AdminUserListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await adminService.getPlatformMetrics();
      if (!active) return;
      if (res.success) setMetrics(res.data ?? null);
      setMetricsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const res = await adminService.listUsers({
        q: debounced || undefined,
        role: role || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (!active) return;
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.message || "We couldn't load users.");
      }
      setLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [debounced, role, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const kpis = [
    {
      label: "Total users",
      value: metricsLoading ? "-" : (metrics?.conversion.totalUsers.toLocaleString() ?? "-"),
      delta: "excludes suspended accounts",
    },
    {
      label: "Paying users",
      value: metricsLoading ? "-" : (metrics?.conversion.payingUsers.toLocaleString() ?? "-"),
      delta:
        metrics?.conversion.conversionRate != null
          ? `${formatPercent(metrics.conversion.conversionRate)} conversion`
          : "-",
    },
    {
      label: "Verified providers",
      value: metricsLoading ? "-" : (metrics?.verifiedProviders.total.toLocaleString() ?? "-"),
      delta: `${metrics?.verifiedProviders.distinctCountries ?? 0} countries`,
    },
    {
      label: "Active subscriptions",
      value: metricsLoading ? "-" : (metrics?.subscriptions.activeCount.toLocaleString() ?? "-"),
      delta: (() => {
        // Largest currency's revenue; others counted, never summed.
        const r = revenueHeadline(revenueRows(metrics));
        return r.value === "-" ? "-" : `${r.value} total${r.moreLabel ? `, ${r.moreLabel}` : ""}`;
      })(),
    },
  ];

  return (
    <AdminDashboardShell activeItem="Users" crumb="Users">
      <PageHeader
        className="mb-0!"
        title="Users"
        subtitle="Search by email or name, then open an account to see its details or suspend it."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <DSStatCard key={kpi.label} size="sm" label={kpi.label} value={kpi.value} delta={<span className="whitespace-normal">{kpi.delta}</span>} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email, name or user ID"
          aria-label="Search users"
          maxLength={100}
          className="h-9 px-3 rounded-(--r-2) text-[13.5px] flex-1 min-w-0 sm:min-w-[260px] sm:max-w-[420px]"
          style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
        />
        <div className="flex items-center gap-2 overflow-x-auto">
          {ROLE_FILTERS.map((f) => (
            <FilterPill
              key={f.value || "all"}
              label={f.label}
              active={role === f.value}
              onClick={() => {
                setRole(f.value);
                setPage(1);
              }}
            />
          ))}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-(--r-3) p-4 text-[13px]"
          style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}
        >
          <div className="font-medium">Couldn&apos;t load users</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>
            {error}
          </div>
        </div>
      ) : null}

      {loading && !data ? (
        <AsyncSpinner />
      ) : !error && data && data.items.length === 0 ? (
        <EmptySlate
          message="No users match"
          hint={debounced || role ? "Try a shorter search or another role." : undefined}
        />
      ) : !error && data ? (
        <>
          <DSCard style={{ opacity: loading ? 0.6 : 1 }}>
            <DSTable minWidth={760}>
              <DSTableHead>
                <DSTableTh>User</DSTableTh>
                <DSTableTh>Role</DSTableTh>
                <DSTableTh>Joined</DSTableTh>
                <DSTableTh>Last login</DSTableTh>
                <DSTableTh>Status</DSTableTh>
              </DSTableHead>
              <tbody>
                {data.items.map((u, i) => (
                  <DSTableRow key={u.id} last={i === data.items.length - 1}>
                    <DSTableTd>
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="flex items-center gap-2.5 no-underline"
                        style={{ color: "var(--ink)" }}
                      >
                        <span
                          aria-hidden
                          className="w-8 h-8 rounded-full shrink-0 inline-flex items-center justify-center font-mono text-[11px]"
                          style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-2)" }}
                        >
                          {initials(u)}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-medium truncate">
                            {`${u.first_name} ${u.last_name}`.trim() || "Unnamed user"}
                          </span>
                          <span className="block font-mono text-[11.5px] truncate" style={{ color: "var(--fg-3)" }}>
                            {u.email}
                          </span>
                        </span>
                      </Link>
                    </DSTableTd>
                    <DSTableTd className="text-[13px]">
                      {roleLabel(u.role?.code)}
                      {u.is_admin ? (
                        <Eyebrow as="span" className="ml-1.5">
                          admin
                        </Eyebrow>
                      ) : null}
                    </DSTableTd>
                    <DSTableTd className="whitespace-nowrap text-[12.5px]">{formatAdminDate(u.created_at)}</DSTableTd>
                    <DSTableTd className="whitespace-nowrap text-[12.5px]">
                      {u.last_login ? formatAdminDate(u.last_login) : "Never"}
                    </DSTableTd>
                    <DSTableTd>
                      {u.is_suspended ? (
                        <StatusPill tone="danger" label="Suspended" />
                      ) : u.is_placeholder ? (
                        <StatusPill tone="warn" label="Invited" />
                      ) : (
                        <StatusPill tone="success" label="Active" />
                      )}
                    </DSTableTd>
                  </DSTableRow>
                ))}
              </tbody>
            </DSTable>
          </DSCard>

          <div className="flex items-center justify-between text-[13px]">
            <div style={{ color: "var(--fg-3)" }}>
              {data.total.toLocaleString()} user{data.total === 1 ? "" : "s"}
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
