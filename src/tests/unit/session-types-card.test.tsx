import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionTypesCard as Card, SESSION_TYPES_CHANGED, draftIssues, mainSessionType } from "@/components/provider/SessionTypesCard";

function SessionTypesCard() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Card />
    </QueryClientProvider>
  );
}

const svc = vi.hoisted(() => ({
  getOwnTypes: vi.fn(),
  createOwnType: vi.fn(),
  updateOwnType: vi.fn(),
  archiveOwnType: vi.fn(),
}));
vi.mock("@/lib/api/consultations", () => ({ consultationsService: svc }));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: { _id: "o1", currency: "NGN" } }),
}));
vi.mock("@/lib/queries/currencies", () => ({
  useCurrencies: () => ({
    all: [{ code: "NGN", name: "Naira", symbol: "₦", minor_unit: 2, selectable: { price: true } }],
  }),
}));

const type = (over: Record<string, unknown>) => ({
  id: "t1",
  name: "1:1 session",
  defaultDurationMinutes: 60,
  bufferMinutes: 15,
  minAdvanceNoticeMinutes: 120,
  isActive: true,
  priceMinor: 2_500_000,
  currency: "NGN",
  providerRole: "PERSONAL_TRAINER",
  createdAt: "",
  updatedAt: "",
  ...over,
});

