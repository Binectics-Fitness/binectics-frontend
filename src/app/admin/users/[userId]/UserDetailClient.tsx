"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { ActionModal } from "@/components/ds/ActionModal";
import { AsyncSpinner, StatusPill } from "@/components/ds";
import { toast } from "@/components/Toast";
import { adminService, type AdminUserDetail, type AdminUserSuspensionResult } from "@/lib/api/admin";
import { formatAdminDate, formatAdminDateTime, roleLabel } from "@/lib/admin/moderation";

const SUSPEND_REASON_MAX = 500;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-(--r-3) p-5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <h3 className="text-[14px] font-medium mb-3" style={{ color: "var(--ink)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Rows({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-2.5 text-[13px]">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt style={{ color: "var(--fg-3)" }}>{r.label}</dt>
          <dd className="min-w-0 break-words" style={{ color: "var(--ink)" }}>
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Verified({ ok, at }: { ok: boolean; at?: string | null }) {
  return (
    <span className="font-mono text-[11px] ml-2" style={{ color: ok ? "var(--signal-ink)" : "var(--fg-3)" }}>
      {ok ? `verified${at ? ` ${formatAdminDate(at)}` : ""}` : "not verified"}
    </span>
  );
}

export function UserDetailClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [unsuspendOpen, setUnsuspendOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [cascade, setCascade] = useState<AdminUserSuspensionResult["cascaded"] | null>(null);

  const load = useCallback(async () => {
    const res = await adminService.getUser(userId);
    if (res.success && res.data) {
      setUser(res.data);
      setError(null);
    } else {
      setError(
        res.status === 404
          ? "No user has this id."
          : res.status === 400
            ? "That isn't a valid user id."
            : res.message || "We couldn't load this user.",
      );
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    const kick = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(kick);
  }, [load]);

  const suspend = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    const res = await adminService.suspendUser(userId, reason.trim());
    setSaving(false);
    if (!res.success) {
      toast.error(res.message || "The suspension didn't go through.");
      return;
    }
    toast.success("Account suspended");
    setCascade(res.data?.cascaded ?? null);
    setSuspendOpen(false);
    await load();
  };

  const unsuspend = async () => {
    setSaving(true);
    const res = await adminService.unsuspendUser(userId);
    setSaving(false);
    if (!res.success) {
      toast.error(res.message || "Reinstating didn't go through.");
      return;
    }
    toast.success("Account reinstated");
    setCascade(null);
    setUnsuspendOpen(false);
    await load();
  };

  const name = user ? `${user.first_name} ${user.last_name}`.trim() || "Unnamed user" : "User";
  const place = user ? [user.city, user.country_code].filter(Boolean).join(" · ") : "";

  // Modals sit outside the shell: it renders its body twice (desktop and
  // phone), which would open two copies of each dialog.
  return (
    <>
      <AdminDashboardShell
        activeItem="Users"
        crumb={user ? name : "User detail"}
        actions={
          user ? (
            user.is_suspended ? (
              <button type="button" className="btn-primary-v2" onClick={() => setUnsuspendOpen(true)}>
                Unsuspend
              </button>
            ) : (
              <button
                type="button"
                className="btn-ghost-v2"
                style={{ color: "var(--danger)" }}
                onClick={() => {
                  setReason("");
                  setSuspendOpen(true);
                }}
              >
                Suspend
              </button>
            )
          ) : undefined
        }
      >
        <div>
          <Link href="/admin/users" className="text-[12.5px] no-underline" style={{ color: "var(--fg-3)" }}>
            &larr; Users
          </Link>
          <h1 className="text-[28px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            {name}
          </h1>
          {user ? (
            <p className="text-[13.5px] mt-1.5 flex flex-wrap items-center gap-2" style={{ color: "var(--fg-3)" }}>
              {user.is_suspended ? (
                <StatusPill tone="danger" label="Suspended" />
              ) : user.is_placeholder ? (
                <StatusPill tone="warn" label="Invited, not claimed" />
              ) : (
                <StatusPill tone="success" label="Active" />
              )}
              <span className="font-mono text-[12px]">{user.id}</span>
              <span>· joined {formatAdminDate(user.created_at)}</span>
              {place ? <span>· {place}</span> : null}
            </p>
          ) : null}
        </div>

        {loading ? (
          <AsyncSpinner size="page" />
        ) : error || !user ? (
          <div
            role="alert"
            className="rounded-(--r-3) p-4 text-[13px]"
            style={{
              background: "var(--danger-soft)",
              border: "1px solid oklch(0.92 0.05 25)",
              color: "var(--danger)",
            }}
          >
            <div className="font-medium">Couldn&apos;t load this user</div>
            <div className="mt-1" style={{ color: "var(--ink)" }}>
              {error}
            </div>
          </div>
        ) : (
          <>
            {user.is_suspended ? (
              <div
                className="rounded-(--r-3) p-4 text-[13px]"
                style={{
                  background: "var(--danger-soft)",
                  border: "1px solid oklch(0.92 0.05 25)",
                  color: "var(--ink)",
                }}
              >
                <strong>Suspended.</strong>{" "}
                {user.suspension_reason ? `Reason: ${user.suspension_reason}` : "No reason was recorded."}
                {cascade ? (
                  <span className="block mt-1" style={{ color: "var(--fg-2)" }}>
                    {cascade.listingsSuspended} listing
                    {cascade.listingsSuspended === 1 ? "" : "s"} suspended, {cascade.subscriptionsCancelled}{" "}
                    subscription
                    {cascade.subscriptionsCancelled === 1 ? "" : "s"} cancelled, {cascade.bookingsCancelled} booking
                    {cascade.bookingsCancelled === 1 ? "" : "s"} cancelled.
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Bookings as client",
                  value: user.counts.bookings_as_client,
                },
                {
                  label: "Bookings as provider",
                  value: user.counts.bookings_as_provider,
                },
                {
                  label: "Coaches (client profiles)",
                  value: user.counts.client_profiles_as_client,
                },
                {
                  label: "Clients (as provider)",
                  value: user.counts.client_profiles_as_provider,
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-(--r-3) p-[14px_16px]"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                    {k.label}
                  </div>
                  <div
                    className="text-[22px] font-medium mt-1"
                    style={{
                      color: "var(--ink)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {k.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3.5">
              <Card title="Account">
                <Rows
                  rows={[
                    {
                      label: "Name",
                      value: [user.first_name, user.other_name, user.last_name].filter(Boolean).join(" ") || "-",
                    },
                    ...(user.username ? [{ label: "Username", value: user.username }] : []),
                    {
                      label: "Email",
                      value: (
                        <>
                          <span className="font-mono text-[12.5px]">{user.email}</span>
                          <Verified ok={user.is_email_verified} at={user.email_verified_at} />
                        </>
                      ),
                    },
                    {
                      label: "Phone",
                      value: user.phone_number ? (
                        <>
                          <span className="font-mono text-[12.5px]">{user.phone_number}</span>
                          <Verified ok={user.is_phone_number_verified} at={user.phone_number_verified_at} />
                        </>
                      ) : (
                        "-"
                      ),
                    },
                    { label: "Location", value: place || "-" },
                    {
                      label: "Joined",
                      value: formatAdminDate(user.created_at),
                    },
                    {
                      label: "Last login",
                      value: user.last_login ? formatAdminDateTime(user.last_login) : "Never",
                    },
                    {
                      label: "Onboarding",
                      value: user.is_onboarding_complete ? "Complete" : "Not finished",
                    },
                    ...(user.must_change_password
                      ? [
                          {
                            label: "Password",
                            value: "Must change at next sign-in",
                          },
                        ]
                      : []),
                  ]}
                />
              </Card>

              <Card title="Role and access">
                <Rows
                  rows={[
                    {
                      label: "Role",
                      value: (
                        <>
                          {roleLabel(user.role?.code)}
                          {user.account_type_from_team ? (
                            <span className="block text-[12px]" style={{ color: "var(--fg-3)" }}>
                              from a gym team role
                            </span>
                          ) : null}
                        </>
                      ),
                    },
                    {
                      label: "Platform admin",
                      value: user.is_admin
                        ? user.admin_permissions.length
                          ? `Yes · ${user.admin_permissions.join(", ")}`
                          : "Yes · full access"
                        : "No",
                    },
                  ]}
                />
                <p className="text-[12px] mt-3" style={{ color: "var(--fg-3)" }}>
                  Admin access is granted only by the grant-admin script, not from this page.
                </p>
              </Card>
            </div>

            <Card title={`Listings (${user.listings.length})`}>
              {user.listings.length === 0 ? (
                <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                  Owns no marketplace listings.
                </p>
              ) : (
                <ul className="space-y-2 text-[13px]">
                  {user.listings.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-2">
                      <Link href={`/marketplace/${l.id}`} style={{ color: "var(--ink)" }}>
                        {l.headline ?? "Untitled listing"}
                      </Link>
                      <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
                        {roleLabel(l.account_type)}
                      </span>
                      {l.is_suspended ? (
                        <StatusPill tone="danger" label="Suspended" />
                      ) : l.is_published ? (
                        <StatusPill tone="success" label="Published" />
                      ) : (
                        <StatusPill tone="neutral" label="Draft" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              <Card title={`Workspaces owned (${user.organizations.length})`}>
                {user.organizations.length === 0 ? (
                  <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                    Owns no workspace.
                  </p>
                ) : (
                  <ul className="space-y-2 text-[13px]">
                    {user.organizations.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-center gap-2">
                        <span style={{ color: "var(--ink)" }}>{o.name}</span>
                        <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
                          {roleLabel(o.account_type)}
                        </span>
                        {!o.is_active ? <StatusPill tone="neutral" label="Inactive" /> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title={`Team memberships (${user.team_memberships.length})`}>
                {user.team_memberships.length === 0 ? (
                  <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                    Not on any team.
                  </p>
                ) : (
                  <ul className="space-y-2 text-[13px]">
                    {user.team_memberships.map((m) => (
                      <li
                        key={`${m.organization_id}-${m.team_role ?? ""}`}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <span style={{ color: "var(--ink)" }}>{m.organization_name ?? "Unknown workspace"}</span>
                        <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
                          {m.team_role ?? "No role"} · {m.status}
                          {m.joined_at ? ` · joined ${formatAdminDate(m.joined_at)}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )}
      </AdminDashboardShell>

      <ActionModal
        open={suspendOpen}
        onClose={() => (saving ? undefined : setSuspendOpen(false))}
        title="Suspend account"
        description="The user can no longer sign in. Their listings are suspended, their active memberships cancelled, and pending or confirmed bookings on either side cancelled. They are notified with the reason."
        footer={
          <>
            <button type="button" className="btn-ghost-v2" onClick={() => setSuspendOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void suspend()}
              disabled={saving || !reason.trim()}
              className="btn-primary-v2 disabled:opacity-40"
              style={{
                background: "var(--danger)",
                borderColor: "var(--danger)",
                color: "white",
              }}
            >
              {saving ? "Suspending..." : "Suspend account"}
            </button>
          </>
        }
      >
        <label
          htmlFor="suspend-reason"
          className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3"
        >
          Reason
        </label>
        <textarea
          id="suspend-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={SUSPEND_REASON_MAX}
          rows={3}
          className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
          placeholder="Shown to the user in their suspension notice."
        />
      </ActionModal>

      <ActionModal
        open={unsuspendOpen}
        onClose={() => (saving ? undefined : setUnsuspendOpen(false))}
        title="Reinstate account"
        description="The user can sign in again, and listings suspended along with the account are restored. Cancelled memberships and bookings stay cancelled."
        footer={
          <>
            <button type="button" className="btn-ghost-v2" onClick={() => setUnsuspendOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void unsuspend()}
              disabled={saving}
              className="btn-primary-v2 disabled:opacity-40"
            >
              {saving ? "Reinstating..." : "Reinstate"}
            </button>
          </>
        }
      >
        <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
          {name} · <span className="font-mono">{user?.email}</span>
        </p>
      </ActionModal>
    </>
  );
}
