"use client";

import { useId, useState } from "react";
import Modal from "@/components/Modal";
import {
  progressService,
  type AddClientResponse,
} from "@/lib/api/progress";

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InviteClientResult {
  email: string;
  action: AddClientResponse["action"];
}

interface InviteClientModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after the API accepted the invite; the modal closes itself. */
  onInvited: (result: InviteClientResult) => void;
}

/**
 * Invite one client by email (POST /progress/add-client). The API decides
 * what happens: someone already on Binectics gets a request to approve you,
 * anyone else gets a sign-up invite. The shared Modal guards against losing
 * typed input on an accidental close.
 */
export function InviteClientModal({ open, onClose, onInvited }: InviteClientModalProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEmail("");
    setFirstName("");
    setMessage("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await progressService.addClient({
      email: trimmed,
      ...(firstName.trim() ? { first_name: firstName.trim() } : {}),
      ...(message.trim() ? { message: message.trim() } : {}),
    });
    setSubmitting(false);
    if (!res.success || !res.data) {
      setError(res.message ?? "We couldn't send that invite. Try again.");
      return;
    }
    const result = { email: trimmed, action: res.data.action };
    reset();
    onInvited(result);
    onClose();
  };

  const label = (text: string, forId: string, required = false) => (
    <label
      htmlFor={forId}
      className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
      style={{ color: "var(--fg-3)" }}
    >
      {text} {required && <span style={{ color: "var(--danger)" }}>*</span>}
    </label>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite a client"
      footer={
        <>
          <button type="button" className="btn-ghost-v2 md" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form={id("form")} className="btn-primary-v2 md" disabled={submitting}>
            {submitting ? "Sending…" : "Send invite"}
          </button>
        </>
      }
    >
      <p className="mb-4 text-[13.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
        If they already use Binectics, they get a request to approve you. If not, we email them an invite to sign
        up, and they join your clients when they do.
      </p>
      <form id={id("form")} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          {label("Email", id("email"), true)}
          <input
            id={id("email")}
            type="email"
            required
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@example.com"
            className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
            style={fieldStyle}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {label("First name", id("first"))}
          <input
            id={id("first")}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={100}
            placeholder="Optional"
            aria-describedby={id("first-help")}
            className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
            style={fieldStyle}
          />
          <span id={id("first-help")} className="text-[12px]" style={{ color: "var(--fg-3)" }}>
            Used to greet them in the sign-up email.
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {label("Message", id("message"))}
          <textarea
            id={id("message")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Optional, e.g. Great meeting you at the gym today."
            aria-describedby={id("message-help")}
            className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-none"
            style={fieldStyle}
          />
          <span id={id("message-help")} className="text-[12px]" style={{ color: "var(--fg-3)" }}>
            Shown with your request if they already have an account.
          </span>
        </div>
        {error && (
          <p role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
