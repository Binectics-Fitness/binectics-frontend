import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewReportsClient } from "@/app/admin/reviews/ReviewReportsClient";
import { ReviewDetailClient } from "@/app/admin/reviews/[reviewId]/ReviewDetailClient";
import { adminService, type AdminReviewReport, type AdminReviewView } from "@/lib/api/admin";
import { toast } from "@/components/Toast";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/reviews",
}));
const auth = vi.hoisted(() => ({
  user: { id: "a1", role: "ADMIN", is_admin: true, first_name: "Ada", last_name: "Admin" } as Record<string, unknown> | null,
  isLoading: false,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const review: AdminReviewView = {
  id: "rev1",
  rating: 1,
  comment: "Abusive text about the coach",
  status: "VISIBLE",
  target_type: "TRAINER",
  target_id: "lst1",
  created_at: "2026-09-01T12:00:00.000Z",
  author: { id: "u-author", name: "Ayo B", email: "au@x.com" },
  listing: { id: "lst1", headline: "Strength with Tia", slug: "tia", account_type: "personal_trainer" },
  provider: { id: "u-tia", name: "Tia R", email: "tr@x.com" },
};

function report(over: Partial<AdminReviewReport> = {}): AdminReviewReport {
  return {
    id: "rep1",
    status: "OPEN",
    reason: "Harassment",
    details: "Names the coach",
    created_at: "2026-09-02T12:00:00.000Z",
    reporter: { id: "u-rex", name: "Rex P", email: "rp@x.com" },
    review_id: "rev1",
    review,
    resolution: null,
    ...over,
  };
}

describe("admin review report queue", () => {
  const list = vi.spyOn(adminService, "listReviewReports");

  beforeEach(() => {
    vi.clearAllMocks();
    list.mockResolvedValue({ success: true, data: { items: [report()], total: 1, page: 1, limit: 25 } });
  });

  it("asks for open reports first and links each row to its review", async () => {
    render(<ReviewReportsClient />);
    const rows = await screen.findAllByText("Abusive text about the coach");
    expect(list).toHaveBeenCalledWith({ status: "open", page: 1, limit: 25 });
    expect(rows[0].closest("a")).toHaveAttribute("href", "/admin/reviews/rev1");
    expect(screen.getAllByText("Strength with Tia").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rex P").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
  });

  it("switches to resolved reports", async () => {
    const user = userEvent.setup();
    render(<ReviewReportsClient />);
    await screen.findAllByText("Abusive text about the coach");
    list.mockResolvedValue({
      success: true,
      data: {
        items: [report({ status: "DISMISSED", resolution: { action: "dismiss", note: null, resolved_at: null, resolved_by: null } })],
        total: 1,
        page: 1,
        limit: 25,
      },
    });
    await user.click(screen.getByRole("button", { name: /^Resolved/ }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith({ status: "resolved", page: 1, limit: 25 }));
    expect((await screen.findAllByText("Dismissed")).length).toBeGreaterThan(0);
  });

  it("shows an empty queue honestly and an API error as an error", async () => {
    list.mockResolvedValueOnce({ success: true, data: { items: [], total: 0, page: 1, limit: 25 } });
    const { unmount } = render(<ReviewReportsClient />);
    expect((await screen.findAllByText("No reports")).length).toBeGreaterThan(0);
    unmount();
    list.mockResolvedValueOnce({ success: false, message: "Admin access required" });
    render(<ReviewReportsClient />);
    expect((await screen.findAllByText("Admin access required")).length).toBeGreaterThan(0);
  });
});

describe("admin review detail", () => {
  const get = vi.spyOn(adminService, "getReview");
  const setStatus = vi.spyOn(adminService, "setReviewStatus");
  const resolve = vi.spyOn(adminService, "resolveReviewReport");

  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ success: true, data: { review, reports: [report()] } });
  });

  it("shows the review, who is involved and its reports", async () => {
    render(<ReviewDetailClient reviewId="rev1" />);
    expect((await screen.findAllByText(/Abusive text about the coach/)).length).toBeGreaterThan(0);
    expect(get).toHaveBeenCalledWith("rev1");
    const author = screen.getByRole("link", { name: "Ayo B" });
    expect(author).toHaveAttribute("href", "/admin/users/u-author");
    expect(screen.getByRole("link", { name: "Strength with Tia" })).toHaveAttribute("href", "/marketplace/lst1");
    expect(screen.getAllByText("Names the coach").length).toBeGreaterThan(0);
  });

  it("hides the review with a note and reloads", async () => {
    const user = userEvent.setup();
    setStatus.mockResolvedValue({ success: true, data: { review: { ...review, status: "HIDDEN" }, reports_closed: 1 } });
    render(<ReviewDetailClient reviewId="rev1" />);
    await screen.findAllByText(/Abusive text about the coach/);
    await user.click(screen.getByRole("button", { name: "Hide review" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/Note/), "Harassment policy");
    get.mockResolvedValue({ success: true, data: { review: { ...review, status: "HIDDEN" }, reports: [] } });
    await user.click(within(dialog).getByRole("button", { name: "Hide review" }));
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith("rev1", "HIDDEN", "Harassment policy"));
    expect(toast.success).toHaveBeenCalledWith("Review hidden");
    expect((await screen.findAllByRole("button", { name: "Restore review" })).length).toBeGreaterThan(0);
  });

  it("dismisses one report without touching the review", async () => {
    const user = userEvent.setup();
    resolve.mockResolvedValue({ success: true, data: report({ status: "DISMISSED" }) });
    render(<ReviewDetailClient reviewId="rev1" />);
    await screen.findAllByText(/Abusive text about the coach/);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Dismiss report" }));
    await waitFor(() => expect(resolve).toHaveBeenCalledWith("rep1", "dismiss", undefined));
    expect(setStatus).not.toHaveBeenCalled();
  });

  it("surfaces a refused action instead of claiming success", async () => {
    const user = userEvent.setup();
    setStatus.mockResolvedValue({ success: false, message: "The author removed this review" });
    render(<ReviewDetailClient reviewId="rev1" />);
    await screen.findAllByText(/Abusive text about the coach/);
    await user.click(screen.getByRole("button", { name: "Hide review" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Hide review" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("The author removed this review"));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("offers no hide or restore on a review its author removed", async () => {
    get.mockResolvedValue({ success: true, data: { review: { ...review, status: "REMOVED" }, reports: [report()] } });
    render(<ReviewDetailClient reviewId="rev1" />);
    expect((await screen.findAllByText(/The author removed this review/)).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Hide review" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Restore review" })).toBeNull();
  });
});
