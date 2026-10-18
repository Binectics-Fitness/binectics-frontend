import { screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/**
 * The app's own confirm dialog (ConfirmationModal via useConfirmationModal),
 * found by its accessible name. Tests use this instead of stubbing
 * `window.confirm`, which product code no longer calls.
 */
export async function findConfirmDialog(title: string | RegExp) {
  return screen.findByRole("dialog", { name: title });
}

/** Open dialog → press its confirm button. Returns the dialog element. */
export async function confirmInDialog(
  user: Pick<UserEvent, "click">,
  title: string | RegExp,
  confirmLabel: string | RegExp,
) {
  const dialog = await findConfirmDialog(title);
  await user.click(within(dialog).getByRole("button", { name: confirmLabel }));
  return dialog;
}
