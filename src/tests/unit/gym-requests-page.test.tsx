import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GymRequestsClient } from "@/app/dashboard/gym-owner/requests/GymRequestsClient";
import { marketplaceService } from "@/lib/api/marketplace";
import { TeamPermission as P } from "@/lib/gymStaffNav";
import {
  MarketplaceRequestStatus as S,
  MarketplaceRequestType,
  type MarketplaceListing,
  type MarketplaceRequest,
} from "@/lib/types";

/**
 * The gym's Requests page (discoverability F23): who sees it, who may
 * answer, and that answers go to the gym's own routes.
 */
let mockSearch = "";
let mockPath = "/dashboard/gym-owner/requests";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => mockPath,
  useSearchParams: () => new URLSearchParams(mockSearch),
}));
let mockUser = { id: "boss", role: "GYM_OWNER", first_name: "Dapo", last_name: "A" };
vi.mock("@/hooks/useTrainerAccess", () => ({
  useProviderAccess: () => ({ user: mockUser, isAuthorized: true, isLoading: false }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, isLoading: false, logout: vi.fn() }),
}));
let mockOrg: Record<string, unknown> = {};
vi.mock("@/contexts/OrganizationContext", () => {
  const value = () => ({ currentOrg: mockOrg, organizations: [mockOrg], isLoading: false, setCurrentOrg: vi.fn() });
  return { useOrganization: value, useOptionalOrganization: value };
});
vi.mock("@/components/messaging/queries", () => ({ useMessagingUnread: () => 0 }));
vi.mock("@/lib/queries/refunds", () => ({ useRefundsAttentionCount: () => 0 }));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const ownerOrg = { _id: "gym1", name: "Iron Temple", owner_id: "boss", is_owner: true, my_permissions: [] };
const staffOrg = (permissions: string[], role = "assistant") => ({
  _id: "gym1",
  name: "Iron Temple",
  owner_id: "boss",
  is_owner: false,
  my_role_code: role,
  my_permissions: permissions,
});
const asStaff = (permissions: string[], role?: string) => {
  mockOrg = staffOrg(permissions, role);
  mockUser = { id: "tobi", role: "USER", first_name: "Tobi", last_name: "B" };
};

const req = (over: Partial<MarketplaceRequest> = {}): MarketplaceRequest => ({
  _id: "r1",
  client_id: { _id: "m1", first_name: "Ngozi", last_name: "Okafor", email: "ngozi@example.com" },
  listing_id: "l1",
  organization_id: "gym1",
  professional_id: "boss",
  type: MarketplaceRequestType.CONNECTION,
  status: S.PENDING,
  message: "I train mornings. Can I join?",
  goals: ["strength"],
  created_at: "2026-10-17T09:00:00Z",
  updated_at: "2026-10-17T09:00:00Z",
  ...over,
});

const listing = { _id: "l1", is_published: true, accepting_clients: true } as unknown as MarketplaceListing;
let pendingRows: MarketplaceRequest[] = [];
let answeredRows: MarketplaceRequest[] = [];

beforeEach(() => {
  vi.restoreAllMocks();
  mockSearch = "";
  mockPath = "/dashboard/gym-owner/requests";
  mockOrg = ownerOrg;
  mockUser = { id: "boss", role: "GYM_OWNER", first_name: "Dapo", last_name: "A" };
  pendingRows = [req()];
  answeredRows = [req({ _id: "r2", status: S.ACCEPTED, response_note: "Welcome", client_id: { _id: "m2", first_name: "Femi", last_name: "Ade", email: "f@example.com" } })];
  vi.spyOn(marketplaceService, "getOrgListingRequests").mockImplementation(async (_org, opts) => ({
    success: true,
    data: { requests: opts?.status === "answered" ? answeredRows : pendingRows, next_cursor: null },
  }));
  vi.spyOn(marketplaceService, "getOrgPendingRequestCount").mockResolvedValue({ success: true, data: { count: pendingRows.length } });
  vi.spyOn(marketplaceService, "getOrgListing").mockResolvedValue({ success: true, data: listing });
  vi.spyOn(marketplaceService, "acceptOrgRequest").mockResolvedValue({ success: true, data: { _id: "p1" } });
  vi.spyOn(marketplaceService, "rejectOrgRequest").mockResolvedValue({ success: true });
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GymRequestsClient />
    </QueryClientProvider>,
  );
}
const card = () => screen.findByRole("article", { name: "Request from Ngozi Okafor" });

