import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Composer } from "@/components/messaging/Composer";
import { clearMessagingStorage } from "@/components/messaging/messagingStorage";

// The real picker is exercised in the last test; the rest use a stand-in
// with fixed buttons so the caret logic is tested on its own.
const useReal = { current: false };
vi.mock("@/components/messaging/EmojiPickerPanel", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/components/messaging/EmojiPickerPanel")>();
  return {
    default: (props: { height: number; onPick: (e: string) => void }) =>
      useReal.current ? (
        <real.default {...props} />
      ) : (
        <div>
          <input aria-label="Search emoji" autoFocus />
          {["😀", "👨‍👩‍👧", "🇳🇬"].map((e) => (
            <button key={e} type="button" onClick={() => props.onPick(e)}>
              {e}
            </button>
          ))}
        </div>
      ),
  };
});

const FAMILY = "\u{1F468}‍\u{1F469}‍\u{1F467}";

function setup(initial = "") {
  const onSend = vi.fn();
  const onEscape = vi.fn();
  render(<Composer userId="u1" draftKey={`t-${Math.random()}`} label="Message" onSend={onSend} onEscape={onEscape} />);
  const box = screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement;
  if (initial) fireEvent.change(box, { target: { value: initial } });
  return { box, onSend, onEscape, button: screen.getByRole("button", { name: "Add emoji" }) };
}

afterEach(() => {
  useReal.current = false;
  vi.unstubAllGlobals();
  clearMessagingStorage();
});

describe("Composer emoji picker", () => {
  it("the button opens and closes a labelled picker", async () => {
    const { button } = setup();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    fireEvent.click(button);
    expect(await screen.findByRole("dialog", { name: "Emoji picker" })).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button.getAttribute("aria-controls")).toBe(screen.getByRole("dialog").id);
    fireEvent.click(button);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("inserts at the caret and puts the caret after the emoji, back in the box", async () => {
    const { box, button } = setup("hello world");
    box.focus();
    box.setSelectionRange(5, 5);
    fireEvent.click(button);
    fireEvent.click(await screen.findByRole("button", { name: FAMILY }));
    expect(box.value).toBe(`hello${FAMILY} world`);
    expect(document.activeElement).toBe(box);
    expect(box.selectionStart).toBe(5 + FAMILY.length);
    expect(box.selectionEnd).toBe(5 + FAMILY.length);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("replaces the selection", async () => {
    const { box, button } = setup("see you soon");
    box.setSelectionRange(8, 12);
    fireEvent.click(button);
    fireEvent.click(await screen.findByRole("button", { name: "😀" }));
    expect(box.value).toBe("see you 😀");
    expect(box.selectionStart).toBe(8 + 2);
  });

  it("appends to an empty box and keeps the draft", async () => {
    const { box, button, onSend } = setup();
    fireEvent.click(button);
    fireEvent.click(await screen.findByRole("button", { name: "🇳🇬" }));
    expect(box.value).toBe("🇳🇬");
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("🇳🇬");
  });

  it("Escape closes the picker and returns focus to the box without cancelling the reply", async () => {
    const { box, button, onEscape } = setup("hi");
    fireEvent.click(button);
    const search = await screen.findByRole("textbox", { name: "Search emoji" });
    search.focus();
    fireEvent.keyDown(search, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(box);
    expect(onEscape).not.toHaveBeenCalled();

    // Escape in the box with the picker open closes the picker first.
    fireEvent.click(button);
    await screen.findByRole("dialog");
    fireEvent.keyDown(box, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onEscape).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("a press outside closes it", async () => {
    const { button } = setup();
    fireEvent.click(button);
    await screen.findByRole("dialog");
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("counts an emoji once, as the API does, so 4000 emoji are not 'over the limit'", () => {
    const { box } = setup();
    fireEvent.change(box, { target: { value: "😀".repeat(4000) } });
    expect(screen.getByText("4000 / 4000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });

  it("the real picker loads lazily, is searchable and inserts what you click", async () => {
    useReal.current = true;
    // jsdom has no IntersectionObserver; the picker uses it to render the
    // categories in view. Report everything as in view.
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private cb: (entries: unknown[], observer: unknown) => void) {}
        observe(target: Element) {
          this.cb([{ target, isIntersecting: true, intersectionRatio: 1 }], this);
        }
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      },
    );
    const { box, button } = setup("go ");
    fireEvent.click(button);
    const dialog = await screen.findByRole("dialog", { name: "Emoji picker" });
    const search = await waitFor(() => {
      const el = dialog.querySelector("input");
      expect(el).not.toBeNull();
      return el as HTMLInputElement;
    });
    expect(search.placeholder).toBe("Search emoji");
    expect(dialog.querySelector('button[data-unified="1f600"]')).not.toBeNull();
    await act(async () => {
      fireEvent.change(search, { target: { value: "flexed" } });
    });
    // The search narrows the grid: the grinning face is no longer offered.
    await waitFor(() => {
      const grin = dialog.querySelector<HTMLElement>('button[data-unified="1f600"]');
      expect(grin).toBeNull();
    });
    const muscle = await waitFor(() => {
      const el = dialog.querySelector<HTMLButtonElement>('button[data-unified="1f4aa"]');
      expect(el).not.toBeNull();
      return el as HTMLButtonElement;
    });
    fireEvent.click(muscle);
    await waitFor(() => expect(box.value).toBe("go 💪"));
  });
});
