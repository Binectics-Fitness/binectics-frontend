import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClientGoalsCell } from "@/components/clients/ClientGoalsCell";
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

describe("ClientGoalsCell", () => {
  it("shows the first two goals and counts the rest", () => {
    render(<ClientGoalsCell goals={["Lose 5kg", "Run 10k", "Sleep 8h"]} />);
    const cell = screen.getByTestId("client-goals");
    expect(cell).toHaveTextContent("Lose 5kg · Run 10k+1");
    expect(cell).toHaveAttribute("title", "Lose 5kg · Run 10k · Sleep 8h");
  });

  it("shows a dash for none, missing or blank goals", () => {
    const { rerender } = render(<ClientGoalsCell goals={undefined} />);
    expect(screen.getByTestId("client-goals")).toHaveTextContent("-");
    rerender(<ClientGoalsCell goals={["  "]} />);
    expect(screen.getByTestId("client-goals")).toHaveTextContent("-");
  });
});

// The list endpoint returns goals on each row; the page shows them.
const row: ClientProfile = {
  _id: "cp1",
  client_id: { _id: "u1", first_name: "Mo", last_name: "Salah", email: "mo@example.com" },
  organization_id: null,
  professional_id: "p1",
  goals: ["Lose 5kg", "Run 10k"],
  starting_weight_kg: 82,
  target_weight_kg: 75,
  is_active: true,
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
};

describe("Clients lists", () => {
  it.each([
    ["trainer", TrainerClientsPage],
    ["dietitian", DietitianClientsPage],
  ])("the %s list shows each client's goals", async (_role, Page) => {
    vi.spyOn(progressService, "getMyClientProfiles").mockResolvedValue({ success: true, data: [row] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Mo Salah")).toBeInTheDocument();
    expect(screen.getByTestId("client-goals")).toHaveTextContent("Lose 5kg · Run 10k");
  });
});
