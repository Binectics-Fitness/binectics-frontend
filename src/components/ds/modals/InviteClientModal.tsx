"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface InviteClientModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteClientModal({ open, onClose }: InviteClientModalProps) {
  const [mode, setMode] = useState<"email" | "link">("email");
  const [emails, setEmails] = useState("");

  const handleInvite = () => {
    const count = emails.split(",").filter((e) => e.trim()).length;
    toast.success(`${count} invitation${count !== 1 ? "s" : ""} sent`);
    setEmails("");
    onClose();
  };

  const handleCopyLink = () => {
    toast.success("Invite link copied to clipboard");
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Invite clients"
      footer={
        mode === "email" ? (
          <>
            <button type="button" onClick={onClose} className="btn-ghost-v2">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInvite}
              disabled={!emails.trim()}
              className="btn-signal-v2 disabled:opacity-40"
            >
              Send invites
            </button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="flex gap-1 rounded-(--r-full) bg-bg-2 p-0.5">
          {(["email", "link"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-(--r-full) py-1.5 text-[12.5px] font-medium capitalize transition-colors ${
                mode === m ? "bg-bg text-ink shadow-sm" : "text-fg-3 hover:text-fg"
              }`}
              style={{ transitionDuration: "var(--motion-fast)" }}
            >
              {m}
            </button>
          ))}
        </div>
        {mode === "email" ? (
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              Email addresses
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="Enter emails separated by commas..."
              rows={4}
              className="w-full resize-none rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
            />
            <p className="mt-1.5 text-[12px] text-fg-4">
              Separate multiple emails with commas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[13.5px] text-fg-2">
              Share this link with clients. Anyone with the link can join your client list.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value="https://binectics.com/invite/abc123"
                className="h-9 flex-1 rounded-(--r-2) border border-border bg-bg-2 px-3 font-mono text-[12.5px] text-fg-2"
              />
              <button type="button" onClick={handleCopyLink} className="btn-primary-v2">
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </ActionModal>
  );
}
