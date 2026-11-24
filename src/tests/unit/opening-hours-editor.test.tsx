import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { OpeningHoursEditor } from "@/components/locations/OpeningHoursEditor";

describe("OpeningHoursEditor", () => {
  it("starts as Not set and saves the days switched on", () => {
    const onSave = vi.fn();
    render(<OpeningHoursEditor initialHours={null} initialClosedDates={[]} saving={false} onSave={onSave} />);
    expect(screen.getByText("Not set")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "Open on Monday" }));
    fireEvent.change(screen.getByLabelText("Monday opens"), { target: { value: "05:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Copy to Tue–Fri" }));
    fireEvent.click(screen.getByRole("button", { name: "Save hours" }));
    const saved = onSave.mock.calls[0][0];
    expect(saved.opening_hours.mon).toEqual([{ open: "05:30", close: "22:00" }]);
    expect(saved.opening_hours.fri).toEqual([{ open: "05:30", close: "22:00" }]);
    expect(saved.opening_hours.sat).toEqual([]);
    expect(saved.closed_dates).toEqual([]);
  });

  it("blocks Save while ranges overlap and says why", () => {
    render(
      <OpeningHoursEditor
        initialHours={{ mon: [{ open: "06:00", close: "12:00" }], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }}
        initialClosedDates={[]}
        saving={false}
        onSave={vi.fn()}
      />,
    );
    const monday = screen.getByTestId("hours-day-mon");
    fireEvent.click(within(monday).getByRole("button", { name: "+ Add hours" }));
    const opens = within(monday).getAllByLabelText("Monday opens");
    fireEvent.change(opens[1], { target: { value: "11:00" } });
    expect(within(monday).getByRole("alert")).toHaveTextContent("Time ranges overlap");
    expect(screen.getByRole("button", { name: "Save hours" })).toBeDisabled();
  });

  it("marks a past-midnight close and adds a closed date", () => {
    const onSave = vi.fn();
    render(
      <OpeningHoursEditor
        initialHours={{ mon: [], tue: [], wed: [], thu: [], fri: [{ open: "18:00", close: "01:00" }], sat: [], sun: [] }}
        initialClosedDates={[{ date: "2026-12-25", note: "Christmas" }]}
        saving={false}
        onSave={onSave}
      />,
    );
    expect(within(screen.getByTestId("hours-day-fri")).getByText("Next day")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Closed date"), { target: { value: "2026-12-24" } });
    fireEvent.change(screen.getByLabelText("Reason (optional)"), { target: { value: "Christmas Eve" } });
    fireEvent.click(screen.getByRole("button", { name: "Add date" }));
    fireEvent.click(screen.getByRole("button", { name: "Save hours" }));
    expect(onSave.mock.calls[0][0].closed_dates).toEqual([
      { date: "2026-12-24", note: "Christmas Eve" },
      { date: "2026-12-25", note: "Christmas" },
    ]);
  });

  it("Clear hours saves null; read-only shows no Save", () => {
    const onSave = vi.fn();
    const { unmount } = render(
      <OpeningHoursEditor
        initialHours={{ mon: [{ open: "06:00", close: "22:00" }], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }}
        initialClosedDates={[]}
        saving={false}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear hours" }));
    fireEvent.click(screen.getByRole("button", { name: "Save hours" }));
    expect(onSave.mock.calls[0][0].opening_hours).toBeNull();
    unmount();
    render(<OpeningHoursEditor initialHours={null} initialClosedDates={[]} saving={false} readOnly onSave={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Save hours" })).toBeNull();
  });
});
