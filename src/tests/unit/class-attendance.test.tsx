import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttendanceControl } from "@/app/dashboard/gym-owner/schedule/[classId]/AttendanceControl";
import { classBookingsService, previousOccurrences } from "@/lib/api/classBookings";
import { apiClient } from "@/lib/api/client";

const started = { attendance_open: true } as const;

describe("AttendanceControl", () => {
  it("offers Attended and No-show to staff once the class has started, none chosen yet", () => {
    render(<AttendanceControl booking={started} canMark busy={false} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Attended" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "No-show" })).toHaveAttribute("aria-pressed", "false");
  });

  it("marks in one tap", async () => {
    const onChange = vi.fn();
    render(<AttendanceControl booking={started} canMark busy={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "No-show" }));
    expect(onChange).toHaveBeenCalledWith("no_show");
  });

  it("shows the chosen state and clears it when tapped again", async () => {
    const onChange = vi.fn();
    render(<AttendanceControl booking={{ ...started, attendance: "attended" }} canMark busy={false} onChange={onChange} />);
    const attended = screen.getByRole("button", { name: "Attended" });
    expect(attended).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(attended);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("changes a mark by tapping the other option", async () => {
    const onChange = vi.fn();
    render(<AttendanceControl booking={{ ...started, attendance: "attended" }} canMark busy={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "No-show" }));
    expect(onChange).toHaveBeenCalledWith("no_show");
  });

  it("disables both options while a save is in flight", () => {
    render(<AttendanceControl booking={started} canMark busy onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Attended" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "No-show" })).toBeDisabled();
  });

  it("shows no buttons before the class has started, only that it has not", () => {
    render(<AttendanceControl booking={{ attendance_open: false }} canMark busy={false} onChange={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Not started")).toBeInTheDocument();
  });

  it("shows only the state, with no buttons, to staff who may not record it", () => {
    render(<AttendanceControl booking={{ ...started, attendance: "no_show" }} canMark={false} busy={false} onChange={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("No-show")).toBeInTheDocument();
  });

  it("says Not recorded, not No-show, when nobody has marked a started class", () => {
    render(<AttendanceControl booking={started} canMark={false} busy={false} onChange={vi.fn()} />);
    expect(screen.getByText("Not recorded")).toBeInTheDocument();
    expect(screen.queryByText("No-show")).not.toBeInTheDocument();
  });
});

describe("classBookingsService.setAttendance", () => {
  it("PUTs the attendance (or null to clear) to the booking's attendance route", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ success: true } as never);
    await classBookingsService.setAttendance("o1", "c1", "b1", "attended");
    expect(put).toHaveBeenCalledWith("/teams/organizations/o1/classes/c1/bookings/b1/attendance", { attendance: "attended" });
    await classBookingsService.setAttendance("o1", "c1", "b1", null);
    expect(put).toHaveBeenLastCalledWith("/teams/organizations/o1/classes/c1/bookings/b1/attendance", { attendance: null });
  });
});

describe("previousOccurrences", () => {
  it("returns earlier dates of the weekday, all before today and newest first", () => {
    const today = new Date().toISOString().slice(0, 10);
    const dates = previousOccurrences(new Date().getDay(), 3);
    expect(dates).toHaveLength(3);
    expect(dates.every((d) => d < today)).toBe(true);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});
