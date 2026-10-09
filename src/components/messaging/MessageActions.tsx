"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Modal from "@/components/Modal";
import { Button } from "@/components/Button";
import { toast } from "@/components/Toast";
import {
  MESSAGE_MAX_LENGTH,
  MessageSide,
  REACTIONS,
  messagingService,
  type ChatMessage,
  type ReactionKey,
  type ReactionSummary,
  type ThreadState,
} from "@/lib/api/messaging";
import type { ApiResponse } from "@/lib/types";
import type { MessageDecorations } from "./Transcript";
import type { ReplyTarget, ThreadSync } from "./useThreadSync";

/**
 * Message actions (owner ruling 2): Reply, Copy, Edit, Delete and React,
 * reachable by mouse (hover button, right click), keyboard (focus a message
 * with the arrow keys, then Enter or Shift+F10) and touch (the button stays
 * visible at narrow widths). Every capability comes from the server
 * (`can_reply`, `can_react`, `editable_until`, `can_delete`); edits and
 * deletes wait for the server, reactions are optimistic with rollback.
 */

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

/** A menu that takes focus, moves with the arrow keys and gives focus back on close. */
export function ActionMenu({
  label,
  onClose,
  children,
  align,
  returnFocusTo,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  align: "start" | "end";
  /** Where focus goes back to when the menu closes (the trigger or the message). */
  returnFocusTo: () => HTMLElement | null;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const first = ref.current?.querySelector<HTMLElement>("[role^=menuitem]:not([disabled])");
    first?.focus();
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [onClose]);

  const close = (restore = true) => {
    onClose();
    if (restore) requestAnimationFrame(() => returnFocusTo()?.focus());
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = [...(ref.current?.querySelectorAll<HTMLElement>("[role^=menuitem]:not([disabled])") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      e.preventDefault();
      items[(to + items.length) % items.length]?.focus();
    };
    if (e.key === "ArrowDown" || e.key === "ArrowRight") move(i + 1);
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") move(i - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(items.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") close(false);
  };

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`absolute top-full z-30 mt-1 min-w-[200px] rounded-(--r-3) border border-border bg-bg p-1 ${align === "end" ? "right-0" : "left-0"}`}
      style={{ boxShadow: "var(--shadow-2)" }}
    >
      {children}
    </div>
  );
}

export function MenuItem({
  children,
  onSelect,
  danger,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={onSelect}
      className={`flex min-h-10 w-full items-center rounded-(--r-2) px-3 py-2 text-left text-[14px] font-medium outline-none focus-visible:bg-bg-2 ${
        danger ? "text-danger hover:bg-danger-soft focus-visible:bg-danger-soft" : "text-ink hover:bg-bg-2"
      }`}
    >
      {children}
    </button>
  );
}

/** Apply a reaction toggle locally, before the server answers. */
export function toggleReaction(m: ChatMessage, key: ReactionKey, on: boolean): ChatMessage {
  const existing = m.reactions.find((r) => r.key === key);
  const others = m.reactions.filter((r) => r.key !== key);
  let next: ReactionSummary | null;
  if (on) {
    next = existing
      ? existing.mine
        ? existing
        : { ...existing, count: existing.count + 1, mine: true }
      : { key, emoji: REACTIONS.find((r) => r.key === key)!.emoji, count: 1, mine: true };
  } else {
    next = existing && existing.mine ? { ...existing, count: existing.count - 1, mine: false } : (existing ?? null);
  }
  const all = [...others, ...(next && next.count > 0 ? [next] : [])];
  const order = REACTIONS.map((r) => r.key);
  return { ...m, reactions: all.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)) };
}

function failureMessage(res: ApiResponse<unknown>, fallback: string): string {
  switch (res.code) {
    case "MESSAGING_EDIT_WINDOW_CLOSED":
      return "Messages can only be edited for 15 minutes after sending.";
    case "MESSAGING_MESSAGE_DELETED":
      return "That message was deleted.";
    case "MESSAGING_BLOCKED":
      return "You can't send messages in this conversation.";
    case "MESSAGING_RELATIONSHIP_ENDED":
      return "This conversation has ended.";
    default:
      return res.status === 429 ? "Too many changes at once. Try again in a moment." : fallback;
  }
}

