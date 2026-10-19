import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TrainerClientsPage from "@/app/dashboard/trainer/clients/page";
import DietitianClientsPage from "@/app/dashboard/dietitian/clients/page";
import { progressService, type ClientProfile } from "@/lib/api/progress";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/ds/TrainerDashboardShell", () => ({
  TrainerDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ds/DietitianDashboardShell", () => ({
  DietitianDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/clients/InviteClientModal", () => ({ InviteClientModal: () => null }));

const row = (id: string, first: string, isActive: boolean): ClientProfile => ({
  _id: id,
  client_id: { _id: `u-${id}`, first_name: first, last_name: "Test", email: `${id}@example.com` },
  organization_id: null,
  professional_id: "p1",
  goals: [],
  is_active: isActive,
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
});

// is_active=false only ever means the coaching link ENDED (coach, client,
// gym or transfer); it can't be reopened. "Paused" said it could. The API
// lists those links only with include_ended=true.
describe("Clients lists: an inactive profile is an ended link, not a pause", () => {
  it.each([
    ["trainer", TrainerClientsPage],
    ["dietitian", DietitianClientsPage],
  ])("the %s list calls it Ended, and filters on it", async (_role, Page) => {
    const list = vi.spyOn(progressService, "getMyClientProfiles").mockResolvedValue({
      success: true,
      data: [row("a", "Ada", true), row("b", "Bola", false)],
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Bola Test")).toBeInTheDocument();
    // The list asks for former clients; the API leaves them out otherwise.
    expect(list).toHaveBeenCalledWith({ includeEnded: true });
    // An ended link opens no profile (the API keeps it closed to the coach).
    expect(screen.getByText("Ada Test").closest("a")).toHaveAttribute("href", expect.stringMatching(/\/clients\/a$/));
    expect(screen.getByText("Bola Test").closest("a")).toBeNull();
    expect(screen.queryByText(/paused/i)).not.toBeInTheDocument();
    expect(screen.getByText("Former clients")).toBeInTheDocument();

    const bolaRow = screen.getByText("Bola Test").closest("tr") ?? screen.getByText("Bola Test").parentElement!;
    expect(within(bolaRow as HTMLElement).getByText("Ended")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Ended/ }));
    expect(screen.getByText("Bola Test")).toBeInTheDocument();
    expect(screen.queryByText("Ada Test")).not.toBeInTheDocument();
  });
});
