import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Clock, Droplet, Scale } from "lucide-react";
import { useState } from "react";
import { Chip, ChipGroup } from "@/components/ds/Chip";
import { Toggle } from "@/components/ds/Toggle";
import { SaveCheck } from "@/components/ds/SaveCheck";
import { IconTile } from "@/components/ds/IconTile";
import { ANIMATED_ROWS, useRowEnter } from "@/lib/ui/listMotion";

const fillOf = (el: HTMLElement) => el.style.getPropertyValue("--chip-fill");
const labelOf = (el: HTMLElement) => el.style.getPropertyValue("--chip-label");

describe("Chip", () => {
  it("selected without a category is the ink pill with a paper label", () => {
    render(<Chip label="7 days" selected />);
    const chip = screen.getByRole("button", { name: "7 days" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(chip.dataset.on).toBe("true");
    expect(fillOf(chip)).toBe("var(--ink)");
    expect(labelOf(chip)).toBe("var(--bg)");
    expect(screen.queryByTestId("chip-check")).toBeNull();
  });

  it("selected with a category fills with its accent, ink label and a check", () => {
    render(<Chip label="Water" category="water" icon={Droplet} selected />);
    const chip = screen.getByRole("button", { name: "Water" });
    expect(fillOf(chip)).toBe("var(--water)");
    expect(labelOf(chip)).toBe("var(--ink)");
    expect(chip.dataset.category).toBe("water");
    expect(screen.getByTestId("chip-check")).toBeInTheDocument();
  });

  it("a category chip with no icon still shows the check when selected", () => {
    render(<Chip label="Fasting" category="fast" selected />);
    expect(screen.getByTestId("chip-check")).toBeInTheDocument();
  });

  it("unselected, draws the icon in the category ink and no check", () => {
    render(<Chip label="Fasting" category="fast" icon={Clock} selected={false} />);
    const chip = screen.getByRole("button", { name: "Fasting" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(chip.style.getPropertyValue("--chip-icon")).toBe("var(--fast-ink)");
    expect(screen.queryByTestId("chip-check")).toBeNull();
  });
});

describe("ChipGroup", () => {
  const OPTIONS = [
    { value: "weight", label: "Weight", icon: Scale },
    { value: "fasting", label: "Fasting", category: "fast" as const, icon: Clock },
    { value: "water", label: "Water", category: "water" as const, icon: Droplet },
  ];
  function Harness() {
    const [v, setV] = useState("weight");
    return <ChipGroup label="Which target" options={OPTIONS} value={v} onChange={setV} />;
  }

  it("is a labelled group with one pressed chip", () => {
    render(<Harness />);
    expect(screen.getByRole("group", { name: "Which target" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weight" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Fasting" })).toHaveAttribute("aria-pressed", "false");
  });

  it("moves the one pill to the new chip and takes its category colour", () => {
    render(<Harness />);
    const pill = screen.getByTestId("chip-pill");
    // Measured on mount: the group switches to the sliding pill.
    expect(screen.getByRole("group").dataset.slide).toBe("on");
    expect(pill.style.backgroundColor).toBe("var(--ink)");
    expect(pill.dataset.instant).toBe("true"); // the first placement appears, it does not slide
    fireEvent.click(screen.getByRole("button", { name: "Fasting" }));
    expect(screen.getByRole("button", { name: "Fasting" })).toHaveAttribute("aria-pressed", "true");
    expect(pill.style.backgroundColor).toBe("var(--fast)");
    expect(pill.dataset.instant).toBe("false"); // a change slides
    expect(screen.getAllByTestId("chip-pill")).toHaveLength(1);
  });

  it("hides the pill when nothing is chosen", () => {
    render(<ChipGroup label="Pick" options={OPTIONS} value={null} onChange={vi.fn()} />);
    expect(screen.getByTestId("chip-pill").style.opacity).toBe("0");
  });
});

describe("Toggle", () => {
  it("is a switch that reports and flips its state", () => {
    const onChange = vi.fn();
    render(<Toggle on={false} label="Show the window" onChange={onChange} />);
    const sw = screen.getByRole("switch", { name: "Show the window" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("SaveCheck", () => {
  it("draws one decorative check path", () => {
    render(<SaveCheck />);
    const svg = screen.getByTestId("save-check");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.classList.contains("bx-save-check")).toBe(true);
    expect(svg.querySelectorAll("path")).toHaveLength(1);
  });
});

describe("IconTile with a category tone", () => {
  it("uses the category's soft fill and ink", () => {
    const { container } = render(<IconTile icon={Droplet} tone="water" />);
    const tile = container.firstElementChild as HTMLElement;
    expect(tile.style.background).toBe("var(--water-soft)");
    expect(tile.style.color).toBe("var(--water-ink)");
  });
});

describe("useRowEnter", () => {
  it("never moves the rows present when the list is first shown", () => {
    const { result, rerender } = renderHook(({ keys, ready }) => useRowEnter(keys, ready), {
      initialProps: { keys: [] as string[], ready: false },
    });
    rerender({ keys: ["a", "b"], ready: true });
    expect(result.current("a")).toEqual({});
    expect(result.current("b")).toEqual({});
  });

  it("animates rows that arrive later, first five only, 20ms apart", () => {
    const { result, rerender } = renderHook(({ keys }) => useRowEnter(keys, true), { initialProps: { keys: ["a"] } });
    const fresh = ["n1", "n2", "n3", "n4", "n5", "n6"];
    act(() => rerender({ keys: [...fresh, "a"] }));
    expect(result.current("n1")).toEqual({ className: "bx-row-enter", style: { animationDelay: "0ms" } });
    expect(result.current("n2").style).toEqual({ animationDelay: "20ms" });
    expect(result.current(fresh[ANIMATED_ROWS])).toEqual({});
    expect(result.current("a")).toEqual({});
  });
});
