import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Eyebrow } from "@/components/ds/Eyebrow";
import { DSStatCard } from "@/components/ds/DSStatCard";
import { TitleWithEmphasis } from "@/components/ds/TitleWithEmphasis";
import { PageHeader } from "@/components/ds/PageHeader";
import { HeroStatCard } from "@/components/ds/HeroStatCard";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { WeekStrip } from "@/components/ds/WeekStrip";
import { ActivityHeatmap } from "@/components/ds/ActivityHeatmap";
import { ListRow } from "@/components/ds/ListRow";
import { SuccessTakeover } from "@/components/ds/SuccessTakeover";
import { Sparkline } from "@/components/ds/Sparkline";
import { heatmapCells, weekStrip } from "@/lib/ui/activity";

const NOW = new Date(2026, 9, 7, 10, 0, 0); // Wed 7 Oct 2026

describe("Eyebrow", () => {
  it("uses the one spec: mono 11px uppercase .06em, fg-3", () => {
    render(<Eyebrow>Current streak</Eyebrow>);
    const el = screen.getByText("Current streak");
    expect(el.className).toContain("font-mono");
    expect(el.className).toContain("text-[11px]");
    expect(el.className).toContain("uppercase");
    expect(el.className).toContain("tracking-[0.06em]");
    expect(el.style.color).toBe("var(--fg-3)");
  });

  it("has muted and on-ink tones, and keeps the old muted flag working", () => {
    const { rerender } = render(<Eyebrow tone="onInk">x</Eyebrow>);
    expect(screen.getByText("x").style.color).toBe("var(--on-ink-3)");
    rerender(<Eyebrow muted>x</Eyebrow>);
    expect(screen.getByText("x").style.color).toBe("var(--fg-4)");
  });
});

describe("DSStatCard", () => {
  it("puts the label above the value and renders the unit", () => {
    render(<DSStatCard label="Weight" value="73.4" unit="kg" />);
    const label = screen.getByText("Weight");
    const value = screen.getByText("73.4");
    expect(label.compareDocumentPosition(value) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("kg")).toBeInTheDocument();
  });

  it("sizes the value per variant", () => {
    const { container, rerender } = render(<DSStatCard label="L" value="1" size="sm" />);
    const value = () => container.querySelector<HTMLElement>("[data-stat-value]")!;
    expect(value().style.fontSize).toBe("24px");
    rerender(<DSStatCard label="L" value="1" />);
    expect(value().style.fontSize).toBe("28px");
    rerender(<DSStatCard label="L" value="1" size="lg" />);
    expect(value().style.fontSize).toBe("32px");
  });

  it("colours a delta neutrally unless the caller says which way is good", () => {
    const { rerender } = render(<DSStatCard label="Weight" value="73.4" delta="↓ 1.8 · 30d" />);
    expect(screen.getByText("↓ 1.8 · 30d").style.color).toBe("var(--fg-3)");
    rerender(<DSStatCard label="Revenue" value="1" delta="↑ 12%" deltaTone="positive" />);
    expect(screen.getByText("↑ 12%").style.color).toBe("var(--signal-ink)");
    rerender(<DSStatCard label="Revenue" value="1" delta="↓ 4%" deltaTone="negative" />);
    expect(screen.getByText("↓ 4%").style.color).toBe("var(--danger)");
  });

  it("draws a sparkline only from real points", () => {
    const { rerender } = render(<DSStatCard label="Check-ins" value="12" spark={[1, 3, 2]} />);
    expect(screen.getByRole("img", { name: "Check-ins" })).toBeInTheDocument();
    rerender(<DSStatCard label="Check-ins" value="12" spark={[4]} />);
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("TitleWithEmphasis", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders one serif-italic word inside the heading", () => {
    render(<TitleWithEmphasis before="Hey, " emphasis="Tunde" after="." />);
    // textContent, not the accessible name: jsdom's name computation pads
    // inline <em> with spaces ("Hey, Tunde ."), which browsers don't.
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Hey, Tunde.");
    const ems = heading.querySelectorAll("em");
    expect(ems).toHaveLength(1);
    expect(ems[0].textContent).toBe("Tunde");
    expect(ems[0].className).toContain("serif");
    expect(ems[0].className).toContain("italic");
  });

  it("reports a multi-word emphasis in development", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<TitleWithEmphasis emphasis="two words" />);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("must be one word"));
  });
});

