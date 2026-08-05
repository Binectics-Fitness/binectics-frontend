import { describe, it, expect } from "vitest";
import { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MoneyInput } from "@/components/ds/MoneyInput";

/** A controlled host, exactly how the real callers use the component. */
function Host({ currency = "NGN" }: { currency?: string }) {
  const [display, setDisplay] = useState("");
  const [minor, setMinor] = useState<number | null>(null);
  return (
    <>
      <MoneyInput
        aria-label="Price"
        value={display}
        currency={currency}
        onChange={(next, nextMinor) => {
          setDisplay(next);
          setMinor(nextMinor);
        }}
      />
      <output data-testid="minor">{minor === null ? "null" : String(minor)}</output>
    </>
  );
}

/**
 * The same host plus a piece of state the money field knows nothing about —
 * ConsultationAvailabilityManager has several (fetch resolution, the save
 * message, isSavingSession) and every one of them re-renders this component
 * while it is focused.
 */
function HostWithNoise() {
  const [display, setDisplay] = useState("");
  const [tick, setTick] = useState(0);
  return (
    <>
      <MoneyInput
        aria-label="Price"
        value={display}
        currency="NGN"
        onChange={(next) => setDisplay(next)}
      />
      <button type="button" onClick={() => setTick((t) => t + 1)}>
        unrelated
      </button>
      <output data-testid="tick">{tick}</output>
    </>
  );
}

const field = () => screen.getByLabelText("Price") as HTMLInputElement;

describe("<MoneyInput>", () => {
  it("formats while typing and reports minor units", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.type(field(), "60000");
    expect(field().value).toBe("₦60,000");
    expect(screen.getByTestId("minor").textContent).toBe("6000000");
  });

  it("stays empty when everything is deleted", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.type(field(), "500");
    await user.clear(field());
    expect(field().value).toBe("");
    expect(screen.getByTestId("minor").textContent).toBe("null");
  });

  it("ignores letters instead of leaving them in the field", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.type(field(), "12a3");
    expect(field().value).toBe("₦123");
  });

  it("accepts a paste of an already-formatted amount", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.click(field());
    await user.paste("₦120,000");
    expect(field().value).toBe("₦120,000");
    expect(screen.getByTestId("minor").textContent).toBe("12000000");
  });

  it("does not accept a minus sign for a price", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.type(field(), "-500");
    expect(field().value).toBe("₦500");
  });

  it("keeps the caret where the user typed, mid-string", async () => {
    const user = userEvent.setup();
    render(<Host />);
    const input = field();
    await user.type(input, "1234");
    expect(input.value).toBe("₦1,234");

    // Put the caret between "1" and "2" (index 2: "₦", "1", |).
    input.setSelectionRange(2, 2);
    await user.keyboard("9");
    expect(input.value).toBe("₦19,234");
    // Caret must sit right after the "9" — index 3 — not at the end (7),
    // even though the reformat shifted the grouping separator right.
    expect(input.selectionStart).toBe(3);

    // And typing again continues from there rather than from the tail.
    await user.keyboard("8");
    expect(input.value).toBe("₦198,234");
    expect(input.selectionStart).toBe(4);
  });

  it("keeps the caret put when a keystroke is REJECTED mid-string", async () => {
    // The reformat reproduces the string already in state, so React bails out
    // of re-rendering and then runs its controlled-input restore, which
    // assigns `.value` and collapses the selection to the end. The component
    // writes the DOM value itself to leave that restore nothing to do.
    // Without that write the caret lands at 6 instead of 2.
    const user = userEvent.setup();
    render(<Host />);
    const input = field();
    await user.type(input, "1234");
    input.setSelectionRange(2, 2);

    // NGN takes no decimal point, so this keystroke is refused.
    await user.keyboard(".");
    expect(input.value).toBe("₦1,234");
    expect(input.selectionStart).toBe(2);

    // Same for a letter.
    await user.keyboard("a");
    expect(input.value).toBe("₦1,234");
    expect(input.selectionStart).toBe(2);

    // Typing a real digit still goes in where the caret was left.
    await user.keyboard("9");
    expect(input.value).toBe("₦19,234");
  });

  it("does not replay an old caret on an unrelated re-render", async () => {
    const user = userEvent.setup();
    render(<HostWithNoise />);
    const input = field();
    await user.type(input, "12");
    // A rejected keystroke: no re-render, so nothing clears a pending caret.
    await user.keyboard(".");
    expect(input.value).toBe("₦12");

    // The user moves the caret themselves — no keystroke involved.
    input.setSelectionRange(2, 2);

    // The parent re-renders for a reason of its own (a fetch resolving, a save
    // message) while the field is still focused. A raw click leaves focus
    // where it is, which is the point: previously the caret snapped back to 3.
    await act(async () => {
      screen.getByRole("button").click();
    });
    expect(document.activeElement).toBe(input);
    expect(screen.getByTestId("tick").textContent).toBe("1");
    expect(input.selectionStart).toBe(2);
  });

  it("backspacing over a grouping separator deletes the digit before it", async () => {
    const user = userEvent.setup();
    render(<Host />);
    const input = field();
    await user.type(input, "1234");
    // Caret between "," and "2" — the separator is to its left.
    input.setSelectionRange(3, 3);
    await user.keyboard("{Backspace}");
    expect(input.value).toBe("₦234");
    expect(input.selectionStart).toBe(1);
  });

  it("backspacing the decimal point merges the fraction, losing no digit", async () => {
    const user = userEvent.setup();
    render(<Host currency="USD" />);
    const input = field();
    await user.type(input, "1234.56");
    expect(input.value).toBe("$1,234.56");

    //  $ 1 , 2 3 4 . 5 6
    //  0 1 2 3 4 5 6 7 8
    // Caret just right of the "." — the character the user is aiming at.
    input.setSelectionRange(7, 7);
    await user.keyboard("{Backspace}");
    // Every digit survives; only the point is gone. This used to give
    // "$123.56" — the "4" eaten and the "." left standing.
    expect(input.value).toBe("$123,456");
    expect(screen.getByTestId("minor").textContent).toBe("12345600");
    // The caret stays where the point was, between the "4" and the "5".
    expect(input.selectionStart).toBe(6);
  });

  it("forward-deleting the decimal point does the same", async () => {
    const user = userEvent.setup();
    render(<Host currency="USD" />);
    const input = field();
    await user.type(input, "1234.56");
    // Caret just left of the "."
    input.setSelectionRange(6, 6);
    await user.keyboard("{Delete}");
    expect(input.value).toBe("$123,456");
  });

  it("allows decimals only for currencies that have them", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Host currency="USD" />);
    await user.type(field(), "12.34");
    expect(field().value).toBe("$12.34");
    expect(screen.getByTestId("minor").textContent).toBe("1234");
    unmount();

    render(<Host currency="NGN" />);
    await user.type(field(), "12.34");
    expect(field().value).toBe("₦1,234");
  });

  it("refuses digits past the width its minor value can carry", async () => {
    const user = userEvent.setup();
    render(<Host />);
    const input = field();
    await user.type(input, "1".repeat(20));
    expect(input.value).toBe("₦1,111,111,111,111");
    const minor = Number(screen.getByTestId("minor").textContent);
    expect(Number.isSafeInteger(minor)).toBe(true);
    expect(minor).toBe(111_111_111_111_100);
  });
});
