import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { render as rtlRender, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClassForm } from "@/app/dashboard/gym-owner/schedule/ClassForm";

// The form reads the gym's locations and team through react-query.
const render = (ui: ReactElement) =>
  rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

/**
 * Class start time is a native time picker, so the 24-hour HH:mm the API
 * wants can't be typed in the wrong shape (phase 5 text audit, W2).
 */
describe("ClassForm: start time", () => {
  it("is a time picker labelled Start time, and submits HH:mm", () => {
    const onSubmit = vi.fn();
    render(<ClassForm saving={false} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Class name"), { target: { value: "Spin" } });
    const start = screen.getByLabelText("Start time");
    expect(start).toHaveAttribute("type", "time");
    fireEvent.change(start, { target: { value: "18:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Save class" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ start_time: "18:30" }));
  });

  it("asks for a start time when it is cleared", () => {
    const onSubmit = vi.fn();
    render(<ClassForm saving={false} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Class name"), { target: { value: "Spin" } });
    fireEvent.change(screen.getByLabelText("Start time"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save class" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Choose a start time.")).toBeInTheDocument();
    expect(screen.queryByText(/HH:mm/)).toBeNull();
  });
});
