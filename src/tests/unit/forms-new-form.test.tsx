import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const svc = vi.hoisted(() => ({
  getMyForms: vi.fn(),
  getFormResponseCounts: vi.fn(),
  createForm: vi.fn(),
  getFormQuestions: vi.fn(),
}));
vi.mock("@/lib/api/forms", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/forms")>()),
  formsService: svc,
}));
vi.mock("@/components/ds/WorkspaceShell", () => ({
  WorkspaceShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/app/dashboard/forms/TemplateGallery", () => ({
  TemplateGallery: () => <section aria-label="Templates">templates</section>,
}));
vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({ fmtDate: (d: string) => d }),
}));
vi.mock("@/hooks/useConfirmationModal", () => ({
  useConfirmationModal: () => ({ requestConfirmation: vi.fn(), confirmationModal: null }),
}));

import FormsPage from "@/app/dashboard/forms/page";

describe("Forms builder: New form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    svc.getMyForms.mockResolvedValue({ success: true, data: [] });
    svc.getFormResponseCounts.mockResolvedValue({ success: true, data: {} });
    svc.getFormQuestions.mockResolvedValue({ success: true, data: [] });
  });

  it("opens the create form above the templates, scrolls to it and focuses Title", async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<FormsPage />);
    await waitFor(() => expect(svc.getMyForms).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole("button", { name: "New form" })[0]);

    const section = await screen.findByRole("region", { name: "Create new form" });
    const templates = screen.getByRole("region", { name: "Templates" });
    // The create section comes first in the page, not under eight template cards.
    expect(section.compareDocumentPosition(templates) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(scroll).toHaveBeenCalled();
    expect(screen.getByPlaceholderText("e.g., Membership intake form")).toHaveFocus();
  });

  it("a second press while it is open scrolls back to it rather than closing it", async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<FormsPage />);
    await waitFor(() => expect(svc.getMyForms).toHaveBeenCalled());
    const header = screen.getAllByRole("button", { name: "New form" })[0];
    fireEvent.click(header);
    await screen.findByRole("region", { name: "Create new form" });
    fireEvent.click(header);
    expect(screen.getByRole("region", { name: "Create new form" })).toBeInTheDocument();
    await waitFor(() => expect(scroll).toHaveBeenCalledTimes(2));
  });

  it("creates the form and opens its builder", async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const form = { _id: "f1", title: "Weekly check-in", is_published: false, created_at: "2026-11-23" };
    svc.createForm.mockResolvedValue({ success: true, data: form });
    render(<FormsPage />);
    await waitFor(() => expect(svc.getMyForms).toHaveBeenCalled());
    fireEvent.click(screen.getAllByRole("button", { name: "New form" })[0]);
    fireEvent.change(screen.getByPlaceholderText("e.g., Membership intake form"), {
      target: { value: "Weekly check-in" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create form" }));
    await waitFor(() =>
      expect(svc.createForm).toHaveBeenCalledWith({ title: "Weekly check-in", description: undefined }),
    );
    await waitFor(() => expect(svc.getFormQuestions).toHaveBeenCalledWith("f1"));
  });
});
