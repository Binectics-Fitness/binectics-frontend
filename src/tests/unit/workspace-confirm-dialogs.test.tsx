import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FormsPage from "@/app/dashboard/forms/page";
import AssignmentRulesPage from "@/app/dashboard/assignment-rules/page";
import ProgramsManager from "@/components/programs/ProgramsManager";
import ProgramInstanceView from "@/components/programs/ProgramInstanceView";
import { formsService } from "@/lib/api/forms";
import { assignmentRulesService } from "@/lib/api/assignmentRules";
import { programsService } from "@/lib/api/programs";
import { toast } from "@/components/Toast";
import { confirmInDialog, findConfirmDialog } from "@/test/confirmDialog";

/**
 * Deleting a form or an assignment rule, archiving a program, and
 * completing or cancelling a client's program ask in the app's dialog,
 * never window.confirm.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner1" }, isLoading: false }) }));
const org = { _id: "o1", name: "Iron Temple", owner_id: "owner1", currency: "NGN", account_type: "gym" };
const orgState = { currentOrg: org, organizations: [org], isLoading: false };
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
  useOptionalOrganization: () => orgState,
}));
vi.mock("@/components/ds/WorkspaceShell", () => ({
  WorkspaceShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

const Shell = ({ children }: { children: ReactNode }) => <main>{children}</main>;
const config = { Shell, navItem: "Programs", basePath: "/dashboard/trainer/programs", accentSoft: "var(--trainer-soft)" } as never;

let nativeConfirm: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  nativeConfirm = vi.spyOn(window, "confirm");
});

describe("forms: delete", () => {
  const intake = {
    _id: "f1", created_by_id: "owner1", title: "Intake", is_published: false, allow_multiple_submissions: false,
    require_authentication: false, is_active: true, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z",
  };
  beforeEach(() => {
    vi.spyOn(formsService, "getMyForms").mockResolvedValue({ success: true, data: [intake] } as never);
    vi.spyOn(formsService, "getFormResponseCounts").mockResolvedValue({ success: true, data: { f1: 3 } } as never);
  });

  it("deletes only after the dialog, which says the responses go too", async () => {
    const del = vi.spyOn(formsService, "deleteForm").mockResolvedValue({ success: true } as never);
    const user = userEvent.setup();
    wrap(<FormsPage />);
    await user.click((await screen.findAllByRole("button", { name: "Delete" }))[0]);
    const dialog = await findConfirmDialog('Delete "Intake"?');
    expect(dialog).toHaveTextContent("its 3 responses are deleted for good");
    expect(del).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Delete form" }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("f1"));
    await waitFor(() => expect(screen.queryByText("Intake")).toBeNull());
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it("says all its responses go when the counts didn't load", async () => {
    vi.spyOn(formsService, "getFormResponseCounts").mockResolvedValue({ success: false, message: "Server error" } as never);
    const user = userEvent.setup();
    wrap(<FormsPage />);
    await user.click((await screen.findAllByRole("button", { name: "Delete" }))[0]);
    const dialog = await findConfirmDialog('Delete "Intake"?');
    expect(dialog).toHaveTextContent("all its responses are deleted for good");
  });

  it("does nothing on Cancel", async () => {
    const del = vi.spyOn(formsService, "deleteForm");
    const user = userEvent.setup();
    wrap(<FormsPage />);
    await user.click((await screen.findAllByRole("button", { name: "Delete" }))[0]);
    const dialog = await findConfirmDialog('Delete "Intake"?');
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(del).not.toHaveBeenCalled();
  });
});

describe("assignment rules: delete", () => {
  const rule = {
    _id: "r1", organization_id: "o1", name: "VIP to senior coaches", strategy: "round_robin", priority: 10,
    staff_user_ids: ["s1"], is_active: true, conditions: {}, created_at: "", updated_at: "",
  };

  it("deletes only after the dialog, which says existing assignments stay", async () => {
    vi.spyOn(assignmentRulesService, "list").mockResolvedValue({ success: true, data: [rule] } as never);
    const remove = vi.spyOn(assignmentRulesService, "remove").mockResolvedValue({ success: true } as never);
    const user = userEvent.setup();
    wrap(<AssignmentRulesPage />);
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = await findConfirmDialog('Delete the rule "VIP to senior coaches"?');
    expect(dialog).toHaveTextContent("Clients it already assigned keep their staff.");
    expect(remove).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Delete rule" }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("o1", "r1"));
    expect(await screen.findByText("Rule deleted successfully")).toBeInTheDocument();
    expect(nativeConfirm).not.toHaveBeenCalled();
  });
});

describe("programs: archive", () => {
  it("archives only after the dialog, which says assigned clients keep their programs", async () => {
    const published = {
      _id: "t1", created_by: "owner1", organization_id: "o1", name: "Couch to 5k", status: "published",
      latest_version_no: 1, latest_published_version_no: 1, created_at: "", updated_at: "",
    };
    vi.spyOn(programsService, "listTemplates").mockResolvedValue({ success: true, data: [published] } as never);
    const archive = vi.spyOn(programsService, "archiveTemplate").mockResolvedValue({ success: true } as never);
    const user = userEvent.setup();
    wrap(<ProgramsManager config={config} />);
    await user.click(await screen.findByRole("button", { name: "Archive" }));
    const dialog = await findConfirmDialog('Archive "Couch to 5k"?');
    expect(dialog).toHaveTextContent("It moves to Archived, where you can restore it later. Clients already on it keep their programs.");
    expect(archive).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Archive program" }));
    await waitFor(() => expect(archive).toHaveBeenCalledWith("t1"));
    expect(toast.success).toHaveBeenCalledWith("Program archived.");
    expect(nativeConfirm).not.toHaveBeenCalled();
    // It leaves the live list for the Archived filter, where it can be restored.
    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Archived/ }));
    expect(await screen.findByRole("button", { name: "Restore" })).toBeInTheDocument();
  });
});

describe("programs: restore", () => {
  const archived = {
    _id: "t2", created_by: "owner1", organization_id: "o1", name: "Couch to 5k", status: "archived",
    latest_version_no: 1, latest_published_version_no: 1, created_at: "", updated_at: "",
    phase_count: 1, task_count: 3, duration_days: 28,
  };

  it("lists archived programs behind their own filter, and restores only after the dialog", async () => {
    const list = vi.spyOn(programsService, "listTemplates").mockResolvedValue({ success: true, data: [archived] } as never);
    const restore = vi.spyOn(programsService, "restoreTemplate").mockResolvedValue({
      success: true,
      data: { template: { ...archived, status: "published" }, version: {} },
    } as never);
    const user = userEvent.setup();
    wrap(<ProgramsManager config={config} />);
    expect(await screen.findByText("No live programs. Restore one from Archived, or create a new one.")).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole("button", { name: /^Archived/ }));
    await user.click(await screen.findByRole("button", { name: "Restore" }));
    const dialog = await findConfirmDialog('Restore "Couch to 5k"?');
    expect(dialog).toHaveTextContent("It goes back to your programs as published, ready to assign.");
    expect(restore).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Restore program" }));
    await waitFor(() => expect(restore).toHaveBeenCalledWith("t2"));
    expect(toast.success).toHaveBeenCalledWith("Program restored.");
    expect(nativeConfirm).not.toHaveBeenCalled();
    // Back in the live list, assignable, and the empty Archived filter is gone.
    expect(await screen.findByRole("button", { name: "Assign" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Archived/ })).not.toBeInTheDocument();
  });

  it("says why a refused (403) restore failed, and leaves the program archived", async () => {
    vi.spyOn(programsService, "listTemplates").mockResolvedValue({ success: true, data: [archived] } as never);
    const restore = vi.spyOn(programsService, "restoreTemplate").mockResolvedValue({
      success: false,
      status: 403,
      message: "You do not own this program template",
    } as never);
    const user = userEvent.setup();
    wrap(<ProgramsManager config={config} />);
    await user.click(await screen.findByRole("button", { name: /^Archived/ }));
    await user.click(await screen.findByRole("button", { name: "Restore" }));
    const dialog = await findConfirmDialog('Restore "Couch to 5k"?');
    await user.click(within(dialog).getByRole("button", { name: "Restore program" }));
    await waitFor(() => expect(restore).toHaveBeenCalledWith("t2"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("You do not own this program template"));
    expect(toast.success).not.toHaveBeenCalled();
    // Still archived: still behind the Archived filter, still restorable.
    expect(await screen.findByRole("button", { name: "Restore" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Assign" })).not.toBeInTheDocument();
  });

  it("falls back to a generic message when the refusal carries none", async () => {
    vi.spyOn(programsService, "listTemplates").mockResolvedValue({ success: true, data: [archived] } as never);
    vi.spyOn(programsService, "restoreTemplate").mockResolvedValue({ success: false, status: 403 } as never);
    const user = userEvent.setup();
    wrap(<ProgramsManager config={config} />);
    await user.click(await screen.findByRole("button", { name: /^Archived/ }));
    await user.click(await screen.findByRole("button", { name: "Restore" }));
    const dialog = await findConfirmDialog('Restore "Couch to 5k"?');
    await user.click(within(dialog).getByRole("button", { name: "Restore program" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to restore program."));
  });

  it("says a program with unpublished edits comes back as a draft", async () => {
    vi.spyOn(programsService, "listTemplates").mockResolvedValue({
      success: true,
      data: [{ ...archived, latest_version_no: 2 }],
    } as never);
    const user = userEvent.setup();
    wrap(<ProgramsManager config={config} />);
    await user.click(await screen.findByRole("button", { name: /^Archived/ }));
    await user.click(await screen.findByRole("button", { name: "Restore" }));
    const dialog = await findConfirmDialog('Restore "Couch to 5k"?');
    expect(dialog).toHaveTextContent("It goes back to your programs as a draft, ready to edit and publish.");
  });
});

describe("a client's program: complete and cancel", () => {
  const detail = (status: string) => ({
    success: true,
    data: {
      instance: {
        _id: "i1", name: "Couch to 5k", status, started_at: "2026-10-01T00:00:00Z",
        client_id: { _id: "u1", first_name: "Bola", last_name: "Ade" },
      },
      adherence: { done: 3, missed: 1, skipped: 0, pending: 4, adherence_pct: 75 },
      goals: [],
    },
  });

  it("completes only after the dialog", async () => {
    vi.spyOn(programsService, "getInstance")
      .mockResolvedValueOnce(detail("active") as never)
      .mockResolvedValue(detail("completed") as never);
    const complete = vi.spyOn(programsService, "completeInstance").mockResolvedValue({ success: true } as never);
    const user = userEvent.setup();
    render(<ProgramInstanceView config={config} instanceId="i1" />);
    await user.click(await screen.findByRole("button", { name: "Complete" }));
    expect(complete).not.toHaveBeenCalled();
    await confirmInDialog(user, 'Mark "Couch to 5k" complete for Bola Ade?', "Mark complete");
    await waitFor(() => expect(complete).toHaveBeenCalledWith("i1"));
    expect(toast.success).toHaveBeenCalledWith("Program completed.");
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it.each([
    ["PROGRAM_FROZEN_LAPSED", "This client's plan has lapsed, so their program is read-only until they renew."],
    ["CONTENT_ACCESS_FROZEN", "This program is frozen. It resumes when they renew, or when you give it to them for free."],
  ])("keeps the provider sentence when %s refuses", async (code, message) => {
    vi.spyOn(programsService, "getInstance").mockResolvedValue(detail("paused") as never);
    vi.spyOn(programsService, "resumeInstance").mockResolvedValue({ success: false, code, status: 409, message } as never);
    const user = userEvent.setup();
    render(<ProgramInstanceView config={config} instanceId="i1" />);
    await user.click(await screen.findByRole("button", { name: "Resume" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
    expect(screen.queryByText(/Renew to keep it going/)).toBeNull();
    expect(screen.queryByRole("link", { name: /renew/i })).toBeNull();
  });

  it("cancels only after the dialog, and Keep program leaves it running", async () => {
    vi.spyOn(programsService, "getInstance").mockResolvedValue(detail("active") as never);
    const cancel = vi.spyOn(programsService, "cancelInstance").mockResolvedValue({ success: true } as never);
    const user = userEvent.setup();
    render(<ProgramInstanceView config={config} instanceId="i1" />);
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    let dialog = await findConfirmDialog('Cancel "Couch to 5k" for Bola Ade?');
    expect(dialog).toHaveTextContent("This can't be undone.");
    expect(dialog).toHaveTextContent("their Today screen in the app shows the program has ended");
    await user.click(within(dialog).getByRole("button", { name: "Keep program" }));
    expect(cancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    dialog = await findConfirmDialog('Cancel "Couch to 5k" for Bola Ade?');
    await user.click(within(dialog).getByRole("button", { name: "Cancel program" }));
    await waitFor(() => expect(cancel).toHaveBeenCalledWith("i1"));
    expect(nativeConfirm).not.toHaveBeenCalled();
  });
});
