import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/tests/setup/test-utils";
import { ClosedGymsView } from "./ClosedGymsView";
import { CloseGymSection } from "./CloseGymSection";
import { GymClosureGate } from "./GymClosureGate";

const refresh = vi.fn(async () => {});
let ctx: { currentOrg: unknown; isLoading: boolean } = { currentOrg: null, isLoading: false };
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ refreshOrganizations: refresh }),
  useOptionalOrganization: () => ctx,
}));
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/dashboard/gym-owner",
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const svc = vi.hoisted(() => ({
  listClosed: vi.fn(),
  close: vi.fn(),
  reopen: vi.fn(),
  fetchExport: vi.fn(),
}));
vi.mock("@/lib/api/orgClosure", () => ({ orgClosureService: svc }));

const soon = new Date(Date.now() + 5 * 86_400_000).toISOString();
const past = new Date(Date.now() - 2 * 86_400_000).toISOString();
const gym = (over = {}) => ({
  id: "g1", name: "Iron Gym", closedAt: "2026-11-01T00:00:00Z", closedReason: null,
  reopenedAt: null, reopenUntil: soon, canReopen: true, ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  ctx = { currentOrg: null, isLoading: false };
});

describe("ClosedGymsView", () => {
  it("shows loading, then the gym with days left, reopen and three exports", async () => {
    svc.listClosed.mockResolvedValue({ success: true, data: [gym()] });
    renderWithProviders(<ClosedGymsView />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("Iron Gym")).toBeInTheDocument();
    expect(screen.getByText(/5 days left to reopen/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reopen gym" })).toBeInTheDocument();
    expect(screen.getByText("Revenue by trainer")).toBeInTheDocument();
    expect(screen.getByText("Paid-content sales")).toBeInTheDocument();
    expect(screen.getByText("Transaction ledger")).toBeInTheDocument();
  });

  it("shows an error with retry, not an empty page, when the load fails", async () => {
    svc.listClosed.mockResolvedValue({ success: false, message: "boom" });
    renderWithProviders(<ClosedGymsView />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not load/i);
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    svc.listClosed.mockResolvedValue({ success: true, data: [] });
    renderWithProviders(<ClosedGymsView />);
    expect(await screen.findByText("No closed gyms")).toBeInTheDocument();
  });

  it("hides Reopen once the window has expired but keeps the exports", async () => {
    svc.listClosed.mockResolvedValue({ success: true, data: [gym({ reopenUntil: past, canReopen: false })] });
    renderWithProviders(<ClosedGymsView />);
    expect(await screen.findByText(/reopen window has ended/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reopen gym" })).toBeNull();
    expect(screen.getByRole("button", { name: /Download Transaction ledger as CSV/ })).toBeInTheDocument();
  });

  it("still offers Reopen when the server says so, whatever the device clock thinks", async () => {
    svc.listClosed.mockResolvedValue({ success: true, data: [gym({ reopenUntil: past, canReopen: true })] });
    renderWithProviders(<ClosedGymsView />);
    expect(await screen.findByRole("button", { name: "Reopen gym" })).toBeInTheDocument();
    expect(screen.queryByText(/reopen window has ended/i)).toBeNull();
  });

  it("explains a server refusal when reopening", async () => {
    svc.listClosed.mockResolvedValue({ success: true, data: [gym()] });
    svc.reopen.mockResolvedValue({ success: false, code: "ORG_REOPEN_WINDOW_EXPIRED", status: 409 });
    renderWithProviders(<ClosedGymsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Reopen gym" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/window has ended/);
  });

  it("requests the chosen format", async () => {
    svc.listClosed.mockResolvedValue({ success: true, data: [gym()] });
    svc.fetchExport.mockResolvedValue({ success: false, code: undefined, status: 500, message: "nope" });
    renderWithProviders(<ClosedGymsView />);
    fireEvent.click(await screen.findByRole("button", { name: "JSON" }));
    fireEvent.click(screen.getByRole("button", { name: /Download Revenue by trainer as JSON/ }));
    await waitFor(() => expect(svc.fetchExport).toHaveBeenCalledWith("revenue", "g1", "json"));
    expect(await screen.findByRole("alert")).toHaveTextContent("nope");
  });
});

describe("CloseGymSection", () => {
  const openDialog = () => fireEvent.click(screen.getByRole("button", { name: /Close gym…/ }));

  it("says what happens and what does not, and promises no deletion", () => {
    renderWithProviders(<CloseGymSection orgId="g1" orgName="Iron Gym" />);
    expect(screen.getByText("What does not happen")).toBeInTheDocument();
    expect(screen.getByText(/Nothing is deleted/)).toBeInTheDocument();
    expect(screen.getByText(/No money moves/)).toBeInTheDocument();
  });

  it("keeps Close disabled until the confirmation matches", async () => {
    renderWithProviders(<CloseGymSection orgId="g1" orgName="Iron Gym" />);
    openDialog();
    const dialog = await screen.findByRole("dialog");
    const confirm = dialog.querySelector("button.bg-danger") as HTMLButtonElement;
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/to confirm/), { target: { value: "Iron" } });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/to confirm/), { target: { value: "close" } });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/to confirm/), { target: { value: "CLOSE" } });
    expect(confirm).toBeEnabled();
    expect(svc.close).not.toHaveBeenCalled();
  });

  it("shows the API's refusal and does not refresh workspaces", async () => {
    svc.close.mockResolvedValue({ success: false, code: "ORG_CLOSE_NOT_SUPPORTED", status: 400 });
    renderWithProviders(<CloseGymSection orgId="g1" orgName="Iron Gym" />);
    openDialog();
    fireEvent.change(await screen.findByLabelText(/to confirm/), { target: { value: "CLOSE" } });
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog.querySelector("button.bg-danger") as HTMLButtonElement);
    expect(await screen.findByRole("alert")).toHaveTextContent(/Only a gym workspace/);
    expect(svc.close).toHaveBeenCalledWith("g1", { confirm: "CLOSE" });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes workspaces after a successful close", async () => {
    svc.close.mockResolvedValue({ success: true, data: gym() });
    renderWithProviders(<CloseGymSection orgId="g1" orgName="Iron Gym" />);
    openDialog();
    fireEvent.change(await screen.findByLabelText(/to confirm/), { target: { value: "iron gym" } });
    fireEvent.click(screen.getByRole("dialog").querySelector("button.bg-danger") as HTMLButtonElement);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});

describe("GymClosureGate", () => {
  it("sends an owner whose only gym is closed to the Closed gyms page", async () => {
    svc.listClosed.mockResolvedValue({ success: true, data: [gym()] });
    renderWithProviders(<GymClosureGate isOwner={false}><p>dash</p></GymClosureGate>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/gym-owner/closed"));
    expect(screen.queryByText("dash")).toBeNull();
  });

  it("tells someone with no workspace and no closed gyms that there is no open gym when they have no workspace and no closed gyms", async () => {
    svc.listClosed.mockResolvedValue({ success: true, data: [] });
    renderWithProviders(<GymClosureGate isOwner={false}><p>dash</p></GymClosureGate>);
    expect(await screen.findByText("No open gym here")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows a banner above the page for an owner with another gym closed", async () => {
    ctx = { currentOrg: { _id: "o2" }, isLoading: false };
    svc.listClosed.mockResolvedValue({ success: true, data: [gym()] });
    renderWithProviders(<GymClosureGate isOwner><p>dash</p></GymClosureGate>);
    expect(await screen.findByText(/Iron Gym is closed/)).toBeInTheDocument();
    expect(screen.getByText("dash")).toBeInTheDocument();
  });
});
