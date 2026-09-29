import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createOrganization = vi.fn();
const refreshOrganizations = vi.fn();
const setCurrentOrg = vi.fn();
const push = vi.fn();
const toastSuccess = vi.fn();
let organizations: unknown[] = [];
let currentOrg: unknown = null;

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/lib/api/teams", () => ({ teamsService: { createOrganization: (d: unknown) => createOrganization(d) } }));
vi.mock("@/components/Toast", () => ({ toast: { success: (...a: unknown[]) => toastSuccess(...a), error: vi.fn() } }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: "GYM_OWNER", first_name: "Ada", last_name: "Obi" } }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ organizations, currentOrg, refreshOrganizations, setCurrentOrg, isLoading: false }),
}));

import { CoachingSection } from "@/app/dashboard/gym-owner/settings/CoachingSection";

const gym = { _id: "gym", owner_id: "u1", name: "Iron House", account_type: "gym_owner", is_active: true };
const coaching = { _id: "coach", owner_id: "u1", name: "Ada Obi Coaching", account_type: "personal_trainer", is_active: true };

describe("CoachingSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    organizations = [gym];
    currentOrg = gym;
    refreshOrganizations.mockResolvedValue(undefined);
  });

  it("starts a trainer workspace with an editable name, and leaves the gym current", async () => {
    createOrganization.mockResolvedValue({ success: true, data: { ...coaching, name: "Ada PT" } });
    render(<CoachingSection />);
    await userEvent.click(screen.getByRole("button", { name: "Start a trainer workspace" }));
    const input = screen.getByLabelText("Workspace name");
    expect((input as HTMLInputElement).value).toBe("Ada Obi Coaching");
    await userEvent.clear(input);
    await userEvent.type(input, "Ada PT");
    await userEvent.click(screen.getByRole("button", { name: "Start workspace" }));
    await waitFor(() => expect(createOrganization).toHaveBeenCalledWith({ name: "Ada PT", account_type: "personal_trainer" }));
    expect(refreshOrganizations).toHaveBeenCalled();
    expect(setCurrentOrg).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith(
      "Ada PT is ready. Your gym is unchanged.",
      expect.objectContaining({ label: "Open trainer workspace" }),
    );
    const action = toastSuccess.mock.calls[0][1] as { onClick: () => void };
    action.onClick();
    expect(push).toHaveBeenCalledWith("/dashboard/trainer");
  });

  it("shows the API's refusal in the dialog", async () => {
    createOrganization.mockResolvedValue({ success: false, message: "You already run a trainer workspace." });
    render(<CoachingSection />);
    await userEvent.click(screen.getByRole("button", { name: "Start a trainer workspace" }));
    await userEvent.click(screen.getByRole("button", { name: "Start workspace" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("You already run a trainer workspace.");
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("offers to open the trainer workspace once one exists", () => {
    organizations = [gym, coaching];
    render(<CoachingSection />);
    expect(screen.getByRole("link", { name: "Open trainer workspace" })).toHaveAttribute("href", "/dashboard/trainer");
    expect(screen.queryByRole("button", { name: "Start a trainer workspace" })).toBeNull();
  });

  it("is not offered to the gym's staff", () => {
    currentOrg = { ...gym, owner_id: "boss" };
    const { container } = render(<CoachingSection />);
    expect(container).toBeEmptyDOMElement();
  });
});
