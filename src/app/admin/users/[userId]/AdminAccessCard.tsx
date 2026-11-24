"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/Modal";
import { AsyncSpinner, DSCard, DSCheckbox, Eyebrow, StatusPill } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { AdminPermission as P, permissionLabel } from "@/lib/admin/permissions";
import type { AdminUserDetail } from "@/lib/api/admin";
import {
  adminRoleKeys,
  adminRolesService,
  type AdminPermissionGroup,
  type AdminRole,
  type AdminUserAccess,
} from "@/lib/api/adminRoles";
import { adminRoleErrorMessage } from "@/lib/admin/roleErrors";
import { assignmentDiff, canAssignRole, groupPermissions } from "@/lib/admin/roleHelpers";
import { invalidateAdminRoles, RoleChip } from "@/app/admin/roles/shared";

const fullName = (u: { first_name: string; last_name: string }) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || "this person";

/**
 * The user page's Admin access card (needs admins:read; the API leaves
 * `admin_access` out otherwise). Shows the person's roles and effective
 * permissions; an admins:manage holder can edit their roles (with the diff
 * shown before saving), make them an admin behind a typed confirmation, or
 * remove their admin access. Nobody changes their own access.
 */
export function AdminAccessCard({
  user,
  access,
  onChanged,
}: {
  user: AdminUserDetail;
  access: AdminUserAccess | null;
  onChanged: () => void | Promise<void>;
}) {
  const { user: me } = useAuth();
  const { can } = useAdminAccess();
  const canManage = can(P.ADMINS_MANAGE);
  const isSelf = !!me && (me as { id?: string }).id === user.id;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const catalogue = useQuery<AdminPermissionGroup[], Error>({
    queryKey: adminRoleKeys.permissions(),
    enabled: !!access,
    queryFn: async () => {
      const res = await adminRolesService.listPermissions();
      if (!res.success || !res.data) throw new Error(res.message || "We couldn't load the permissions.");
      return res.data;
    },
  });

  const grouped = access ? groupPermissions(access.effective_permissions, catalogue.data) : [];
  const count = access?.effective_permissions.length ?? 0;

  return (
    <DSCard className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
          Admin access
        </h3>
        {canManage && !isSelf && (
          <div className="flex flex-wrap gap-2">
            {access ? (
              <>
                <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={() => setEditing(true)}>
                  Edit roles
                </button>
                <button
                  type="button"
                  className="btn-ghost-v2 sm min-h-11"
                  style={{ color: "var(--danger-ink)" }}
                  onClick={() => setRevoking(true)}
                >
                  Remove admin access
                </button>
              </>
            ) : (
              <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={() => setEditing(true)}>
                Make admin
              </button>
            )}
          </div>
        )}
      </div>

      {!access ? (
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          Not an admin.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Roles">
            {access.roles.map((r) => (
              <RoleChip key={r.id} name={r.name} system={r.is_system} />
            ))}
            {access.roles.length === 0 && (
              <span className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                No role
              </span>
            )}
            {access.legacy && <StatusPill tone="neutral" label="Legacy" dot={false} title="Access from before roles" />}
          </div>
          {access.direct_permissions.length > 0 && (
            <p className="text-[12.5px]" style={{ color: "var(--fg-2)" }}>
              Also given directly (not through a role): {access.direct_permissions.map(permissionLabel).join(", ")}.
            </p>
          )}
          <div>
            <button
              type="button"
              className="min-h-11 text-[13px] flex items-center gap-1.5"
              style={{ color: "var(--ink)" }}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span aria-hidden="true" className="inline-block w-3" style={{ transform: open ? "rotate(90deg)" : undefined }}>
                ›
              </span>
              {access.is_super ? "Every permission" : `${count} ${count === 1 ? "permission" : "permissions"}`}
            </button>
            {open &&
              (catalogue.isLoading ? (
                <AsyncSpinner />
              ) : (
                <dl className="flex flex-col gap-2 mt-1">
                  {grouped.map((g) => (
                    <div key={g.group}>
                      <dt className="font-mono text-[10.5px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
                        {g.group}
                      </dt>
                      <dd className="text-[13px]" style={{ color: "var(--ink)" }}>
                        {g.labels.join(", ")}
                      </dd>
                    </div>
                  ))}
                </dl>
              ))}
          </div>
        </div>
      )}

      {canManage && isSelf && (
        <p className="text-[12px] mt-3" style={{ color: "var(--fg-3)" }}>
          You can&apos;t change your own admin access.
        </p>
      )}

      {editing && (
        <EditRolesModal
          user={user}
          access={access}
          onClose={() => setEditing(false)}
          onDone={async () => {
            setEditing(false);
            await onChanged();
          }}
        />
      )}
      {revoking && (
        <RevokeAdminModal
          user={user}
          onClose={() => setRevoking(false)}
          onDone={async () => {
            setRevoking(false);
            await onChanged();
          }}
        />
      )}
    </DSCard>
  );
}

