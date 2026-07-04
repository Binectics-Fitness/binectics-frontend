"use client";

import { useEffect, useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";
import { teamsService, type TeamRole } from "@/lib/api/teams";

interface AddStaffModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string | null;
  /** Called after an invitation is sent, so the caller can refresh its list. */
  onInvited?: () => void;
}

export function AddStaffModal({ open, onClose, organizationId, onInvited }: AddStaffModalProps) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Load the org's real team roles when the modal opens.
  useEffect(() => {
    if (!open || !organizationId) return;
    let active = true;
    const run = async () => {
      setRolesLoading(true);
      try {
        const res = await teamsService.getRoles(organizationId);
        if (!active) return;
        if (res.success && res.data) setRoles(res.data);
        else toast.error("Couldn't load team roles");
      } catch {
        if (active) toast.error("Couldn't load team roles");
      } finally {
        if (active) setRolesLoading(false);
      }
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [open, organizationId]);

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  const handleClose = () => {
    setEmail("");
    setRoleId("");
    onClose();
  };

  const handleAdd = async () => {
    if (!organizationId || sending) return;
    setSending(true);
    try {
      const res = await teamsService.inviteMember(organizationId, {
        email: email.trim(),
        team_role_id: roleId,
      });
      if (res.success) {
        toast.success(`Invitation sent to ${email.trim()}`);
        onInvited?.();
        handleClose();
      } else {
        toast.error(res.message || "Couldn't send the invitation");
      }
    } catch {
      toast.error("Couldn't send the invitation");
    } finally {
      setSending(false);
    }
  };

  return (
    <ActionModal
      open={open}
      onClose={handleClose}
      title="Add staff member"
      description="They will receive an email invitation to join your team."
      footer={
        <>
          <button type="button" onClick={handleClose} className="btn-ghost-v2">Cancel</button>
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={!emailValid || !roleId || sending || !organizationId}
            className="btn-signal-v2 disabled:opacity-40"
          >
            {sending ? "Sending…" : "Send invite"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@gym.com" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Role</label>
          {rolesLoading ? (
            <p className="text-[12.5px] text-fg-3">Loading roles…</p>
          ) : roles.length === 0 ? (
            <p className="text-[12.5px] text-fg-3">No team roles found. Create roles under Team &amp; roles first.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <button key={r._id} type="button" onClick={() => setRoleId(r._id)} className={`rounded-(--r-full) px-3 py-1.5 text-[12.5px] font-medium transition-colors ${roleId === r._id ? "bg-ink text-bg" : "bg-bg-2 text-fg-2 hover:bg-bg-3 hover:text-ink"}`} style={{ transitionDuration: "var(--motion-fast)" }}>
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ActionModal>
  );
}
