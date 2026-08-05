"use client";

import { useLayoutEffect, useRef } from "react";
import { currencyFractionDigits } from "@/lib/constants/regions";
import {
  caretAfterSignificant,
  deleteAcrossSeparator,
  formatMoneyInput,
  parseMoneyMinor,
  significantCount,
  type MoneyInputOptions,
} from "@/lib/money/moneyInput";

/**
 * MoneyInput — a text input that formats money as it is typed.
 *
 * The user sees "₦120,000"; the caller gets both that display string and
 * the value in minor units (kobo/cents) on every change, so nothing
 * downstream has to re-parse a formatted string. Empty stays empty, and
 * minor is null (not 0) whenever the field holds no number — an unset
 * optional price must not be saved as free.
 *
 * Caret handling: the caret is tracked as "how many digits are to my left"
 * rather than as a character index, so inserting a digit mid-string keeps
 * the caret where the user put it even when the reformat adds or removes a
 * grouping separator. Backspace/Delete over a separator or the symbol
 * removes the nearest digit instead of appearing to do nothing.
 * Known limitation: a selection is always collapsed to a caret after a
 * reformat — replacing a selected range leaves the caret after the
 * inserted text (correct), but Shift-selection is not preserved across a
 * keystroke that reformats.
 */
export interface MoneyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type" | "inputMode"
  > {
  /** The formatted display string. Owned by the caller. */
  value: string;
  /**
   * Fired with the reformatted display string and its value in minor units
   * (null when the field is empty or holds no number).
   */
  onChange: (display: string, minor: number | null) => void;
  /** ISO 4217 code. Drives the symbol and whether decimals are accepted. */
  currency: string;
  /** Grouping/decimal style. Defaults to en-US. */
  locale?: string;
  /** Prefix the currency symbol. Default true. */
  showSymbol?: boolean;
  /** Accept negative amounts. Default false — prices never are. */
  allowNegative?: boolean;
}

export function MoneyInput({
  value,
  onChange,
  currency,
  locale,
  showSymbol,
  allowNegative = false,
  ...inputProps
}: MoneyInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const opts: MoneyInputOptions = { currency, locale, showSymbol };

  // Re-assert the caret after React has committed the reformatted value.
  // This effect has no dependency array — it must run after whichever commit
  // carries the new value — so `commit` only ever arms `pendingCaret` for a
  // render that is actually coming (see below). An armed caret left behind
  // would be replayed on the next unrelated parent re-render, yanking the
  // caret back to wherever the last keystroke put it.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && pendingCaret.current !== null && document.activeElement === el) {
      el.setSelectionRange(pendingCaret.current, pendingCaret.current);
    }
    pendingCaret.current = null;
  });

  /**
   * Reformat `raw`, place the caret after `significant` digits, and report
   * up.
   *
   * The DOM value is written imperatively as well as through React because of
   * the rejected keystroke — a letter, a second decimal point — where the
   * reformat reproduces the string already in state. React then has no
   * re-render to do, but it *does* run its controlled-input restore, writing
   * `node.value = props.value` because the DOM still holds the rejected
   * character. Assigning `.value` collapses the selection to the end of the
   * field. Writing the same string here first leaves nothing for the restore
   * to fix, so the caret survives: without it, typing "." in the middle of
   * "₦1,234" throws the caret to the end (index 6 instead of 2).
   */
  const commit = (raw: string, significant: number) => {
    const cleaned = allowNegative ? raw : raw.replace(/-/g, "");
    const display = formatMoneyInput(cleaned, opts);
    const caret = caretAfterSignificant(display, significant, opts);
    const el = ref.current;
    if (el) {
      el.value = display;
      if (document.activeElement === el) el.setSelectionRange(caret, caret);
    }
    // Only arm the effect when a re-render is coming. When `display` equals
    // the current value React bails out, the effect never runs, and the
    // imperative write above has already placed the caret correctly.
    if (display !== value) pendingCaret.current = caret;
    onChange(display, parseMoneyMinor(display, opts));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const caret = e.target.selectionStart ?? raw.length;
    commit(raw, significantCount(raw, caret, opts));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    inputProps.onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key !== "Backspace" && e.key !== "Delete") return;

    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    // Only collapsed carets: a range delete is unambiguous already.
    if (start === null || end === null || start !== end) return;

    const step = deleteAcrossSeparator(
      el.value,
      start,
      e.key === "Backspace" ? "backward" : "forward",
      opts,
    );
    if (!step) return;
    e.preventDefault();
    commit(step.next, step.significant);
  };

  return (
    <input
      {...inputProps}
      ref={ref}
      type="text"
      // Whole-unit currencies (NGN, KES, JPY) get the plain numeric keypad;
      // everything else needs the decimal point.
      inputMode={currencyFractionDigits(currency) > 0 ? "decimal" : "numeric"}
      autoComplete="off"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
}