describe("the gym's Requests page", () => {
  it("shows the owner who asked, when and what they said, with Accept and Decline", async () => {
    renderPage();
    const c = within(await card());
    expect(c.getByText("ngozi@example.com")).toBeInTheDocument();
    expect(c.getByText("I train mornings. Can I join?")).toBeInTheDocument();
    expect(c.getByRole("button", { name: "Accept" })).toBeEnabled();
    expect(c.getByRole("button", { name: "Decline" })).toBeEnabled();
    expect(screen.getByRole("tab", { name: "Waiting · 1" })).toHaveAttribute("aria-selected", "true");
    expect(marketplaceService.getOrgListingRequests).toHaveBeenCalledWith("gym1", expect.objectContaining({ status: "pending" }));
    // The nav badge is the gym's pending count.
    await waitFor(() => expect(screen.getByRole("link", { name: /Requests/ })).toHaveTextContent("1"));
  });

  it("accepts and declines through the gym's routes, with the note", async () => {
    const user = userEvent.setup();
    renderPage();
    const c = within(await card());
    await user.click(c.getByRole("button", { name: "Add a note" }));
    await user.type(c.getByLabelText("Note to Ngozi"), "See you Monday");
    await user.click(c.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(marketplaceService.acceptOrgRequest).toHaveBeenCalledWith("gym1", "r1", "See you Monday"));

    await user.click(within(await card()).getByRole("button", { name: "Decline" }));
    await waitFor(() => expect(marketplaceService.rejectOrgRequest).toHaveBeenCalledWith("gym1", "r1", "See you Monday"));
  });

  it("shows the API's refusal on the card (a full plan) and keeps the request", async () => {
    vi.mocked(marketplaceService.acceptOrgRequest).mockResolvedValue({ success: false, message: "Your plan allows 10 active members." });
    const user = userEvent.setup();
    renderPage();
    await user.click(within(await card()).getByRole("button", { name: "Accept" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your plan allows 10 active members.");
    expect(await card()).toBeInTheDocument();
  });

  it("lists answered requests on their own tab", async () => {
    const user = userEvent.setup();
    renderPage();
    await card();
    await user.click(screen.getByRole("tab", { name: "Answered" }));
    const panel = within(screen.getByRole("tabpanel"));
    expect(await panel.findByText("Femi Ade")).toBeInTheDocument();
    expect(panel.getByText("Accepted")).toBeInTheDocument();
    expect(panel.getByText("Note sent: Welcome")).toBeInTheDocument();
    expect(marketplaceService.getOrgListingRequests).toHaveBeenCalledWith("gym1", expect.objectContaining({ status: "answered" }));
  });

  it("says when nothing is waiting", async () => {
    pendingRows = [];
    renderPage();
    expect(await screen.findByText("No requests waiting.")).toBeInTheDocument();
  });

  it("tells the owner there is no listing yet, with the way to set it up", async () => {
    vi.mocked(marketplaceService.getOrgListing).mockResolvedValue({ success: false, status: 404 });
    pendingRows = [];
    renderPage();
    expect(await screen.findByText("No listing yet, so no requests")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Set up the listing" })).toHaveAttribute("href", "/dashboard/profile-edit");
  });

  it("staff with view_requests only see the requests but no answer buttons", async () => {
    asStaff([P.MARKETPLACE_VIEW_REQUESTS]);
    renderPage();
    const c = within(await card());
    expect(c.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();
    expect(c.queryByRole("button", { name: "Decline" })).not.toBeInTheDocument();
    expect(c.queryByRole("button", { name: "Add a note" })).not.toBeInTheDocument();
    // Said once above the list, not on every card.
    expect(screen.getAllByText(/Your role can see requests but not answer them/)).toHaveLength(1);
    // Without manage_listing the gym's listing is never asked for.
    expect(marketplaceService.getOrgListing).not.toHaveBeenCalled();
  });

  it("staff with respond_requests can answer", async () => {
    asStaff([P.MARKETPLACE_VIEW_REQUESTS, P.MARKETPLACE_RESPOND_REQUESTS], "manager");
    const user = userEvent.setup();
    renderPage();
    await user.click(within(await card()).getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(marketplaceService.acceptOrgRequest).toHaveBeenCalledWith("gym1", "r1", undefined));
  });

  it("staff without view_requests get one line, no requests and no API calls", async () => {
    asStaff([P.VIEW_MEMBERS]);
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent("Your role at Iron Temple doesn't include this page.");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Requests/ })).not.toBeInTheDocument();
    expect(marketplaceService.getOrgPendingRequestCount).not.toHaveBeenCalled();
  });

  it("highlights the request a notification opened", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    mockSearch = "requestId=r1";
    renderPage();
    expect(await card()).toHaveAttribute("data-request-id", "r1");
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(screen.queryByText(/no longer waiting/)).not.toBeInTheDocument();
  });

  it("says when the request a notification opened is no longer waiting", async () => {
    mockSearch = "requestId=6abe5a17882f018fcdb21c61";
    renderPage();
    expect(await screen.findByText(/That request is no longer waiting/)).toBeInTheDocument();
  });
});