describe("PageHeader", () => {
  it("renders eyebrow, a plain H1, subtitle and actions", () => {
    render(
      <PageHeader
        eyebrow="Tuesday · 6 Oct"
        title="Clients"
        subtitle="Everyone you coach"
        actions={<button type="button">Invite</button>}
      />,
    );
    expect(screen.getByText("Tuesday · 6 Oct")).toBeInTheDocument();
    const h1 = screen.getByRole("heading", { level: 1, name: "Clients" });
    expect(h1.querySelector("em")).toBeNull();
    expect(screen.getByText("Everyone you coach")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
  });

  it("takes title parts for the one emphasised word", () => {
    render(<PageHeader title={{ emphasis: "Workout", after: " log" }} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Workout log");
    expect(h1.querySelectorAll("em")).toHaveLength(1);
  });
});

describe("ProgressBar", () => {
  it("exposes progressbar semantics and clamps the value", () => {
    const { container, rerender } = render(
      <ProgressBar value={32} max={50} label="Progress to the 50-day milestone" valueText="32 of 50 days" />,
    );
    const bar = screen.getByRole("progressbar", { name: "Progress to the 50-day milestone" });
    expect(bar).toHaveAttribute("aria-valuenow", "32");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "50");
    expect(bar).toHaveAttribute("aria-valuetext", "32 of 50 days");
    expect(container.querySelector<HTMLElement>("[data-fill]")!.style.width).toBe("64%");
    expect(container.querySelector<HTMLElement>("[data-fill]")!.style.background).toBe("var(--signal)");

    rerender(<ProgressBar value={80} max={50} label="p" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    rerender(<ProgressBar value={-3} label="p" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("uses the raised-ink track on dark surfaces", () => {
    render(<ProgressBar value={1} max={2} label="p" onInk />);
    expect(screen.getByRole("progressbar").style.background).toBe("var(--ink-2)");
  });
});

describe("HeroStatCard", () => {
  it("renders a dark card with value, unit, sub line and an optional bar", () => {
    const { container } = render(
      <HeroStatCard
        eyebrow="Current streak"
        value={32}
        unit="days"
        sub="Started 4 Sep"
        progress={{ value: 32, max: 50, label: "Progress to the 50-day milestone" }}
        footnote="18 days to the 50-day milestone"
      />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.style.background).toBe("var(--ink)");
    expect(card.className).toContain("rounded-[var(--r-3)]");
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByText("days")).toBeInTheDocument();
    expect(screen.getByText("Started 4 Sep").style.color).toBe("var(--on-ink-2)");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "32");
    expect(screen.getByRole("progressbar").style.background).toBe("var(--ink-2)");
  });

  it("draws no bar without a real target, and a raised surface inside a takeover", () => {
    const { container } = render(<HeroStatCard eyebrow="Streak" value={3} surface="raised" />);
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect((container.firstElementChild as HTMLElement).style.background).toBe("var(--ink-2)");
  });
});

describe("WeekStrip", () => {
  it("renders seven labelled chips with their states", () => {
    const days = weekStrip([new Date(2026, 9, 5, 7), new Date(2026, 9, 7, 7)], NOW);
    render(<WeekStrip days={days} label="Check-ins this week" stateLabels={{ done: "checked in", missed: "no check-in" }} />);
    const list = screen.getByRole("list", { name: "Check-ins this week" });
    const items = screen.getAllByRole("listitem");
    expect(list).toContainElement(items[0]);
    expect(items).toHaveLength(7);
    expect(items.map((i) => i.dataset.state)).toEqual([
      "done",
      "missed",
      "done",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(items[0]).toHaveAttribute("aria-label", "Mon 5, checked in");
    expect(items[1]).toHaveAttribute("aria-label", "Tue 6, no check-in");
    expect(items[2]).toHaveAttribute("aria-label", "Wed 7, checked in, today");
    expect(items[2]).toHaveAttribute("aria-current", "date");
    expect(items[0].querySelector("[data-tick]")).not.toBeNull();
    expect(items[3].querySelector("[data-tick]")).toBeNull();
  });

  it("paints today ink when nothing is logged yet", () => {
    render(<WeekStrip days={weekStrip([], NOW)} label="This week" />);
    const today = screen.getAllByRole("listitem")[2];
    expect(today.dataset.state).toBe("today");
    expect(today.style.background).toBe("var(--ink)");
    expect(today).toHaveAttribute("aria-label", "Wed 7, today");
  });
});

describe("ActivityHeatmap", () => {
  it("draws one square per day on the signal ramp with a spoken summary", () => {
    const cells = heatmapCells([new Date(2026, 9, 7, 8), new Date(2026, 9, 7, 18), new Date(2026, 9, 6, 8)], 30, NOW);
    const { container } = render(<ActivityHeatmap cells={cells} noun="check-ins" />);
    expect(screen.getByRole("img", { name: "3 check-ins on 2 of the last 30 days" })).toBeInTheDocument();
    const squares = container.querySelectorAll<HTMLElement>("[data-level]");
    expect(squares).toHaveLength(30);
    expect(squares[29].style.background).toBe("var(--signal-ink)");
    expect(squares[28].style.background).toBe("var(--signal)");
    expect(squares[0].style.background).toBe("var(--bg-2)");
    expect(container.innerHTML).not.toContain("--gym");
    expect(container.querySelectorAll("[data-legend-level]")).toHaveLength(4);
  });

  it("uses the singular for one event and can hide the legend", () => {
    const cells = heatmapCells([new Date(2026, 9, 7, 8)], 7, NOW);
    const { container } = render(<ActivityHeatmap cells={cells} noun="workouts" legend={false} columns={7} />);
    expect(screen.getByRole("img", { name: "1 workout on 1 of the last 7 days" })).toBeInTheDocument();
    expect(container.querySelector("[data-legend-level]")).toBeNull();
  });
});

describe("ListRow", () => {
  it("is a link with a chevron when it has an href", () => {
    const { container } = render(<ListRow title="Upper body" meta="Mon 19 May · Strength" href="/w/1" />);
    const link = screen.getByRole("link", { name: /Upper body/ });
    expect(link).toHaveAttribute("href", "/w/1");
    expect(container.querySelector("[data-chevron]")).not.toBeNull();
  });

  it("is a button when it has onClick", () => {
    const onClick = vi.fn();
    render(<ListRow title="Row" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Row" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is plain with no chevron when it goes nowhere", () => {
    const { container } = render(<ListRow title="Row" meta="meta" trailing={<span>45 min</span>} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector("[data-chevron]")).toBeNull();
    expect(screen.getByText("meta").className).toContain("font-mono");
  });
});

describe("Sparkline", () => {
  it("draws one bar per real point, the latest in ink", () => {
    const { container } = render(<Sparkline values={[2, Number.NaN, 5, 3]} label="Check-ins, 3 weeks" />);
    expect(screen.getByRole("img", { name: "Check-ins, 3 weeks" })).toBeInTheDocument();
    const bars = container.querySelectorAll("[data-bar]");
    expect(bars).toHaveLength(3);
    expect(bars[2].getAttribute("fill")).toBe("var(--ink)");
  });

  it("draws a line variant and nothing for fewer than two points", () => {
    const { container, rerender } = render(<Sparkline values={[1, 2, 3]} label="l" variant="line" />);
    expect(container.querySelector("path")).not.toBeNull();
    rerender(<Sparkline values={[1]} label="l" />);
    expect(container.querySelector("svg")).toBeNull();
  });
});

describe("SuccessTakeover", () => {
  it("is a labelled modal dialog on ink with the status, title and children", () => {
    render(
      <SuccessTakeover
        status="Checked in · 14:42"
        title={{ before: "You're ", emphasis: "in", after: ", Tunde." }}
        subtitle="Iron Lab · welcome back"
        primaryAction={{ label: "Done", href: "/dashboard/member" }}
      >
        <HeroStatCard eyebrow="Streak" value={33} unit="days" surface="raised" />
      </SuccessTakeover>,
    );
    const dialog = screen.getByRole("dialog", { name: /You're in/ });
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("You're in, Tunde.");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("Checked in · 14:42");
    expect(dialog.style.background).toBe("var(--ink)");
    expect(dialog.querySelectorAll("em")).toHaveLength(1);
    expect(screen.getByText("Iron Lab · welcome back")).toBeInTheDocument();
    expect(screen.getByText("33")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Done" })).toHaveAttribute("href", "/dashboard/member");
  });

  it("focuses the primary action, traps Tab, handles Escape and restores focus", () => {
    const outside = document.createElement("button");
    outside.textContent = "outside";
    document.body.appendChild(outside);
    outside.focus();

    const onDone = vi.fn();
    const onDismiss = vi.fn();
    const { unmount } = render(
      <SuccessTakeover
        status="Checked in"
        title={{ emphasis: "In" }}
        primaryAction={{ label: "Done", onClick: onDone }}
        onDismiss={onDismiss}
      />,
    );
    const done = screen.getByRole("button", { name: "Done" });
    expect(document.activeElement).toBe(done);
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(done);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledOnce();

    fireEvent.click(done);
    expect(onDone).toHaveBeenCalledOnce();

    unmount();
    expect(document.activeElement).toBe(outside);
    expect(document.body.style.overflow).toBe("");
    outside.remove();
  });

  it("carries the motion classes that reduced motion collapses to a fade", () => {
    render(
      <SuccessTakeover status="s" title={{ emphasis: "in" }} primaryAction={{ label: "Done", onClick: () => {} }} />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("takeover");
    expect(dialog.querySelector(".takeover-ring")).not.toBeNull();
    expect(dialog.querySelector(".takeover-tick")).not.toBeNull();
  });
});
