"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import {
  AsyncSpinner,
  DSCard,
  DSCardHead,
  DSTable,
  DSTableHead,
  DSTableRow,
  DSTableTd,
  DSTableTh,
  EmptySlate,
  PageHeader,
  StatusPill,
} from "@/components/ds";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { AdminPermission as P } from "@/lib/admin/permissions";
import {
  adminRoleKeys,
  adminRolesService,
  type AdminPermissionGroup,
  type AdminRole,
  type AdminTeamMember,
} from "@/lib/api/adminRoles";
import { rolePermissions } from "@/lib/admin/roleHelpers";
import { absoluteTime, relativeTime } from "@/lib/featureFlags/helpers";
import { RoleEditorModal } from "./RoleEditorModal";
import { RoleChip } from "./shared";

function useLoaded<T>(key: readonly unknown[], load: () => Promise<{ success: boolean; data?: T; message?: string }>, what: string) {
  return useQuery<T, Error>({
    queryKey: key,
    queryFn: async () => {
      const res = await load();
      if (!res.success || !res.data) throw new Error(res.message || `We couldn't load ${what}.`);
      return res.data;
    },
  });
}

function LoadError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div
      role="alert"
      className="m-4 rounded-(--r-2) p-3 text-[13px] flex items-center justify-between gap-3"
      style={{ background: "var(--danger-soft)", color: "var(--danger-ink)" }}
    >
      <span>{error.message}</span>
      <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={retry}>
        Retry
      </button>
    </div>
  );
}

