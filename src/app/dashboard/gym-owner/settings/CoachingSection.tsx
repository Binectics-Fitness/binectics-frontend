"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { teamsService } from "@/lib/api/teams";
import { AccountType } from "@/lib/types";
import { defaultCoachingName, ownedWorkspace } from "@/lib/workspaces";

const TRAINER_DASHBOARD = "/dashboard/trainer";

/**
 * A gym owner who also coaches clients themselves gets a trainer workspace
 * next to the gym, on the same login. The account stays a gym owner; the
 * trainer dashboard admits them because they own a live trainer workspace
 * (useTrainerAccess). Nothing here changes the workspace the gym dashboard
 * is working in.
 */
export function CoachingSection() {
  const router = useRouter();
  const { user } = useAuth();
  const { organizations, currentOrg, refreshOrganizations, isLoading } = useOrganization();
  const existing = ownedWorkspace(organizations, "trainer", user?.id);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Staff of the gym can't: the API refuses a workspace to another team's staff.
  if (!user || !currentOrg || currentOrg.owner_id !== user.id) return null;

  const start = () => {
    setName(defaultCoachingName(user));
    setError(null);
    setOpen(true);
  };

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give your coaching workspace a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await teamsService.createOrganization({
        name: trimmed,
        account_type: AccountType.PERSONAL_TRAINER,
      });
      if (!res.success || !res.data) {
        setError(res.message || "We could not start your trainer workspace. Try again.");
        return;
      }
      await refreshOrganizations();
      setOpen(false);
      toast.success(`${res.data.name} is ready. Your gym is unchanged.`, {
        label: "Open trainer workspace",
        onClick: () => router.push(TRAINER_DASHBOARD),
      });
    } catch {
      setError("We could not start your trainer workspace. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="coaching">
      <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Coach clients yourself</h2>
      <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
        Take on personal clients from a trainer workspace of your own: sessions, packages and programs, kept apart from the gym. Same login, and your gym stays as it is.
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex-1">
          <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
            {existing ? existing.name : "Trainer workspace"}
          </div>
          <div className="text-[12.5px] mt-0.75" style={{ color: "var(--fg-3)" }}>
            {existing
              ? "Switch between Gym and Coaching from the top of the sidebar."
              : "Not started yet."}
          </div>
        </div>
        {existing ? (
          <Link href={TRAINER_DASHBOARD} className="btn-primary-v2 sm">
            Open trainer workspace
          </Link>
        ) : (
          <button type="button" className="btn-primary-v2 sm" onClick={start} disabled={isLoading}>
            Start a trainer workspace
          </button>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Start a trainer workspace"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-ghost-v2 sm" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn-primary-v2 sm" onClick={() => void create()} disabled={saving}>
              {saving ? "Starting..." : "Start workspace"}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="coaching-name" className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
            Workspace name
          </label>
          <input
            id="coaching-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]"
            style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }}
          />
          <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
            Clients see this name. You can change it later.
          </span>
          {error ? (
            <p role="alert" className="text-[12.5px] mt-1" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          ) : null}
        </div>
      </Modal>
    </section>
  );
}
