"use client";

import { useId, useState } from "react";
import Modal from "@/components/Modal";
import { Button } from "@/components/Button";
import { DSCard } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useCloseOrganization } from "@/lib/queries/orgClosure";
import { closureErrorMessage, confirmationMatches } from "@/lib/orgClosure/closure";

const KEEPS = [
  "Nothing is deleted. Members, payments, purchases and transactions stay exactly as they are.",
  "No money moves. Nothing is refunded, cancelled or paid out because of the close.",
  "You keep read access to your revenue and sales records, and can download them as CSV or JSON from the Closed gyms page.",
];

const STOPS = [
  "Your listings come off the marketplace.",
  "No new bookings, memberships, purchases, enrolments or team invitations are accepted.",
  "Admins, managers and trainers lose access to the gym. Only you can still open it.",
];

/**
 * Settings "Danger zone" for the gym owner: close the gym behind a typed
 * confirmation (the gym's name, or the word CLOSE). Says plainly what happens
 * and what does not. Makes no promise about deletion or about member billing:
 * both are still open decisions.
 */
export function CloseGymSection({ orgId, orgName }: { orgId: string; orgName: string }) {
  const { refreshOrganizations } = useOrganization();
  const closeOrg = useCloseOrganization();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const reasonId = useId();
  const errId = useId();

  const reset = () => {
    setTyped("");
    setReason("");
    setError(null);
  };
  const dismiss = () => {
    if (closeOrg.isPending) return;
    setOpen(false);
    reset();
  };

  const submit = async () => {
    if (!confirmationMatches(typed, orgName)) {
      setError(closureErrorMessage("ORG_CLOSE_CONFIRMATION_MISMATCH", 400));
      return;
    }
    setError(null);
    const res = await closeOrg.mutateAsync({
      orgId,
      confirm: typed.trim(),
      reason: reason.trim() || undefined,
    });
    if (!res.success) {
      setError(closureErrorMessage(res.code, res.status, res.message));
      return;
    }
    toast.success(`${orgName} is closed. Your records stay available to export.`);
    setOpen(false);
    reset();
    // The gym drops out of the workspace list; the shell then sends the owner
    // to the Closed gyms page (or to their other gym).
    await refreshOrganizations();
  };

  return (
    <section id="danger">
      <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>
        Danger zone
      </h2>
      <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
        Close this gym when you are finished with it. You have 30 days to change your mind.
      </p>
      <DSCard className="p-5.5 flex flex-col gap-4" style={{ border: "1px solid var(--danger)" }}>
        <div>
          <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Close {orgName}</div>
          <p className="text-[12.5px] mt-1 max-w-[60ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
            Only you, the owner, can close or reopen the gym.
          </p>
        </div>
        <ClosureFacts />
        <div>
          <Button variant="danger" onClick={() => setOpen(true)}>
            Close gym…
          </Button>
        </div>
      </DSCard>

      <Modal
        open={open}
        onClose={dismiss}
        title={`Close ${orgName}?`}
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-5 py-3.5">
            <Button variant="ghost" onClick={dismiss} disabled={closeOrg.isPending}>
              Keep gym open
            </Button>
            <Button
              variant="danger"
              onClick={() => void submit()}
              isLoading={closeOrg.isPending}
              disabled={!confirmationMatches(typed, orgName) || closeOrg.isPending}
            >
              Close gym
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 p-5">
          <ClosureFacts />
          <div className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className="text-[13px]" style={{ color: "var(--ink)" }}>
              Type <strong>{orgName}</strong> or <strong>CLOSE</strong> to confirm
            </label>
            <input
              id={inputId}
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setError(null);
              }}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errId : undefined}
              className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={reasonId} className="text-[13px]" style={{ color: "var(--ink)" }}>
              Reason (optional)
            </label>
            <textarea
              id={reasonId}
              value={reason}
              maxLength={500}
              rows={2}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }}
            />
          </div>
          {error && (
            <p id={errId} role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>
              {error}
            </p>
          )}
        </div>
      </Modal>
    </section>
  );
}

export function ClosureFacts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="text-[12.5px] font-medium mb-1.5" style={{ color: "var(--ink)" }}>What happens</div>
        <ul className="flex flex-col gap-1.5 list-disc pl-4 text-[12.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
          {STOPS.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
      <div>
        <div className="text-[12.5px] font-medium mb-1.5" style={{ color: "var(--ink)" }}>What does not happen</div>
        <ul className="flex flex-col gap-1.5 list-disc pl-4 text-[12.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
          {KEEPS.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </div>
  );
}
