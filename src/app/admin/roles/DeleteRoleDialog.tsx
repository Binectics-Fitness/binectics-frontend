"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";
import { StatusPill } from "@/components/ds";
import type { AdminRoleHolder } from "@/lib/api/adminRoles";

const holderName = (h: AdminRoleHolder) => [h.first_name, h.last_name].filter(Boolean).join(" ").trim() || "Unnamed admin";

/**
 * Deleting a role. While anyone holds it the dialog can't delete: it lists
 * the holders, each linking to their user page where the role can be taken
 * away (the API refuses with 409 ADMIN_ROLE_IN_USE anyway).
 */
export function DeleteRoleDialog({
  roleName,
  holders,
  onCancel,
  onConfirm,
}: {
  roleName: string;
  holders: AdminRoleHolder[];
  onCancel: () => void;
  /** Resolves to an error message, or null when it worked. */
  onConfirm: () => Promise<string | null>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = holders.length > 0;

  const submit = async () => {
    setSaving(true);
    setError(null);
    const failure = await onConfirm();
    setSaving(false);
    if (failure) setError(failure);
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title={blocked ? `${roleName} is still in use` : `Delete ${roleName}?`}
      size="md"
      disableCloseGuard
      footer={
        blocked ? (
          <button type="button" className="btn-primary-v2 sm min-h-11" onClick={onCancel}>
            OK
          </button>
        ) : (
          <>
            <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-ghost-v2 sm min-h-11"
              style={{ color: "var(--danger-ink)", borderColor: "var(--danger)" }}
              onClick={() => void submit()}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete role"}
            </button>
          </>
        )
      }
    >
      {blocked ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
            {holders.length === 1 ? "1 person holds" : `${holders.length} people hold`} this role. Take it away from
            them on their user page before deleting it.
          </p>
          <ul className="flex flex-col" aria-label="People with this role">
            {holders.map((h, idx) => (
              <li
                key={h.id}
                className="min-h-11 flex flex-wrap items-center gap-2 py-2"
                style={idx > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
              >
                <Link href={`/admin/users/${h.id}`} className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                  {holderName(h)}
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
        </div>
      ) : (
        <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
          Nobody holds this role. Deleting it can&apos;t be undone; its history is kept.
        </p>
      )}
      {error && (
        <p role="alert" className="text-[13px] mt-3" style={{ color: "var(--danger-ink)" }}>
          {error}
        </p>
      )}
    </Modal>
  );
}
