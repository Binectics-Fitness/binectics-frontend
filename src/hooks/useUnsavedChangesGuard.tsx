"use client";

import { useCallback, useRef } from "react";
import { useConfirmationModal } from "./useConfirmationModal";

/**
 * Guards accidental modal dismissal from throwing away in-progress form input.
 *
 * A modal form holds its state in local `useState`, so closing unmounts it and
 * the work is gone. This hook wraps the close handler: once the user has typed
 * anything (mark it dirty via `markDirty`, or spread `dirtyProps` on the form
 * container), an accidental close — overlay click, ESC, the X — routes through
 * a "Discard changes?" confirmation instead of closing outright. A clean modal
 * (nothing typed) still closes immediately.
 *
 * Nothing is persisted; declining the prompt simply keeps you in the modal with
 * everything intact.
 *
 * Usage:
 *   const { requestClose, dirtyProps, reset, confirmationModal } =
 *     useUnsavedChangesGuard(onClose);
 *   // route accidental-close paths through requestClose()
 *   // spread dirtyProps onto the panel/form; render {confirmationModal}
 *   // call reset() when the modal (re)opens or after a successful save
 */
export function useUnsavedChangesGuard(
  onClose: () => void,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled !== false;
  const { requestConfirmation, confirmationModal } = useConfirmationModal();
  const dirtyRef = useRef(false);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const reset = useCallback(() => {
    dirtyRef.current = false;
  }, []);

  const requestClose = useCallback(() => {
    if (!enabled || !dirtyRef.current) {
      onClose();
      return;
    }
    requestConfirmation({
      title: "Discard changes?",
      description:
        "You have unsaved changes. If you leave now, they will be lost.",
      confirmLabel: "Discard",
      cancelLabel: "Keep editing",
      confirmVariant: "danger",
      onConfirm: () => {
        dirtyRef.current = false;
        onClose();
      },
    });
  }, [enabled, onClose, requestConfirmation]);

  return {
    /** Route overlay-click / ESC / X here instead of onClose. */
    requestClose,
    /** Call when any field changes (or use dirtyProps). */
    markDirty,
    /** Spread on the form/panel container to auto-detect typing. */
    dirtyProps: { onInput: markDirty, onChange: markDirty },
    /** Clear the dirty flag — call on (re)open and after a successful save. */
    reset,
    /** Render this so the confirmation prompt can appear. */
    confirmationModal,
  };
}
