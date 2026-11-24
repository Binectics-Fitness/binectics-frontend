import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerificationQueueClient } from "@/app/admin/verification/VerificationQueueClient";
import { VerificationDetailClient } from "@/app/admin/verification/[subjectType]/[subjectId]/VerificationDetailClient";
import {
  verificationService,
  type VerificationDetail,
  type VerificationQueueItem,
} from "@/lib/api/verification";
import { SIDEBAR as ADMIN_SIDEBAR } from "@/components/ds/AdminDashboardShell";
import { toast } from "@/components/Toast";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/verification",
}));
const auth = vi.hoisted(() => ({
  user: { id: "a1", role: "ADMIN", is_admin: true, first_name: "Ada", last_name: "Admin" } as Record<string, unknown> | null,
  isLoading: false,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/hooks/useAdminAccess", async () => (await import("@/test/adminAccess")).superAdminAccessModule);
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const status = {
  status: "pending" as const,
  reason_code: null,
  reason_label: null,
  reason: null,
  decided_at: null,
  documents_changed: false,
  resubmitted: false,
};

const row: VerificationQueueItem = {
  ...status,
  subject_type: "organization",
  subject_id: "org1",
  kind: "gym",
  name: "Iron Temple Gym",
  country: "NG",
  owner: { id: "u1", name: "Tunde B", email: "owner@x.com" },
  document_count: 2,
  updated_at: "2026-11-01T10:00:00.000Z",
};

function detail(over: Partial<VerificationDetail> = {}): VerificationDetail {
  return {
    ...status,
    subject_type: "organization",
    subject_id: "org1",
    kind: "gym",
    name: "Iron Temple Gym",
    country: "NG",
    updated_at: "2026-11-01T10:00:00.000Z",
    owner: { id: "u1", name: "Tunde B", email: "owner@x.com", phone_number: null, is_suspended: false, joined_at: null },
    documents: [
      {
        key: "doc_owner_id_url",
        label: "Owner ID",
        has_file: true,
        url: "https://api.cloudinary.com/signed/id.jpg",
        format: "jpg",
        unavailable_reason: null,
        uploaded_at: null,
        license: null,
      },
      {
        key: "doc_tax_url",
        label: "Tax certificate",
        has_file: true,
        url: null,
        format: null,
        unavailable_reason: "not_private",
        uploaded_at: null,
        license: null,
      },
    ],
    documents_expire_in_seconds: 900,
    listings: [{ id: "l1", headline: "Iron Temple Lekki", slug: null, account_type: "gym_owner", verification_badge: "none", is_suspended: false }],
    history: [],
    ...over,
  };
}

describe("admin nav", () => {
  it("puts Verification in Moderate, after Listings", () => {
    const moderate = ADMIN_SIDEBAR.find((s) => s.label === "Moderate")?.items.map((i) => i.name) ?? [];
    expect(moderate.indexOf("Verification")).toBe(moderate.indexOf("Listings") + 1);
  });
});

describe("verification queue", () => {
  const list = vi.spyOn(verificationService, "list");
  vi.spyOn(verificationService, "summary").mockResolvedValue({ success: true, data: { pending: 1, by_kind: { gym: 1, trainer: 0, dietitian: 0 } } });

  beforeEach(() => {
    vi.clearAllMocks();
    list.mockResolvedValue({ success: true, data: [row] });
  });

  it("asks for pending first and links each provider to its review", async () => {
    render(<VerificationQueueClient />);
    const name = await screen.findByText("Iron Temple Gym");
    expect(list).toHaveBeenCalledWith({ status: "pending", kind: undefined });
    expect(name.closest("a")).toHaveAttribute("href", "/admin/verification/organization/org1");
    expect(screen.getByText("Tunde B · owner@x.com")).toBeInTheDocument();
  });

  it("filters by provider type and status", async () => {
    const user = userEvent.setup();
    render(<VerificationQueueClient />);
    await screen.findByText("Iron Temple Gym");
    await user.click(screen.getByRole("button", { name: "Dietitians" }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith({ status: "pending", kind: "dietitian" }));
    await user.click(screen.getByRole("button", { name: /^Not approved/ }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith({ status: "rejected", kind: "dietitian" }));
  });
});

describe("verification review", () => {
  const get = vi.spyOn(verificationService, "detail");
  const approve = vi.spyOn(verificationService, "approve");
  const reject = vi.spyOn(verificationService, "reject");

  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ success: true, data: detail() });
  });

  it("shows an image inline and never links a file that isn't private", async () => {
    const user = userEvent.setup();
    render(<VerificationDetailClient subjectType="organization" subjectId="org1" />);
    const img = await screen.findByRole("img", { name: "Owner ID" });
    expect(img).toHaveAttribute("src", "https://api.cloudinary.com/signed/id.jpg");
    await user.click(screen.getByRole("tab", { name: /Tax certificate/ }));
    expect(screen.getByText(/old public format/)).toBeInTheDocument();
  });

  it("rejecting needs a reason and a message, and sends both", async () => {
    const user = userEvent.setup();
    reject.mockResolvedValue({ success: true, data: detail({ status: "rejected" }) });
    render(<VerificationDetailClient subjectType="organization" subjectId="org1" />);
    await screen.findByText("Iron Temple Lekki");
    await user.click(screen.getByRole("button", { name: "Reject" }));
    const dialog = await screen.findByRole("dialog");
    const send = within(dialog).getByRole("button", { name: "Send rejection" });
    expect(send).toBeDisabled();
    await user.click(within(dialog).getByLabelText(/Documents unreadable/));
    await user.type(within(dialog).getByLabelText("Message to the provider"), "Too short");
    expect(send).toBeDisabled();
    await user.type(within(dialog).getByLabelText("Message to the provider"), ", the ID photo is blurred.");
    expect(send).toBeEnabled();
    await user.click(send);
    await waitFor(() =>
      expect(reject).toHaveBeenCalledWith("organization", "org1", {
        reason_code: "documents_unreadable",
        message: "Too short, the ID photo is blurred.",
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Rejection sent");
  });

  it("approves a pending provider", async () => {
    const user = userEvent.setup();
    approve.mockResolvedValue({ success: true, data: detail({ status: "verified" }) });
    render(<VerificationDetailClient subjectType="organization" subjectId="org1" />);
    await screen.findByText("Iron Temple Lekki");
    await user.click(screen.getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("1 listing will show the verified badge.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(approve).toHaveBeenCalledWith("organization", "org1"));
    expect(await screen.findByRole("button", { name: "Revoke badge" })).toBeInTheDocument();
  });
});
