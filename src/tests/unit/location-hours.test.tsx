import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocationHours } from "@/components/marketplace/LocationHours";
import { publicLocations } from "@/lib/marketplace/listingDisplay";
import { emptyWeek, type WeeklyHours } from "@/lib/marketplace/openingHours";

const lekki: WeeklyHours = {
  ...emptyWeek(),
  mon: [{ open: "05:30", close: "22:00" }],
  tue: [{ open: "05:30", close: "22:00" }],
  sat: [{ open: "07:00", close: "20:00" }],
  sun: [{ open: "08:00", close: "14:00" }],
};

describe("LocationHours on the public profile", () => {
  it("shows open now in the gym's zone and the week on tap, today marked", () => {
    // Mon 23 Nov 2026 20:00 UTC = 21:00 in Lagos but already Tue 09:00 in Auckland.
    render(<LocationHours hours={lekki} closedDates={[{ date: "2026-12-25", note: "Christmas" }]} timeZone="Africa/Lagos" now={new Date("2026-11-23T20:00:00Z")} />);
    const toggle = screen.getByRole("button", { name: /Open now · closes 22:00/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("table")).toBeNull();
    fireEvent.click(toggle);
    const today = screen.getByRole("row", { current: "date" });
    expect(today).toHaveTextContent("Monday05:30–22:00");
    expect(screen.getByRole("row", { name: /Wednesday/ })).toHaveTextContent("Closed");
    expect(screen.getByRole("list", { name: "Closed dates" })).toHaveTextContent("Closed Fri 25 Dec · Christmas");
  });

  it("reads the same instant as the gym's own day elsewhere", () => {
    render(<LocationHours hours={lekki} timeZone="Pacific/Auckland" now={new Date("2026-11-23T20:00:00Z")} />);
    // Tue 09:00 in Auckland.
    expect(screen.getByRole("button", { name: /Open now · closes 22:00/ })).toBeInTheDocument();
  });

  it("says when a closed gym opens", () => {
    render(<LocationHours hours={lekki} timeZone="Africa/Lagos" now={new Date("2026-11-23T21:30:00Z")} />);
    expect(screen.getByRole("button", { name: /Closed · opens 05:30 tomorrow/ })).toBeInTheDocument();
  });
});

describe("publicLocations: hours from the API", () => {
  it("keeps hours, zone and closed dates; an older API has none", () => {
    const [loc] = publicLocations([
      {
        id: "a",
        name: "Lekki",
        time_zone: "Africa/Lagos",
        opening_hours: { mon: [{ open: "05:30", close: "22:00" }] },
        closed_dates: [{ date: "2026-12-25", note: "Christmas" }, { nope: 1 }],
      },
    ]);
    expect(loc.time_zone).toBe("Africa/Lagos");
    expect(loc.opening_hours?.mon).toEqual([{ open: "05:30", close: "22:00" }]);
    expect(loc.opening_hours?.sun).toEqual([]);
    expect(loc.closed_dates).toEqual([{ date: "2026-12-25", note: "Christmas" }]);
    const [old] = publicLocations([{ id: "b", name: "Yaba" }]);
    expect(old.opening_hours).toBeNull();
    expect(old.time_zone).toBeNull();
  });
});
