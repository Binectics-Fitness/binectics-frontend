import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ConnectedClients } from "@/app/dashboard/gym-owner/members/ConnectedClients";
import GymMembersClient from "@/app/dashboard/gym-owner/members/MembersClient";
import { marketplaceService, type OrgConnectedClient } from "@/lib/api/marketplace";
import { providerBillingApi } from "@/lib/api/providerBilling";
import { TeamPermission } from "@/lib/gymStaffNav";

vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/gym-owner/members",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/dashboard/gym-owner/members/PendingOffers", () => ({ PendingOffers: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/import/RecentImports", () => ({ RecentImports: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/_actions", () => ({
  AddMemberButton: () => null,
  ImportMembersButton: () => null,
}));
// The enrol flow itself is InviteClientModal's own subject: here, only that
// it opens filled in for the right person.
vi.mock("@/components/ds/modals/InviteClientModal", () => ({
  InviteClientModal: ({ prefill }: { prefill?: { email?: string; first_name?: string } }) => (
    <div role="dialog" aria-label="Offer a plan">
      {prefill?.first_name} {prefill?.email}
    </div>
  ),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@/components/Toast", () => ({ toast }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "viewer" }, isLoading: false }) }));

type Org = { _id: string; name: string; owner_id: string; my_permissions?: string[] };
const orgState: { currentOrg: Org; isLoading: boolean } = {
  currentOrg: { _id: "o1", name: "Iron Temple", owner_id: "viewer" },
  isLoading: false,
};
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
  useOptionalOrganization: () => orgState,
}));

const asOwner = () => {
  orgState.currentOrg = { _id: "o1", name: "Iron Temple", owner_id: "viewer" };
};
const asStaff = (permissions: string[]) => {
  orgState.currentOrg = { _id: "o1", name: "Iron Temple", owner_id: "someone-else", my_permissions: permissions };
};

const ada: OrgConnectedClient = {
  profile_id: "cp1",
  client: { _id: "u1", first_name: "Ada", last_name: "Obi", email: "ada@example.com" },
  connected_at: "2026-10-12T10:00:00Z",
  accepted_by: { _id: "s1", first_name: "Tunde", last_name: "Bello" },
};
const ben: OrgConnectedClient = {
  profile_id: "cp2",
  client: { _id: "u2", first_name: "Ben", last_name: null, email: "ben@example.com" },
  connected_at: "2026-10-10T10:00:00Z",
  accepted_by: null,
};

const list = vi.spyOn(marketplaceService, "getOrgConnectedClients");
const end = vi.spyOn(marketplaceService, "endOrgConnection");

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  asOwner();
});

describe("gym members: the Connected list", () => {
  it("lists each person with email, when they connected and who accepted them", async () => {
    list.mockResolvedValue({ success: true, data: [ada, ben] });
    wrap(<ConnectedClients orgId="o1" />);
    const items = within(await screen.findByRole("list", { name: "Connected without a membership" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Ada Obi");
    expect(items[0]).toHaveTextContent("ada@example.com");
    expect(items[0]).toHaveTextContent("accepted by Tunde Bello");
    expect(items[0]).toHaveTextContent(/Connected .*2026/);
    // Unknown responder: no "accepted by".
    expect(items[1]).toHaveTextContent("Ben");
    expect(items[1]).not.toHaveTextContent("accepted by");
    expect(screen.getByText("Connected · 2")).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith("o1");
  });

  it("renders nothing when no one is connected, or the read fails", async () => {
    list.mockResolvedValue({ success: true, data: [] });
    const { container, unmount } = wrap(<ConnectedClients orgId="o1" />);
    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    unmount();

    list.mockResolvedValue({ success: false, message: "boom" } as never);
    const failed = wrap(<ConnectedClients orgId="o1" />);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(failed.container).toBeEmptyDOMElement();
  });

  it("staff with marketplace:manage_listing see it; staff without it neither see it nor load it", async () => {
    list.mockResolvedValue({ success: true, data: [ada] });
    asStaff([TeamPermission.MARKETPLACE_MANAGE_LISTING]);
    const allowed = wrap(<ConnectedClients orgId="o1" />);
    expect(await screen.findByText("Ada Obi")).toBeInTheDocument();
    allowed.unmount();

    list.mockClear();
    asStaff([TeamPermission.MARKETPLACE_VIEW_REQUESTS, TeamPermission.MARKETPLACE_RESPOND_REQUESTS]);
    const refused = wrap(<ConnectedClients orgId="o1" />);
    await new Promise((r) => setTimeout(r, 20));
    expect(refused.container).toBeEmptyDOMElement();
    expect(list).not.toHaveBeenCalled();
  });

  it("Offer a plan opens the enrol flow filled in for that person", async () => {
    list.mockResolvedValue({ success: true, data: [ada, ben] });
    wrap(<ConnectedClients orgId="o1" />);
    await userEvent.click(await screen.findByRole("button", { name: "Offer Ben a plan" }));
    expect(screen.getByRole("dialog", { name: "Offer a plan" })).toHaveTextContent("Ben ben@example.com");
  });

  it("Remove asks first, ends the connection, and reloads the list", async () => {
    list.mockResolvedValueOnce({ success: true, data: [ada, ben] }).mockResolvedValue({ success: true, data: [ben] });
    end.mockResolvedValue({ success: true, data: { ended: true } });
    const confirmSpy = vi.spyOn(window, "confirm");
    wrap(<ConnectedClients orgId="o1" />);

    // The in-app confirmation, not a browser dialog.
    await userEvent.click(await screen.findByRole("button", { name: "Remove Ada Obi" }));
    expect(screen.getByRole("heading", { name: "Remove Ada Obi?" })).toBeInTheDocument();
    expect(screen.getByText(/their seat is freed\. They keep their account and history/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("heading", { name: "Remove Ada Obi?" })).toBeNull();
    expect(end).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Remove Ada Obi" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(end).toHaveBeenCalledWith("o1", "cp1"));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Ada Obi removed, their seat is freed");
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Remove Ada Obi?" })).toBeNull());
    await waitFor(() => expect(screen.queryByText("Ada Obi")).toBeNull());
    expect(screen.getByText("Connected · 1")).toBeInTheDocument();
  });

  it("a refused remove says why", async () => {
    list.mockResolvedValue({ success: true, data: [ada] });
    end.mockResolvedValue({ success: false, message: "They hold a membership here." } as never);
    wrap(<ConnectedClients orgId="o1" />);
    await userEvent.click(await screen.findByRole("button", { name: "Remove Ada Obi" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("They hold a membership here."));
    // Still listed: nothing was removed.
    expect(screen.getByText("Ada Obi")).toBeInTheDocument();
  });

  it("sits on the Members page under the members table", async () => {
    vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(providerBillingApi, "getStatus").mockResolvedValue({ success: false } as never);
    list.mockResolvedValue({ success: true, data: [ada] });
    wrap(<GymMembersClient />);
    expect(await screen.findByText("Connected · 1")).toBeInTheDocument();
    expect(await screen.findByTestId("members-empty")).toBeInTheDocument();
  });
});