function InlineEditor({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: string;
  busy: boolean;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  const trimmed = text.trim();
  const valid = trimmed.length > 0 && text.length <= MESSAGE_MAX_LENGTH;
  return (
    <div className="flex w-[min(28rem,70vw)] flex-col gap-2">
      <textarea
        ref={ref}
        value={text}
        rows={3}
        aria-label="Edit message"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          } else if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault();
            if (valid && !busy) onSave(trimmed);
          }
        }}
        className="w-full resize-y rounded-(--r-2) px-2.5 py-2 text-[14px] leading-normal outline-none"
        style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)" }}
      />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost-v2 sm" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn-primary-v2 sm" disabled={!valid || busy} onClick={() => onSave(trimmed)}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export function useMessageActions({
  threadId,
  sync,
  state,
  isBroadcast,
  onReply,
}: {
  threadId: string;
  sync: ThreadSync;
  state: ThreadState;
  isBroadcast: boolean;
  onReply: (target: ReplyTarget) => void;
}) {
  const [menu, setMenu] = useState<{ id: string; openedAt: number; origin: HTMLElement | null } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ message: ChatMessage; origin: HTMLElement | null } | null>(null);

  const canReact = state.can_react && !isBroadcast;

  const itemsFor = (m: ChatMessage, at: number) => {
    const deleted = Boolean(m.deleted_at);
    return {
      react: canReact && !deleted,
      reply: state.can_reply && !deleted,
      copy: !deleted && m.body.length > 0,
      edit: !deleted && m.side === MessageSide.MINE && m.editable_until !== null && Date.parse(m.editable_until) > at,
      remove: m.can_delete && !deleted,
    };
  };
  const hasAny = (m: ChatMessage) => Object.values(itemsFor(m, 0)).some(Boolean);

  const open = (m: ChatMessage, origin: HTMLElement | null) => setMenu({ id: m._id, openedAt: Date.now(), origin });
  const closeMenu = () => setMenu(null);

  const react = async (m: ChatMessage, key: ReactionKey) => {
    const on = !m.reactions.find((r) => r.key === key)?.mine;
    sync.applyMessage(toggleReaction(m, key, on));
    const res = on
      ? await messagingService.addReaction(threadId, m._id, key)
      : await messagingService.removeReaction(threadId, m._id, key);
    if (res.success && res.data) {
      sync.applyMessage(res.data);
    } else {
      sync.applyMessage(m);
      toast.error(failureMessage(res, "Couldn't update the reaction."));
    }
  };

  const copy = async (m: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(m.body);
      toast.success("Copied.");
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };

  const saveEdit = async (m: ChatMessage, body: string) => {
    if (body === m.body) {
      setEditing(null);
      return;
    }
    setBusy(m._id);
    const res = await messagingService.editMessage(threadId, m._id, body);
    setBusy(null);
    if (res.success && res.data) {
      sync.applyMessage(res.data);
      setEditing(null);
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-message-id="${m._id}"]`)?.focus());
    } else {
      toast.error(failureMessage(res, "Couldn't save your edit."));
      if (res.code === "MESSAGING_EDIT_WINDOW_CLOSED" || res.code === "MESSAGING_MESSAGE_DELETED") setEditing(null);
    }
  };

  const remove = async (m: ChatMessage) => {
    setBusy(m._id);
    const res = await messagingService.deleteMessage(threadId, m._id);
    setBusy(null);
    if (res.success && res.data) {
      sync.applyMessage(res.data);
      toast.success("Message deleted.");
    } else {
      toast.error(failureMessage(res, "Couldn't delete the message."));
    }
  };

  const decorate = (m: ChatMessage): MessageDecorations => {
    const mine = m.side === MessageSide.MINE;
    const actionable = hasAny(m);
    const menuOpen = menu?.id === m._id;
    const items = menuOpen ? itemsFor(m, menu.openedAt) : null;

    const openFromKeyboard = (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!actionable) return;
      if (e.key === "Enter" || e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
        e.preventDefault();
        open(m, e.currentTarget);
      }
    };

    const actions = actionable ? (
      <div className="relative self-start">
        <button
          type="button"
          aria-label={`Actions for ${mine ? "your" : `${m.author.name}'s`} message`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(e) => (menuOpen ? closeMenu() : open(m, e.currentTarget))}
          className={`flex h-8 w-8 items-center justify-center rounded-(--r-2) transition-opacity hover:bg-bg-2 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 ${menuOpen ? "md:opacity-100" : ""}`}
          style={{ color: "var(--fg-3)" }}
        >
          <MoreIcon />
        </button>
        {menuOpen && items && (
          <ActionMenu label="Message actions" onClose={closeMenu} align={mine ? "end" : "start"} returnFocusTo={() => menu.origin}>
            {items.react && (
              <div className="mb-1 flex gap-0.5 border-b border-border px-1 pb-1" role="group" aria-label="React">
                {REACTIONS.map((r) => {
                  const on = Boolean(m.reactions.find((x) => x.key === r.key)?.mine);
                  return (
                    <button
                      key={r.key}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={on}
                      aria-label={r.label}
                      tabIndex={-1}
                      onClick={() => {
                        closeMenu();
                        void react(m, r.key);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-(--r-2) text-[18px] outline-none hover:bg-bg-2 focus-visible:bg-bg-2"
                      style={{ background: on ? "var(--bg-3)" : undefined }}
                    >
                      <span aria-hidden="true">{r.emoji}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {items.reply && (
              <MenuItem
                onSelect={() => {
                  closeMenu();
                  onReply({ message_id: m._id, author_name: mine ? "You" : m.author.name, excerpt: m.body.slice(0, 140) });
                }}
              >
                Reply
              </MenuItem>
            )}
            {items.copy && (
              <MenuItem
                onSelect={() => {
                  closeMenu();
                  void copy(m);
                }}
              >
                Copy text
              </MenuItem>
            )}
            {items.edit && (
              <MenuItem
                onSelect={() => {
                  closeMenu();
                  setEditing(m._id);
                }}
              >
                Edit
              </MenuItem>
            )}
            {items.remove && (
              <MenuItem
                danger
                onSelect={() => {
                  const origin = menu.origin;
                  closeMenu();
                  setConfirmDelete({ message: m, origin });
                }}
              >
                Delete
              </MenuItem>
            )}
          </ActionMenu>
        )}
      </div>
    ) : undefined;

    const reactions =
      m.reactions.length > 0 && !m.deleted_at ? (
        <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : ""}`}>
          {m.reactions.map((r) => {
            const label = REACTIONS.find((x) => x.key === r.key)?.label ?? r.key;
            const description = `${label}, ${r.count}${r.mine ? ", including you" : ""}`;
            return canReact ? (
              <button
                key={r.key}
                type="button"
                aria-pressed={r.mine}
                aria-label={`${description}. ${r.mine ? "Remove your reaction" : "Add your reaction"}`}
                onClick={() => void react(m, r.key)}
                className="flex min-h-7 items-center gap-1 rounded-full px-2 text-[13px] tabular-nums"
                style={{
                  border: `1px solid ${r.mine ? "var(--ink)" : "var(--border)"}`,
                  background: r.mine ? "var(--bg-3)" : "var(--bg)",
                  color: "var(--ink)",
                }}
              >
                <span aria-hidden="true">{r.emoji}</span>
                <span aria-hidden="true">{r.count}</span>
              </button>
            ) : (
              <span
                key={r.key}
                role="img"
                aria-label={description}
                className="flex min-h-7 items-center gap-1 rounded-full px-2 text-[13px] tabular-nums"
                style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
              >
                <span aria-hidden="true">{r.emoji}</span>
                <span aria-hidden="true">{r.count}</span>
              </span>
            );
          })}
        </div>
      ) : undefined;

    return {
      actions,
      reactions,
      editor:
        editing === m._id ? (
          <InlineEditor
            initial={m.body}
            busy={busy === m._id}
            onSave={(text) => void saveEdit(m, text)}
            onCancel={() => {
              setEditing(null);
              requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-message-id="${m._id}"]`)?.focus());
            }}
          />
        ) : undefined,
      bubbleProps: {
        "data-message-id": m._id,
        tabIndex: -1,
        "aria-haspopup": actionable ? "menu" : undefined,
        onKeyDown: openFromKeyboard,
        onContextMenu: actionable
          ? (e) => {
              e.preventDefault();
              open(m, e.currentTarget as HTMLElement);
            }
          : undefined,
      },
    };
  };

  const overlay = (
    <Modal
      open={confirmDelete !== null}
      onClose={() => {
        const origin = confirmDelete?.origin;
        setConfirmDelete(null);
        requestAnimationFrame(() => origin?.focus());
      }}
      title="Delete message?"
      size="sm"
      disableCloseGuard
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost-v2 sm" onClick={() => setConfirmDelete(null)}>
            Cancel
          </button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={busy !== null}
            onClick={() => {
              const target = confirmDelete;
              setConfirmDelete(null);
              if (target) void remove(target.message);
            }}
          >
            Delete for everyone
          </Button>
        </div>
      }
    >
      <p className="text-[14px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
        It will be replaced with &ldquo;Message deleted&rdquo; for everyone in this conversation. This can&rsquo;t be undone.
      </p>
    </Modal>
  );

  return { decorate, overlay };
}