describe("SessionTypesCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    svc.getOwnTypes.mockResolvedValue({ success: true, data: [type({})] });
    svc.createOwnType.mockResolvedValue({ success: true, data: type({ id: "t2" }) });
    svc.updateOwnType.mockResolvedValue({ success: true, data: type({ id: "t2" }) });
    svc.archiveOwnType.mockResolvedValue({ success: true, data: type({ id: "t2", isActive: false }) });
  });

  it("asks for the main session first when there is none", async () => {
    svc.getOwnTypes.mockResolvedValue({ success: true, data: [] });
    render(<SessionTypesCard />);
    expect(await screen.findByText(/Save your Session settings above first/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add session type" })).not.toBeInTheDocument();
  });

  it("lists the main session and adds a second one with the main's buffer and notice", async () => {
    render(<SessionTypesCard />);
    expect(await screen.findByText("1:1 session")).toBeInTheDocument();
    expect(screen.getByText("Main")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add session type" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Small-group session" } });
    fireEvent.change(screen.getByLabelText("Length"), { target: { value: "45" } });
    fireEvent.change(screen.getByLabelText("Session type price"), { target: { value: "15000" } });
    svc.getOwnTypes.mockResolvedValue({
      success: true,
      data: [type({}), type({ id: "t2", name: "Small-group session", defaultDurationMinutes: 45, priceMinor: 1_500_000 })],
    });
    fireEvent.click(screen.getByRole("button", { name: "Add session type" }));

    await waitFor(() =>
      expect(svc.createOwnType).toHaveBeenCalledWith({
        name: "Small-group session",
        description: undefined,
        defaultDurationMinutes: 45,
        capacity: 1,
        priceMinor: 1_500_000,
        currency: "NGN",
        bufferMinutes: 15,
        minAdvanceNoticeMinutes: 120,
        isActive: true,
      }),
    );
    expect(await screen.findByText(/Added "Small-group session"/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Small-group session" })).toBeInTheDocument();
    // The main session is edited in Session settings, not here.
    expect(screen.queryByRole("button", { name: "Edit 1:1 session" })).not.toBeInTheDocument();
  });

  it("won't save without a name or a price, and says why", async () => {
    render(<SessionTypesCard />);
    fireEvent.click(await screen.findByRole("button", { name: "Add session type" }));
    fireEvent.click(screen.getByRole("button", { name: "Add session type" }));
    expect(await screen.findByText("Give the session a name.")).toBeInTheDocument();
    expect(screen.getByText("Set a price, or mark it free.")).toBeInTheDocument();
    expect(svc.createOwnType).not.toHaveBeenCalled();
  });

  it("explains a duplicate name (409)", async () => {
    svc.createOwnType.mockResolvedValue({ success: false, status: 409, message: "Conflict" });
    render(<SessionTypesCard />);
    fireEvent.click(await screen.findByRole("button", { name: "Add session type" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "1:1 session" } });
    fireEvent.click(screen.getByLabelText("Free"));
    fireEvent.click(screen.getByRole("button", { name: "Add session type" }));
    expect(await screen.findByText(/already have a session called "1:1 session"/)).toBeInTheDocument();
  });

  it("edits and archives an extra session type", async () => {
    svc.getOwnTypes.mockResolvedValue({
      success: true,
      data: [type({}), type({ id: "t2", name: "Check-in", defaultDurationMinutes: 30, priceMinor: 0 })],
    });
    render(<SessionTypesCard />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit Check-in" }));
    fireEvent.change(screen.getByLabelText("Length"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Save session" }));
    await waitFor(() =>
      expect(svc.updateOwnType).toHaveBeenCalledWith("t2", {
        name: "Check-in",
        description: undefined,
        defaultDurationMinutes: 20,
        capacity: 1,
        priceMinor: 0,
        currency: "NGN",
      }),
    );

    fireEvent.click(await screen.findByRole("button", { name: "Archive Check-in" }));
    fireEvent.click(await screen.findByRole("button", { name: "Archive" }));
    await waitFor(() => expect(svc.archiveOwnType).toHaveBeenCalledWith("t2"));
  });

  it("keeps the oldest session as Main when a newer one sorts first by name", async () => {
    svc.getOwnTypes.mockResolvedValue({
      success: true,
      data: [
        type({ id: "t2", name: "Check-in", createdAt: "2026-11-23T19:00:00Z" }),
        type({ id: "t1", name: "First consultation", createdAt: "2026-11-23T18:00:00Z" }),
      ],
    });
    render(<SessionTypesCard />);
    expect(await screen.findByRole("button", { name: "Edit Check-in" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit First consultation" })).not.toBeInTheDocument();
  });

  it("re-reads when Session settings saves the main session", async () => {
    svc.getOwnTypes.mockResolvedValueOnce({ success: true, data: [] });
    render(<SessionTypesCard />);
    await screen.findByText(/Save your Session settings above first/);
    await act(async () => {
      window.dispatchEvent(new Event(SESSION_TYPES_CHANGED));
    });
    expect(await screen.findByText("1:1 session")).toBeInTheDocument();
  });
});

describe("mainSessionType", () => {
  it("is the oldest active session, not the first by name", () => {
    const types = [
      type({ id: "a", name: "Check-in", createdAt: "2026-11-23T19:00:00Z" }),
      type({ id: "b", name: "First consultation", createdAt: "2026-11-23T18:00:00Z" }),
      type({ id: "c", name: "Archived", createdAt: "2026-01-01T00:00:00Z", isActive: false }),
    ];
    expect(mainSessionType(types)?.id).toBe("b");
    expect(mainSessionType([])).toBeUndefined();
  });
});

describe("draftIssues", () => {
  const base = { name: "X", description: "", duration: 30, capacity: 1, free: true, priceText: "", priceMinor: null, currency: "" };
  it("accepts a free session with no currency", () => expect(draftIssues(base)).toEqual({}));
  it("rejects lengths outside 5-240", () => {
    expect(draftIssues({ ...base, duration: 4 }).duration).toBeDefined();
    expect(draftIssues({ ...base, duration: 241 }).duration).toBeDefined();
  });
  it("needs a currency for a paid session", () =>
    expect(draftIssues({ ...base, free: false, priceMinor: 100 }).currency).toBeDefined());
  it("takes 1 to 20 people per slot", () => {
    expect(draftIssues({ ...base, capacity: 4 })).toEqual({});
    expect(draftIssues({ ...base, capacity: 20 })).toEqual({});
    expect(draftIssues({ ...base, capacity: 0 }).capacity).toBeDefined();
    expect(draftIssues({ ...base, capacity: 21 }).capacity).toBeDefined();
    expect(draftIssues({ ...base, capacity: 2.5 }).capacity).toBeDefined();
  });
});

describe("SessionTypesCard group sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    svc.getOwnTypes.mockResolvedValue({
      success: true,
      data: [type({}), type({ id: "t2", name: "Small-group strength", capacity: 4, createdAt: "z" })],
    });
  });

  it("shows a group session's size and saves a new capacity", async () => {
    svc.updateOwnType.mockResolvedValue({ success: true, data: type({ id: "t2", capacity: 6 }) });
    render(<SessionTypesCard />);
    expect(await screen.findByText(/Group of 4/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit Small-group strength" }));
    const field = screen.getByLabelText("People per slot");
    expect(field).toHaveValue(4);
    expect(screen.getByText("group session")).toBeInTheDocument();
    fireEvent.change(field, { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Save session" }));
    await waitFor(() =>
      expect(svc.updateOwnType).toHaveBeenCalledWith("t2", expect.objectContaining({ capacity: 6 })),
    );
  });

  it("explains a capacity below what is already booked instead of blaming the name", async () => {
    svc.updateOwnType.mockResolvedValue({
      success: false,
      status: 409,
      code: "CONSULTATION_CAPACITY_BELOW_BOOKED",
      message: "3 people are booked into one upcoming session, so places can't go below 3.",
    });
    render(<SessionTypesCard />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit Small-group strength" }));
    fireEvent.change(screen.getByLabelText("People per slot"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save session" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/places can't go below 3/);
  });
});
