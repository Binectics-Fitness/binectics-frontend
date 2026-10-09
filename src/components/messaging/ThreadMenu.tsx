"use client";

import { useRef, useState } from "react";
import Modal from "@/components/Modal";
import { Button } from "@/components/Button";
import { toast } from "@/components/Toast";
import { useQueryClient } from "@tanstack/react-query";
import { messagingService, type ThreadState } from "@/lib/api/messaging";
import { ActionMenu, MenuItem } from "./MessageActions";
import { messagingKeys, refreshMessaging } from "./queries";
import type { ThreadSync } from "./useThreadSync";

/**
 * Thread header menu (owner ruling 3): mute or unmute notifications for
 * anyone who can read the thread; block or unblock only when the server
 * says this side may (`can_block` / `blocked_by_me`, the read-only provider
 * side of an ended relationship).
 */
export function ThreadMenu({
  threadId,
  userId,
  title,
  state,
  sync,
}: {
  threadId: string;
  userId: string;
  title: string;
  state: ThreadState;
  sync: ThreadSync;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [busy, setBusy] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  const refresh = () => {
    refreshMessaging(queryClient, userId);
    void queryClient.invalidateQueries({ queryKey: messagingKeys.thread(userId, threadId) });
  };

  const toggleMute = async () => {
    setOpen(false);
    const muted = !state.muted;
    const res = await messagingService.setMuted(threadId, muted);
    if (res.success && res.data) {
      sync.patchThreadState({ muted: res.data.muted });
      refresh();
      toast.success(res.data.muted ? "Notifications muted for this conversation." : "Notifications back on.");
    } else {
      toast.error("Couldn't change notifications. Try again.");
    }
  };

  const setBlocked = async (block: boolean) => {
    setBusy(true);
    const res = block ? await messagingService.block(threadId) : await messagingService.unblock(threadId);
    setBusy(false);
    setConfirmBlock(false);
    if (res.success && res.data) {
      const s = res.data;
      sync.patchThreadState({
        can_send: s.can_send,
        read_only_reason: s.read_only_reason,
        can_reply: s.can_reply,
        can_react: s.can_react,
        can_block: s.can_block,
        blocked_by_me: s.blocked_by_me,
      });
      refresh();
      toast.success(block ? `${title} is blocked in this conversation.` : `${title} is unblocked.`);
    } else {
      toast.error(block ? "Couldn't block. Try again." : "Couldn't unblock. Try again.");
    }
    requestAnimationFrame(() => trigger.current?.focus());
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-label="Conversation options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-(--r-2) hover:bg-bg-2"
        style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      {open && (
        <ActionMenu label="Conversation options" align="end" onClose={() => setOpen(false)} returnFocusTo={() => trigger.current}>
          <MenuItem onSelect={() => void toggleMute()}>
            {state.muted ? "Unmute notifications" : "Mute notifications"}
          </MenuItem>
          {state.can_block && (
            <MenuItem
              danger
              onSelect={() => {
                setOpen(false);
                setConfirmBlock(true);
              }}
            >
              Block {title}
            </MenuItem>
          )}
          {state.blocked_by_me && (
            <MenuItem
              onSelect={() => {
                setOpen(false);
                void setBlocked(false);
              }}
            >
              Unblock {title}
            </MenuItem>
          )}
        </ActionMenu>
      )}
      <Modal
        open={confirmBlock}
        onClose={() => {
          setConfirmBlock(false);
          requestAnimationFrame(() => trigger.current?.focus());
        }}
        title={`Block ${title}?`}
        size="sm"
        disableCloseGuard
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost-v2 sm" onClick={() => setConfirmBlock(false)}>
              Cancel
            </button>
            <Button type="button" variant="danger" size="sm" disabled={busy} onClick={() => void setBlocked(true)}>
              Block
            </Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
          They won&rsquo;t be able to send you messages in this conversation. You can unblock them later.
        </p>
      </Modal>
    </div>
  );
}
