import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import DietitianClientsPage from "@/app/dashboard/dietitian/clients/page";
import { PENDING_INVITES_ID } from "@/components/clients/PendingInvites";
import { PENDING_INVITES_HREF } from "@/app/dashboard/dietitian/DietitianTodayClient";
import { progressService, type ClientInvitation, type ClientRequestItem } from "@/lib/api/progress";

vi.mock("@/components/ds/DietitianDashboardShell", () => ({
  DietitianDashboardShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "d1", role: "DIETITIAN" }, isLoading: false }) }));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: null, isLoading: false }),
  useOptionalOrganization: () => ({ currentOrg: null, organizations: [], isLoading: false }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard/dietitian/clients",
  useSearchParams: () => new URLSearchParams(),
}));

const invitation = (over: Partial<ClientInvitation> = {}): ClientInvitation => ({
  _id: "inv1",
  id: "inv1",
  email: "tolu@example.com",
  status: "pending",
  expires_at: "2026-10-24T00:00:00Z",
  ...over,
});
const sentRequest = (over: Partial<ClientRequestItem> = {}): ClientRequestItem =>
  ({
    _id: "req1",
    professional_id: "d1",
    client_id: { _id: "c1", first_name: "Kemi", last_name: "Bello", email: "kemi@example.com" },
    organization_id: null,
    professional_type: "Dietitian",
    status: "pending",
    goals: [],
    created_at: "2026-10-15T00:00:00Z",
    updated_at: "2026-10-15T00:00:00Z",
    ...over,
  }) as ClientRequestItem;

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DietitianClientsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(progressService, "getMyClientProfiles").mockResolvedValue({ success: true, data: [] });
  vi.spyOn(progressService, "getMyClientInvitations").mockResolvedValue({ success: true, data: [] });
  vi.spyOn(progressService, "getSentClientRequests").mockResolvedValue({ success: true, data: [] });
});

describe("Dietitian clients: inviting a client (F5)", () => {
  it("has Invite client in the header and in the empty state", async () => {
    renderPage();
    expect(await screen.findByText("No clients yet")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Invite client" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "See requests" })).toHaveAttribute("href", "/dashboard/marketplace/requests");
  });

  it("sends the invite through the same add-client flow trainers use, and says what happens next", async () => {
    const add = vi.spyOn(progressService, "addClient").mockResolvedValue({
      success: true,
      data: { action: "request_sent", message: "Request sent" },
    });
    renderPage();
    await userEvent.click((await screen.findAllByRole("button", { name: "Invite client" }))[0]);
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/Email/), "kemi@example.com");
    await userEvent.click(within(dialog).getByRole("button", { name: "Send invite" }));
    await waitFor(() => expect(add).toHaveBeenCalledWith({ email: "kemi@example.com" }));
    expect(await screen.findByText(/We've asked them to approve you as their dietitian/)).toBeInTheDocument();
  });
});

describe("Invites waiting on an answer (F20)", () => {
  it("is absent when nothing is waiting", async () => {
    renderPage();
    await screen.findByText("No clients yet");
    expect(screen.queryByText("Waiting on an answer")).toBeNull();
  });

  it("lists sign-up invites and approval requests, each withdrawable", async () => {
    vi.spyOn(progressService, "getMyClientInvitations").mockResolvedValue({
      success: true,
      data: [invitation(), invitation({ _id: "inv2", id: "inv2", email: "old@example.com", status: "accepted" })],
    });
    vi.spyOn(progressService, "getSentClientRequests").mockResolvedValue({
      success: true,
      data: [sentRequest(), sentRequest({ _id: "req2", status: "approved" })],
    });
    const cancel = vi.spyOn(progressService, "cancelClientInvitation").mockResolvedValue({ success: true });
    const cancelRequest = vi.spyOn(progressService, "cancelClientRequest").mockResolvedValue({ success: true });
    renderPage();
    const list = (await screen.findByText("Waiting on an answer")).closest("section")!;
    expect(list.id).toBe(PENDING_INVITES_ID);
    expect(within(list).getByText("tolu@example.com")).toBeInTheDocument();
    expect(within(list).getByText("Kemi Bello")).toBeInTheDocument();
    // Answered ones aren't waiting.
    expect(within(list).queryByText("old@example.com")).toBeNull();
    await userEvent.click(within(list).getByRole("button", { name: "Withdraw the invite to tolu@example.com" }));
    expect(cancel).toHaveBeenCalledWith("inv1");
    await userEvent.click(within(list).getByRole("button", { name: "Withdraw the invite to Kemi Bello" }));
    expect(cancelRequest).toHaveBeenCalledWith("req1");
  });

  it("is where the Today page's pending-invitations tile goes", () => {
    expect(PENDING_INVITES_HREF).toBe(`/dashboard/dietitian/clients#${PENDING_INVITES_ID}`);
  });
});
