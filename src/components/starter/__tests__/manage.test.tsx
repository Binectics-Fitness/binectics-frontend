import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StarterManage } from "../StarterManage";
import type { StarterProgram } from "@/lib/starter/types";

vi.mock("@/components/Toast", () => ({ toast: vi.fn() }));
const providers = vi.hoisted(() => ({ data: { professionals: [] as unknown[] } }));
vi.mock("@/components/messaging/MyCoachesCard", () => ({ useMyProviders: () => providers }));
const api = vi.hoisted(() => ({ setReminders: vi.fn(), setSharing: vi.fn(), leave: vi.fn(), downloadExport: vi.fn() }));
vi.mock("@/lib/api/starter", async (o) => ({ ...(await o<typeof import("@/lib/api/starter")>()), starterService: api }));

const program: StarterProgram = { id: "p1", name: "Home Start", status: "active", remindersEnabled: false, sharedWithProviderIds: [], progress: null };
const wrap = () => render(<QueryClientProvider client={new QueryClient()}><StarterManage program={program} /></QueryClientProvider>);

beforeEach(() => { vi.clearAllMocks(); providers.data = { professionals: [] }; });

describe("StarterManage", () => {
  it("hides sharing when the member has no coach", () => {
    wrap();
    expect(screen.queryByText("Share with my coach")).toBeNull();
  });
  it("shares with a linked coach by replacing the full list", async () => {
    providers.data = { professionals: [{ professional_id: "c1", first_name: "Ada", last_name: "O", role: "Trainer" }] };
    api.setSharing.mockResolvedValue({ success: true });
    wrap();
    const sw = screen.getByRole("switch", { name: /Share with Ada O/ });
    expect(sw).not.toBeChecked();
    await userEvent.click(sw);
    expect(api.setSharing).toHaveBeenCalledWith("p1", ["c1"]);
  });
  it("reverts the reminder switch when the API refuses", async () => {
    api.setReminders.mockResolvedValue({ success: false, message: "no" });
    wrap();
    const sw = screen.getByRole("switch", { name: /Morning reminder/ });
    await userEvent.click(sw);
    await waitFor(() => expect(sw).not.toBeChecked());
    expect(api.setReminders).toHaveBeenCalledWith("p1", true);
  });
  it("leaves with an optional reason after a confirm step", async () => {
    api.leave.mockResolvedValue({ success: true });
    wrap();
    await userEvent.click(screen.getByRole("button", { name: "Leave program" }));
    expect(api.leave).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("radio", { name: "No time" }));
    await userEvent.click(screen.getByRole("button", { name: "Leave program" }));
    expect(api.leave).toHaveBeenCalledWith("p1", "no_time");
  });
  it("shows an export failure", async () => {
    api.downloadExport.mockResolvedValue({ success: false, status: 429 });
    wrap();
    await userEvent.click(screen.getByRole("button", { name: "Download CSV" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/too many/);
  });
});
