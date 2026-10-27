import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { SettingsClient } from "@/app/dashboard/gym-owner/settings/SettingsClient";

const mutateAsync = vi.fn();
let mockOrg: Record<string, unknown> = {};

vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
    <div>
      {actions}
      {children}
    </div>
  ),
  useGymViewer: () => ({ isOwner: true, permissions: [], role: "owner" }),
}));
vi.mock("@/lib/gymStaffNav", async (orig) => ({ ...(await orig<object>()), holds: () => true }));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: { _id: "o1" }, refreshOrganizations: vi.fn() }),
}));
vi.mock("@/lib/queries/teams", async (orig) => ({
  ...(await orig<object>()),
  useOrganizationDetails: () => ({ data: mockOrg, isLoading: false }),
  useUpdateOrganization: () => ({ mutateAsync, isPending: false, isError: false }),
}));
vi.mock("@/lib/queries/utility", () => ({ useCountries: () => ({ data: [] }) }));
vi.mock("@/lib/queries/currencies", () => ({
  useOrgPriceCurrencies: () => ({ data: [], isLoading: false, isError: false, providerHint: "" }),
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/provider/GatewaysSection", () => ({ GatewaysSection: () => null }));
vi.mock("@/components/provider/SetupChecklist", () => ({ ShowSetupChecklist: () => null }));
vi.mock("@/components/activity/ActivityLogPanel", () => ({ ActivityLogSection: () => null, canSeeActivityLog: () => false }));
vi.mock("@/app/dashboard/gym-owner/settings/ClassCancellationPolicyEditor", () => ({ ClassCancellationPolicyEditor: () => null }));
vi.mock("@/app/dashboard/gym-owner/settings/NotificationsSection", () => ({ NotificationsSection: () => null }));
vi.mock("@/app/dashboard/gym-owner/settings/TeamAccessSections", () => ({ RolesSection: () => null }));

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} unobserve() {} });
  mutateAsync.mockReset();
  mutateAsync.mockResolvedValue({ success: true });
  mockOrg = { _id: "o1", name: "Gym" };
});

describe("gym Settings tax section", () => {
  it("asks whether prices include tax with nothing pre-selected and will not save a rate until chosen", async () => {
    render(<SettingsClient />);
    expect(await screen.findByText("Do your prices already include tax?")).toBeInTheDocument();
    expect(screen.getByLabelText("Yes, prices include tax")).not.toBeChecked();
    expect(screen.getByLabelText("No, tax is added on top")).not.toBeChecked();
    await userEvent.type(screen.getByText("Tax rate %").parentElement!.querySelector("input")!, "7.5");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await userEvent.click(screen.getByLabelText("No, tax is added on top"));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ orgId: "o1", data: expect.objectContaining({ tax_rate: 7.5, tax_inclusive: false }) }),
    );
  });

  it("shows a saved value as chosen", async () => {
    mockOrg = { _id: "o1", name: "Gym", tax_rate: 7.5, tax_inclusive: true };
    render(<SettingsClient />);
    expect(await screen.findByLabelText("Yes, prices include tax")).toBeChecked();
  });
});
