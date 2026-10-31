import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartProgramControl } from "@/components/content/StartProgramControl";
import { paidContentService } from "@/lib/api/paidContent";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("StartProgramControl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
  });

  it("goes to the new program and turns the controls off after a start", async () => {
    const start = vi.spyOn(paidContentService, "startProgram").mockResolvedValue({ success: true, data: { _id: "inst1" } });
    render(<StartProgramControl programId="p1" title="Base" />);
    await userEvent.click(screen.getByRole("button", { name: "Start today" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/my-programs/inst1"));
    expect(screen.getByRole("button", { name: "Started" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pick a date" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Started" }));
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("stays put and shows the reason when the start fails", async () => {
    vi.spyOn(paidContentService, "startProgram").mockResolvedValue({ success: false, message: "Nope" });
    render(<StartProgramControl programId="p1" title="Base" />);
    await userEvent.click(screen.getByRole("button", { name: "Start today" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nope");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Start today" })).toBeEnabled();
  });
});
