"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/Modal";
import { AsyncSpinner, EmptySlate, Eyebrow, StatusPill } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { AdminPermission as P, type AdminPermission } from "@/lib/admin/permissions";
import {
  adminRoleKeys,
  adminRolesService,
  type AdminPermissionGroup,
  type AdminRoleDetail,
} from "@/lib/api/adminRoles";
import { adminRoleErrorMessage } from "@/lib/admin/roleErrors";
import { rolePermissions } from "@/lib/admin/roleHelpers";
import { PermissionChecklist } from "./PermissionChecklist";
import { RoleHistory } from "./RoleHistory";
import { DeleteRoleDialog } from "./DeleteRoleDialog";
import { invalidateAdminRoles } from "./shared";

const NAME_MIN = 2;
const NAME_MAX = 60;
const DESCRIPTION_MAX = 280;

type Tab = "permissions" | "holders" | "history";

const inputClass = "min-h-11 w-full rounded-(--r-2) px-3 text-[14px]";
const inputStyle = { background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--ink)" } as const;

/**
 * Create a role (`roleId` null) or open one: name, description and the
 * grouped permission checklist, plus Holders and History tabs for an
 * existing role. The shared Modal guards unsaved changes.
 *
 * Read-only for the Super admin role and for admins without admins:manage.
 */