/**
 * Choose roles, then review what changes before saving. Making someone an
 * admin (they hold no access yet) needs their email typed to confirm.
 */
export function EditRolesModal({
  user,
  access,
  onClose,
  onDone,
}: {
  user: AdminUserDetail;
  access: AdminUserAccess | null;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const queryClient = useQueryClient();
  const { can, isSuper } = useAdminAccess();
  const granting = !access;
  const before = access?.roles.map((r) => r.id) ?? [];
  const [chosen, setChosen] = useState<Set<string>>(new Set(before));
  const [step, setStep] = useState<"choose" | "review">("choose");
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = useQuery<AdminRole[], Error>({
    queryKey: adminRoleKeys.list(),
    queryFn: async () => {
      const res = await adminRolesService.listRoles();
      if (!res.success || !res.data) throw new Error(res.message || "We couldn't load the roles.");
      return res.data;
    },
  });

  const diff = assignmentDiff(roles.data ?? [], before, [...chosen], access?.direct_permissions ?? []);
  const phrase = (user.email || fullName(user)).trim();
  const confirmed = !granting || typed.trim().toLowerCase() === phrase.toLowerCase();

  const save = async () => {
    if (!confirmed || saving) return;
    setSaving(true);
    setError(null);
    const res = await adminRolesService.setAdminRoles(user.id, [...chosen], reason);
    setSaving(false);
    if (!res.success || !res.data) {
      setError(adminRoleErrorMessage(res, "We couldn't change these roles. Try again.", { assigning: true }));
      return;
    }
    invalidateAdminRoles(queryClient);
    toast.success(
      granting ? `${fullName(user)} is now an admin` : res.data.is_admin ? "Roles updated" : `${fullName(user)} is no longer an admin`,
    );
    await onDone();
  };

  const title = granting ? `Make ${fullName(user)} an admin` : `Edit roles · ${fullName(user)}`;

  const footer =
    step === "choose" ? (
      <>
        <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary-v2 sm min-h-11"
          disabled={!roles.data || diff.empty}
          onClick={() => setStep("review")}
        >
          Review changes
        </button>
      </>
    ) : (
      <>
        <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={() => setStep("choose")} disabled={saving}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary-v2 sm min-h-11"
          disabled={!confirmed || saving}
          onClick={() => void save()}
        >
          {saving ? "Saving..." : granting ? "Make admin" : "Save roles"}
        </button>
      </>
    );

  return (
    <Modal open onClose={onClose} title={title} size="lg" footer={footer}>
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto -mx-1 px-1 flex flex-col gap-4">
        {step === "choose" ? (
          roles.isLoading ? (
            <AsyncSpinner label="Loading roles" />
          ) : roles.error ? (
            <p role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>
              {roles.error.message}
            </p>
          ) : (
            <fieldset className="flex flex-col">
              <legend className="text-[13px] mb-2" style={{ color: "var(--fg-2)" }}>
                {granting
                  ? "Choose their first role. They get an email saying their admin access changed."
                  : "Choose every role they should hold."}
              </legend>
              {(roles.data ?? []).map((r, idx) => {
                const allowed = canAssignRole(r, can, isSuper);
                return (
                  <label
                    key={r.id}
                    className={`min-h-11 flex items-start gap-3 py-2.5 ${allowed ? "cursor-pointer" : ""}`}
                    style={idx > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
                  >
                    <DSCheckbox
                      className="mt-[3px] shrink-0"
                      checked={chosen.has(r.id)}
                      disabled={!allowed}
                      aria-label={r.name}
                      onChange={(on) => {
                        const next = new Set(chosen);
                        if (on) next.add(r.id);
                        else next.delete(r.id);
                        setChosen(next);
                      }}
                    />
                    <span className={`flex flex-col gap-0.5 ${allowed ? "" : "opacity-60"}`}>
                      <span className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                        {r.name}
                        {r.is_system && <StatusPill tone="neutral" label="System" dot={false} />}
                      </span>
                      <span className="text-[12.5px]" style={{ color: "var(--fg-2)" }}>
                        {r.description ? `${r.description} · ` : ""}
                        {r.is_system ? "All permissions" : `${r.permissions.length} ${r.permissions.length === 1 ? "permission" : "permissions"}`}
                      </span>
                      {!allowed && (
                        <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                          {r.is_system
                            ? "Only a Super admin can give or take this role"
                            : "You can't give or take a role with permissions you don't have"}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )
        ) : (
          <>
            <ReviewList title="Roles added" items={diff.rolesAdded.map((r) => r.name)} />
            <ReviewList title="Roles removed" items={diff.rolesRemoved.map((r) => r.name)} />
            <ReviewList title="Permissions gained" items={diff.permissionsAdded.map(permissionLabel)} />
            <ReviewList title="Permissions lost" items={diff.permissionsRemoved.map(permissionLabel)} />
            {!diff.permissionsAdded.length && !diff.permissionsRemoved.length && (
              <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                Their permissions stay the same.
              </p>
            )}
            {!granting && diff.losesAccess && (
              <p className="text-[13px] rounded-(--r-2) px-3 py-2.5" style={{ background: "var(--warn-soft)", color: "var(--warn-ink)" }}>
                With no role left, {fullName(user)} stops being an admin.
              </p>
            )}
            <label className="flex flex-col gap-1.5">
              <Eyebrow as="span">Reason (optional, kept in the history)</Eyebrow>
              <input
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-11 w-full rounded-(--r-2) px-3 text-[14px]"
                style={{ background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
              />
            </label>
            {granting && (
              <label className="flex flex-col gap-1.5">
                <Eyebrow as="span">Type {phrase} to confirm</Eyebrow>
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={`Type ${phrase} to confirm`}
                  className="min-h-11 w-full rounded-(--r-2) px-3 text-[14px] font-mono"
                  style={{ background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
                />
                <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                  Admins can see personal data and act on other accounts.
                </span>
              </label>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <Eyebrow as="div">{title}</Eyebrow>
      <ul className="mt-1 flex flex-col gap-0.5 text-[13.5px]" style={{ color: "var(--ink)" }} aria-label={title}>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function RevokeAdminModal({
  user,
  onClose,
  onDone,
}: {
  user: AdminUserDetail;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    const res = await adminRolesService.revokeAdmin(user.id, reason);
    setSaving(false);
    if (!res.success) {
      setError(adminRoleErrorMessage(res, "We couldn't remove their admin access. Try again."));
      return;
    }
    invalidateAdminRoles(queryClient);
    toast.success(`${fullName(user)} is no longer an admin`);
    await onDone();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Remove admin access from ${fullName(user)}?`}
      size="md"
      footer={
        <>
          <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-ghost-v2 sm min-h-11"
            style={{ color: "var(--danger-ink)", borderColor: "var(--danger)" }}
            onClick={() => void submit()}
            disabled={saving}
          >
            {saving ? "Removing..." : "Remove admin access"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
          Every role and directly given permission goes, and the admin area closes to them on their next request. Their
          own account is unaffected.
        </p>
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Reason (optional, kept in the history)</Eyebrow>
          <input
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-11 w-full rounded-(--r-2) px-3 text-[14px]"
            style={{ background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--ink)" }}
          />
        </label>
        {error && (
          <p role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
