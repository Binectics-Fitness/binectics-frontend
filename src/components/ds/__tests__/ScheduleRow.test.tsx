import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScheduleGap, ScheduleList, ScheduleRow } from "@/components/ds";
import { contrast } from "@/test/contrast";

describe("ScheduleList", () => {
  it("is a named ordered list", () => {
    render(
      <ScheduleList label="Today's sessions">
        <ScheduleRow time="09:30" title="Ada Obi" />
      </ScheduleList>,
    );
    const list = screen.getByRole("list", { name: "Today's sessions" });
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
  });
});

describe("ScheduleRow", () => {
  it("renders the gutter time, sub-line, title, meta and slots", () => {
    render(
      <ScheduleList label="Sessions">
        <ScheduleRow
          time="09:30"
          timeSub="Thu 8 Oct"
          title="Ada Obi"
          meta="60 min · Strength"
          leading={<span>AO</span>}
          trailing={<span>Confirmed</span>}
        />
      </ScheduleList>,
    );
    for (const text of ["09:30", "Thu 8 Oct", "Ada Obi", "60 min · Strength", "AO", "Confirmed"]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it("is a link only when it has an href", () => {
    const { rerender } = render(
      <ScheduleList label="Sessions">
        <ScheduleRow time="09:30" title="Ada Obi" href="/dashboard/trainer/sessions/s1" />
      </ScheduleList>,
    );
    expect(screen.getByRole("link").getAttribute("href")).toBe("/dashboard/trainer/sessions/s1");
    rerender(
      <ScheduleList label="Sessions">
        <ScheduleRow time="09:30" title="Ada Obi" />
      </ScheduleList>,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("marks a live row with an ink border and a muted row with fg-4 and fg-3 text", () => {
    render(
      <ScheduleList label="Sessions">
        <ScheduleRow time="09:30" title="Live" />
        <ScheduleRow time="13:00" title="Cancelled" muted />
      </ScheduleList>,
    );
    const [live, muted] = screen.getAllByRole("listitem");
    expect(live.hasAttribute("data-muted")).toBe(false);
    expect(muted.hasAttribute("data-muted")).toBe(true);
    expect(screen.getByText("Live").getAttribute("style")).toContain("var(--ink)");
    expect(screen.getByText("Cancelled").getAttribute("style")).toContain("var(--fg-3)");
    expect(live.innerHTML).toContain("3px solid var(--ink)");
    expect(muted.innerHTML).toContain("3px solid var(--fg-4)");
    // The muted card keeps the --bg surface so --fg-3 text stays at AA.
    expect(contrast("fg-3", "bg")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("ScheduleGap", () => {
  it("renders the free-time label as a list item", () => {
    render(
      <ScheduleList label="Sessions">
        <ScheduleGap label="14:00 – 15:30 · 90 min" />
      </ScheduleList>,
    );
    expect(screen.getByRole("listitem").hasAttribute("data-schedule-gap")).toBe(true);
    expect(screen.getByText("14:00 – 15:30 · 90 min")).toBeTruthy();
  });
});
