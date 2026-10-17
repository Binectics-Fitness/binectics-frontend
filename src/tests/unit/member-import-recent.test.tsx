import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecentImports } from "@/app/dashboard/gym-owner/members/import/RecentImports";
import { memberImportsApi, type MemberImportListItem } from "@/lib/api/memberImports";
import { toast } from "@/components/Toast";

/**
 * The Members page's list of finished imports: what it says about each
 * import's invites, and who may act on them. "Unconfirmed" invites (handed
 * to the mail server by a run that never recorded it) are counted apart
 * from "invited", and the gym can ask for them once more.
 */

vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const authState = { user: { id: "owner1" } };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
const owned = { _id: "org-1", name: "Iron Temple", owner_id: "owner1" };
const orgState: { currentOrg: Record<string, unknown> } = { currentOrg: owned };
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
  useOptionalOrganization: () => orgState,
}));

const item = (invites: Partial<MemberImportListItem["invites"]> = {}): MemberImportListItem => ({
  _id: "imp-1",
  status: "done",
  file_name: "gymmaster.csv",
  row_count: 12,
  result: { imported: 10 },
  invite_mode: "now",
  created_at: "2026-10-15T09:00:00Z",
  confirmed_at: "2026-10-15T09:01:00Z",
  finished_at: "2026-10-15T09:02:00Z",
  invites: { held: 0, queued: 0, sent: 7, unconfirmed: 3, ...invites },
});

function renderList() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<RecentImports orgId="org-1" />, { wrapper });
}

const asStaff = (permissions: string[]) => {
  authState.user = { id: "staff1" };
  orgState.currentOrg = { ...owned, my_permissions: permissions };
};

describe("RecentImports", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    authState.user = { id: "owner1" };
    orgState.currentOrg = owned;
  });

  it("renders nothing when the gym has no finished import", async () => {
    const list = vi.spyOn(memberImportsApi, "list").mockResolvedValue({
      success: true,
      data: [{ ...item(), status: "draft" }],
    });
    const { container } = renderList();
    await vi.waitFor(() => expect(list).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("counts invites that may not have arrived apart from those sent", async () => {
    vi.spyOn(memberImportsApi, "list").mockResolvedValue({ success: true, data: [item()] });
    renderList();
    expect(await screen.findByText(/7 invited · 3 invites may not have arrived/)).toBeInTheDocument();
  });

  it("says nothing about unconfirmed invites when there are none", async () => {
    vi.spyOn(memberImportsApi, "list").mockResolvedValue({ success: true, data: [item({ unconfirmed: 0 })] });
    renderList();
    expect(await screen.findByText(/7 invited/)).toBeInTheDocument();
    expect(screen.queryByText(/may not have arrived/)).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("lets the owner send them once more, and reloads the counts", async () => {
    const list = vi
      .spyOn(memberImportsApi, "list")
      .mockResolvedValueOnce({ success: true, data: [item()] })
      .mockResolvedValue({ success: true, data: [item({ queued: 3, unconfirmed: 0 })] });
    const resend = vi.spyOn(memberImportsApi, "resendUnconfirmed").mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderList();
    await user.click(await screen.findByRole("button", { name: "Send 3 again" }));
    expect(resend).toHaveBeenCalledWith("org-1", "imp-1");
    expect(toast.success).toHaveBeenCalledWith("Sending them once more. A member may get the email twice.");
    expect(await screen.findByText(/3 invites on their way/)).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("button", { name: /again/ })).toBeNull();
  });

  it("shows the API's reason when the resend is refused", async () => {
    vi.spyOn(memberImportsApi, "list").mockResolvedValue({ success: true, data: [item()] });
    vi.spyOn(memberImportsApi, "resendUnconfirmed").mockResolvedValue({ success: false, message: "Import not found" });
    const user = userEvent.setup();
    renderList();
    await user.click(await screen.findByRole("button", { name: "Send 3 again" }));
    expect(toast.error).toHaveBeenCalledWith("Import not found");
  });

  it("offers staff who manage members the same actions", async () => {
    asStaff(["marketplace:manage_listing"]);
    vi.spyOn(memberImportsApi, "list").mockResolvedValue({ success: true, data: [item({ held: 2 })] });
    renderList();
    expect(await screen.findByRole("button", { name: "Send 3 again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send 2 invites" })).toBeInTheDocument();
  });

  it("shows staff without member management the counts, not the actions (the API would refuse)", async () => {
    asStaff(["bookings:manage"]);
    vi.spyOn(memberImportsApi, "list").mockResolvedValue({ success: true, data: [item({ held: 2 })] });
    renderList();
    expect(await screen.findByText(/3 invites may not have arrived/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