const personName = (m: { first_name: string; last_name: string }) =>
  [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || "Unnamed admin";

/**
 * Admin: Team & roles (admin-team-roles.html). The admins table, the roles
 * with their permission counts and holders, and the permissions matrix.
 * Reading needs admins:read; New role, edit and delete need admins:manage.
 * Making someone an admin happens on their user page.
 */
export default function RolesClient() {
  const { can } = useAdminAccess();
  const canManage = can(P.ADMINS_MANAGE);
  const [editing, setEditing] = useState<string | null | undefined>(undefined);

  const admins = useLoaded<AdminTeamMember[]>(adminRoleKeys.admins(), () => adminRolesService.listAdmins(), "the admins");
  const roles = useLoaded<AdminRole[]>(adminRoleKeys.list(), () => adminRolesService.listRoles(), "the roles");
  const catalogue = useLoaded<AdminPermissionGroup[]>(
    adminRoleKeys.permissions(),
    () => adminRolesService.listPermissions(),
    "the permissions",
  );

  const adminCount = admins.data?.length;
  const roleCount = roles.data?.length;
  const summary = [
    adminCount !== undefined ? `${adminCount} ${adminCount === 1 ? "admin" : "admins"}` : null,
    roleCount !== undefined ? `${roleCount} ${roleCount === 1 ? "role" : "roles"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <AdminDashboardShell activeItem="Team & roles" crumb="Team & roles">
        <PageHeader
          title="Team & roles"
          subtitle={summary || "Who can do what in the admin"}
          actions={
            <div className="flex flex-wrap gap-2">
              {can(P.AUDIT_READ) && (
                <Link href="/admin/audit-log" className="btn-ghost-v2 min-h-11 inline-flex items-center">
                  Audit log
                </Link>
              )}
              {canManage && (
                <button
                  type="button"
                  className="btn-primary-v2 min-h-11"
                  disabled={!catalogue.data}
                  onClick={() => setEditing(null)}
                >
                  New role
                </button>
              )}
            </div>
          }
        />

        <div className="flex flex-col gap-4">
          <DSCard>
            <DSCardHead
              title={adminCount !== undefined ? `Admins · ${adminCount}` : "Admins"}
              subtitle="To make someone an admin or change their roles, open their page in Users."
            />
            {admins.error ? (
              <LoadError error={admins.error} retry={() => void admins.refetch()} />
            ) : admins.isLoading ? (
              <div className="p-4">
                <AsyncSpinner />
              </div>
            ) : !admins.data?.length ? (
              <div className="p-4">
                <EmptySlate message="No admins yet" />
              </div>
            ) : (
              <DSTable minWidth={560}>
                <DSTableHead>
                  <DSTableTh>Name</DSTableTh>
                  <DSTableTh>Roles</DSTableTh>
                  <DSTableTh>Last active</DSTableTh>
                  <DSTableTh>Status</DSTableTh>
                </DSTableHead>
                <tbody>
                  {admins.data.map((m, idx) => (
                    <DSTableRow key={m.id} last={idx === admins.data.length - 1}>
                      <DSTableTd>
                        <Link href={`/admin/users/${m.id}`} className="font-medium" style={{ color: "var(--ink)" }}>
                          {personName(m)}
                        </Link>
                        {m.email && (
                          <span className="block text-[12px]" style={{ color: "var(--fg-3)" }}>
                            {m.email}
                          </span>
                        )}
                      </DSTableTd>
                      <DSTableTd>
                        <span className="flex flex-wrap gap-1">
                          {m.roles.map((r) => (
                            <RoleChip key={r.id} name={r.name} system={r.is_system} />
                          ))}
                          {m.roles.length === 0 && (
                            <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                              {m.direct_permissions.length ? "Direct permissions only" : "No role"}
                            </span>
                          )}
                          {m.legacy && <StatusPill tone="neutral" label="Legacy" dot={false} title="Access from before roles" />}
                        </span>
                      </DSTableTd>
                      <DSTableTd mono>
                        <span
                          className="text-[11.5px]"
                          style={{ color: "var(--fg-3)" }}
                          title={m.last_login ? absoluteTime(m.last_login) : undefined}
                        >
                          {m.last_login ? relativeTime(m.last_login) : "Never"}
                        </span>
                      </DSTableTd>
                      <DSTableTd>
                        {m.is_suspended ? (
                          <StatusPill tone="danger" label="Suspended" />
                        ) : (
                          <StatusPill tone="success" label="Active" />
                        )}
                      </DSTableTd>
                    </DSTableRow>
                  ))}
                </tbody>
              </DSTable>
            )}
          </DSCard>

          <DSCard>
            <DSCardHead
              title={roleCount !== undefined ? `Roles · ${roleCount}` : "Roles"}
              subtitle={canManage ? "Open a role to edit its permissions or see its history." : "Open a role to see its permissions and history."}
            />
            {roles.error ? (
              <LoadError error={roles.error} retry={() => void roles.refetch()} />
            ) : roles.isLoading ? (
              <div className="p-4">
                <AsyncSpinner />
              </div>
            ) : !roles.data?.length ? (
              <div className="p-4">
                <EmptySlate message="No roles yet" />
              </div>
            ) : (
              <ul aria-label="Roles">
                {roles.data.map((r, idx) => (
                  <li key={r.id} style={idx > 0 ? { borderTop: "1px solid var(--border)" } : undefined}>
                    <button
                      type="button"
                      onClick={() => setEditing(r.id)}
                      disabled={!catalogue.data}
                      className="w-full min-h-11 text-left px-4.5 py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 hover:bg-bg-2"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                            {r.name}
                          </span>
                          {r.is_system && <StatusPill tone="neutral" label="System" dot={false} />}
                        </span>
                        {r.description && (
                          <span className="block text-[12.5px] mt-0.5" style={{ color: "var(--fg-2)" }}>
                            {r.description}
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-[11.5px] shrink-0" style={{ color: "var(--fg-3)" }}>
                        {r.is_system ? "All permissions" : `${r.permissions.length} ${r.permissions.length === 1 ? "permission" : "permissions"}`}
                        {" · "}
                        {r.holder_count} {r.holder_count === 1 ? "holder" : "holders"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </DSCard>

          {roles.data && roles.data.length > 0 && catalogue.data && (
            <PermissionsMatrix roles={roles.data} catalogue={catalogue.data} />
          )}
          {catalogue.error && <LoadError error={catalogue.error} retry={() => void catalogue.refetch()} />}
        </div>
      </AdminDashboardShell>
      {editing !== undefined && catalogue.data && (
        <RoleEditorModal roleId={editing} catalogue={catalogue.data} onClose={() => setEditing(undefined)} />
      )}
    </>
  );
}

/** Every permission against every role (the prototype's matrix). */
function PermissionsMatrix({ roles, catalogue }: { roles: AdminRole[]; catalogue: AdminPermissionGroup[] }) {
  const sets = roles.map((r) => new Set<string>(rolePermissions(r)));
  return (
    <DSCard>
      <DSCardHead title="Permissions matrix" />
      <DSTable minWidth={240 + roles.length * 110}>
        <DSTableHead>
          <DSTableTh>Permission</DSTableTh>
          {roles.map((r) => (
            <DSTableTh key={r.id} align="center">
              {r.name}
            </DSTableTh>
          ))}
        </DSTableHead>
        <tbody>
          {catalogue.map((g) => (
            <MatrixGroup key={g.group} group={g} sets={sets} roleCount={roles.length} />
          ))}
        </tbody>
      </DSTable>
    </DSCard>
  );
}

function MatrixGroup({ group, sets, roleCount }: { group: AdminPermissionGroup; sets: Set<string>[]; roleCount: number }) {
  return (
    <>
      <tr style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)" }}>
        <th
          scope="rowgroup"
          colSpan={roleCount + 1}
          className="text-left font-mono text-[10.5px] uppercase tracking-[0.05em] font-normal px-4 py-1.5"
          style={{ color: "var(--fg-3)" }}
        >
          {group.group}
        </th>
      </tr>
      {group.items.map((item) => (
        <tr key={item.key} style={{ borderTop: "1px solid var(--border)" }}>
          <th scope="row" className="text-left font-normal px-4 py-2 text-[13px]" style={{ color: "var(--ink)" }}>
            {item.label}
          </th>
          {sets.map((s, i) => (
            <td key={i} className="text-center px-2 py-2 text-[13px]" style={{ color: s.has(item.key) ? "var(--ink)" : "var(--fg-3)" }}>
              {s.has(item.key) ? <span aria-label="Yes">✓</span> : <span aria-label="No">-</span>}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
