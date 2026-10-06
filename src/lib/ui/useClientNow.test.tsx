import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetClientNowForTests, useClientNow } from "./useClientNow";
import { dayKey } from "./activity";

function Probe() {
  const now = useClientNow();
  return <span data-testid="now">{now ? dayKey(now) : "server"}</span>;
}

describe("useClientNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetClientNowForTests();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is null on the server, so nothing day-based renders there", () => {
    vi.setSystemTime(new Date(2026, 9, 7, 10));
    expect(renderToString(<Probe />)).toContain("server");
  });

  it("gives every caller the same cached Date on the client", () => {
    vi.setSystemTime(new Date(2026, 9, 7, 10));
    const seen: (Date | null)[] = [];
    function Grab() {
      seen.push(useClientNow());
      return null;
    }
    render(
      <>
        <Grab />
        <Grab />
      </>,
    );
    vi.setSystemTime(new Date(2026, 9, 7, 15));
    render(<Grab />);
    expect(seen.every((d) => d === seen[0])).toBe(true);
    expect(dayKey(seen[0]!)).toBe("2026-10-07");
  });

  it("rolls over at local midnight", () => {
    vi.setSystemTime(new Date(2026, 9, 7, 23, 59, 30));
    render(<Probe />);
    expect(screen.getByTestId("now").textContent).toBe("2026-10-07");
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("now").textContent).toBe("2026-10-08");
  });

  it("catches up when a background tab becomes visible on a new day", () => {
    vi.setSystemTime(new Date(2026, 9, 7, 9));
    render(<Probe />);
    // Timers were throttled: the clock moved two days without the midnight timer firing.
    vi.setSystemTime(new Date(2026, 9, 9, 9));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getByTestId("now").textContent).toBe("2026-10-09");
  });
});