export function RoleEditorModal({
  roleId,
  catalogue,
  onClose,
}: {
  roleId: string | null;
  catalogue: AdminPermissionGroup[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { can, isSuper } = useAdminAccess();
  const canManage = can(P.ADMINS_MANAGE);
  const isNew = roleId === null;

  const detailQuery = useQuery<AdminRoleDetail, Error>({
    queryKey: adminRoleKeys.detail(roleId ?? "new"),
    enabled: !isNew,
    queryFn: async () => {
      const res = await adminRolesService.getRole(roleId as string);
      if (!res.success || !res.data) throw new Error(res.message || "We couldn't load this role.");
      return res.data;
    },
  });
  const role = detailQuery.data;

  const [tab, setTab] = useState<Tab>("permissions");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<AdminPermission>>(new Set());
  const [error, setError] = useState<{ message: string; stale?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fill the form from the role as loaded, and again after a reload (a new
  // updated_at), so a stale edit can start over from the current version.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const stamp = role ? `${role.id}:${role.updated_at ?? ""}` : null;
  if (role && stamp !== loadedFor) {
    setLoadedFor(stamp);
    setName(role.name);
    setDescription(role.description ?? "");
    setSelected(new Set(rolePermissions(role)));
    setError(null);
  }

  const readOnly = !canManage || role?.is_system === true;
  const label = (key: string) =>
    catalogue.flatMap((g) => g.items).find((i) => i.key === key)?.label ?? key;
  const beyondYours = role && !role.is_system && !isSuper ? role.permissions.some((p) => !can(p)) : false;

  const trimmed = name.trim().replace(/\s+/g, " ");
  const nameError =
    trimmed.length < NAME_MIN
      ? "Give the role a name of at least 2 characters."
      : trimmed.length > NAME_MAX
        ? `Keep the name to ${NAME_MAX} characters.`
        : null;
  const permsError = selected.size === 0 ? "Choose at least one permission." : null;

  const save = async () => {
    if (readOnly || saving) return;
    if (nameError || permsError) {
      setError({ message: nameError ?? permsError ?? "" });
      setTab("permissions");
      return;
    }
    setSaving(true);
    setError(null);
    // Catalogue order, so the request and the history read the same way.
    const permissions = catalogue.flatMap((g) => g.items.map((i) => i.key)).filter((k) => selected.has(k));
    const res = isNew
      ? await adminRolesService.createRole({
          name: trimmed,
          ...(description.trim() ? { description: description.trim() } : {}),
          permissions,
        })
      : await adminRolesService.updateRole(roleId, {
          name: trimmed,
          description: description.trim(),
          permissions,
          expected_updated_at: role?.updated_at ?? "",
        });
    setSaving(false);
    if (!res.success || !res.data) {
      setError({
        message: adminRoleErrorMessage(res, "We couldn't save this role. Try again."),
        stale: res.code === "ADMIN_ROLE_STALE",
      });
      return;
    }
    invalidateAdminRoles(queryClient);
    toast.success(isNew ? `${res.data.name} created` : `${res.data.name} saved`);
    onClose();
  };

  const remove = async (): Promise<string | null> => {
    if (!roleId) return null;
    const res = await adminRolesService.deleteRole(roleId);
    if (!res.success) {
      // Someone was given the role since it loaded: show who.
      if (res.code === "ADMIN_ROLE_IN_USE") await detailQuery.refetch();
      return adminRoleErrorMessage(res, "We couldn't delete this role. Try again.");
    }
    invalidateAdminRoles(queryClient);
    toast.success(`${role?.name ?? "Role"} deleted`);
    setDeleting(false);
    onClose();
    return null;
  };

  const title = isNew ? "New role" : role ? role.name : "Role";
  const holders = role?.holders ?? [];

  const footer = readOnly ? (
    <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={onClose}>
      Close
    </button>
  ) : (
    <>
      {!isNew && role && (
        <button
          type="button"
          className="btn-ghost-v2 sm min-h-11 mr-auto"
          style={{ color: "var(--danger-ink)" }}
          onClick={() => setDeleting(true)}
        >
          Delete role
        </button>
      )}
      <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={onClose} disabled={saving}>
        Cancel
      </button>
      <button
        type="button"
        className="btn-primary-v2 sm min-h-11"
        onClick={() => void save()}
        disabled={saving || (!isNew && !role)}
      >
        {saving ? "Saving..." : isNew ? "Create role" : "Save"}
      </button>
    </>
  );

  return (
    <>
      <Modal open onClose={onClose} title={title} size="xl" footer={footer}>
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto -mx-1 px-1">
          {!isNew && detailQuery.isLoading ? (
            <AsyncSpinner label="Loading role" />
          ) : !isNew && detailQuery.error ? (
            <div role="alert" className="flex items-center justify-between gap-3 text-[13px]" style={{ color: "var(--danger-ink)" }}>
              <span>{detailQuery.error.message}</span>
              <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={() => void detailQuery.refetch()}>
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {role?.is_system && (
                <p className="text-[13px] rounded-(--r-2) px-3 py-2.5" style={{ background: "var(--bg-2)", color: "var(--fg-2)" }}>
                  The Super admin role always has every permission. It can&apos;t be edited or deleted.
                </p>
              )}
              {!role?.is_system && !canManage && (
                <p className="text-[13px] rounded-(--r-2) px-3 py-2.5" style={{ background: "var(--bg-2)", color: "var(--fg-2)" }}>
                  You can view this role. Changing roles needs the “Manage admins and roles” permission.
                </p>
              )}
              {!readOnly && beyondYours && (
                <p className="text-[13px] rounded-(--r-2) px-3 py-2.5" style={{ background: "var(--warn-soft)", color: "var(--warn-ink)" }}>
                  This role has permissions you don&apos;t hold, so you can add to it but not take anything away.
                </p>
              )}

              {readOnly ? (
                role?.description ? (
                  <p className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
                    {role.description}
                  </p>
                ) : null
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <Eyebrow as="span">Name</Eyebrow>
                    <input
                      value={name}
                      maxLength={NAME_MAX}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Support lead"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <Eyebrow as="span">Description (optional)</Eyebrow>
                    <input
                      value={description}
                      maxLength={DESCRIPTION_MAX}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What this role is for"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </label>
                </div>
              )}

              {!isNew && (
                <div role="tablist" aria-label="Role sections" className="flex gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
                  {(
                    [
                      ["permissions", "Permissions"],
                      ["holders", `Holders · ${holders.length}`],
                      ["history", "History"],
                    ] as const
                  ).map(([key, text]) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={tab === key}
                      onClick={() => setTab(key)}
                      className="min-h-11 px-3 text-[13px] -mb-px"
                      style={{
                        color: tab === key ? "var(--ink)" : "var(--fg-3)",
                        fontWeight: tab === key ? 500 : 400,
                        borderBottom: `2px solid ${tab === key ? "var(--ink)" : "transparent"}`,
                      }}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}

              {(isNew || tab === "permissions") && (
                <PermissionChecklist
                  catalogue={catalogue}
                  selected={selected}
                  onChange={setSelected}
                  canGrant={can}
                  readOnly={readOnly}
                />
              )}

              {!isNew && tab === "holders" &&
                (holders.length === 0 ? (
                  <EmptySlate message="Nobody holds this role" hint="Give it to someone from their page in Users." />
                ) : (
                  <ul className="flex flex-col" aria-label="People with this role">
                    {holders.map((h, idx) => (
                      <li
                        key={h.id}
                        className="min-h-11 flex flex-wrap items-center gap-2 py-2"
                        style={idx > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
                      >
                        <Link href={`/admin/users/${h.id}`} className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                          {[h.first_name, h.last_name].filter(Boolean).join(" ") || "Unnamed admin"}
                        </Link>
                        {h.email && (
                          <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                            {h.email}
                          </span>
                        )}
                        {h.is_suspended && <StatusPill tone="danger" label="Suspended" />}
                      </li>
                    ))}
                  </ul>
                ))}

              {!isNew && tab === "history" && roleId && <RoleHistory roleId={roleId} label={label} />}

              {error && (
                <div role="alert" className="flex flex-wrap items-center gap-3 text-[13px]" style={{ color: "var(--danger-ink)" }}>
                  <span>{error.message}</span>
                  {error.stale && (
                    <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={() => void detailQuery.refetch()}>
                      Reload
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
      {deleting && role && (
        <DeleteRoleDialog
          roleName={role.name}
          holders={holders}
          onCancel={() => setDeleting(false)}
          onConfirm={remove}
        />
      )}
    </>
  );
}
