import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const getMyOrganizations = vi.fn();
vi.mock("@/lib/api/teams", () => ({ teamsService: { getMyOrganizations: () => getMyOrganizations() } }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, user: { id: "u1", role: "GYM_OWNER" } }),
}));

import { OrganizationProvider, useOrganization } from "@/contexts/OrganizationContext";

// A gym owner who also coaches: the trainer workspace sits first in the list
// the API returns, which is exactly what data[0] used to pick for the gym.
const coaching = { _id: "coach", owner_id: "u1", name: "Ada Coaching", account_type: "personal_trainer", is_active: true };
const gym = { _id: "gym", owner_id: "u1", name: "Iron House", account_type: "gym_owner", is_active: true };

function Probe() {
  const ctx = useOrganization();
  return (
    <>
      <div data-testid="current">{ctx.isLoading ? "loading" : (ctx.currentOrg?._id ?? "none")}</div>
      <button type="button" onClick={() => ctx.selectOrgForDashboard("gym")}>gym</button>
      <button type="button" onClick={() => ctx.selectOrgForDashboard("trainer")}>trainer</button>
    </>
  );
}

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(
    <OrganizationProvider>
      <Probe />
    </OrganizationProvider>,
  );
}

describe("OrganizationContext dashboard selection", () => {
  beforeEach(() => {
    localStorage.clear();
    getMyOrganizations.mockResolvedValue({ success: true, data: [coaching, gym] });
  });

  it("starts the gym dashboard in the gym, never the trainer workspace", async () => {
    localStorage.setItem("currentOrgId", "coach");
    renderAt("/dashboard/gym-owner");
    await waitFor(() => expect(screen.getByTestId("current").textContent).toBe("gym"));
  });

  it("starts the trainer dashboard in the trainer workspace", async () => {
    localStorage.setItem("currentOrgId", "gym");
    renderAt("/dashboard/trainer");
    await waitFor(() => expect(screen.getByTestId("current").textContent).toBe("coach"));
  });

  it("switches explicitly per dashboard, and remembers the choice", async () => {
    renderAt("/dashboard/billing");
    await waitFor(() => expect(screen.getByTestId("current").textContent).not.toBe("loading"));
    // Off the dashboards nothing is chosen for them: the list's first.
    expect(screen.getByTestId("current").textContent).toBe("coach");
    fireEvent.click(screen.getByRole("button", { name: "gym" }));
    expect(screen.getByTestId("current").textContent).toBe("gym");
    expect(localStorage.getItem("currentOrgId")).toBe("gym");
    fireEvent.click(screen.getByRole("button", { name: "trainer" }));
    expect(screen.getByTestId("current").textContent).toBe("coach");
    expect(localStorage.getItem("currentOrgId")).toBe("coach");
  });
});
