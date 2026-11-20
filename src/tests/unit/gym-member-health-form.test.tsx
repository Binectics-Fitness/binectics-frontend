import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HealthFormCard, showsHealthCard } from "@/app/dashboard/gym-owner/members/[memberId]/HealthFormCard";
import { healthFormsService, type StaffHealthForm } from "@/lib/api/healthForms";
import { HEALTH_FORM_COPY as C } from "@/lib/constants/healthFormCopy";
import { DEFAULT_BOOKING_RULES } from "@/lib/constants/orgSettingsDefaults";

/** Board parq W1-W3: the gym member page's health form card. */
vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({ fmtDate: (d: string) => `D(${d.slice(0, 10)})` }),
}));

const base: StaffHealthForm = {
  required: true,
  status: "pending",
  sent_at: "2026-11-02T08:00:00.000Z",
  submitted_at: null,
  needs_follow_up: false,
  followed_up_at: null,
  followed_up_by_name: null,
};
const ok = <T,>(data: T) => ({ success: true, data }) as never;

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <HealthFormCard orgId="o1" memberUserId="m1" />
    </QueryClientProvider>,
  );

describe("HealthFormCard", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("W2: not done, with the date it was sent", async () => {
    vi.spyOn(healthFormsService, "status").mockResolvedValue(ok(base));
    renderCard();
    expect(await screen.findByText(C.notDone)).toBeInTheDocument();
    expect(screen.getByText(C.cardTitle)).toBeInTheDocument();
    expect(screen.getByText(C.notDonePill)).toBeInTheDocument();
    expect(screen.getByText(C.sentOn("D(2026-11-02)"))).toBeInTheDocument();
    expect(screen.queryByText(C.showAnswers)).toBeNull();
  });

  it("W1: the flag; answers only on request; mark followed up", async () => {
    const done = { ...base, status: "done" as const, submitted_at: "2026-11-03T08:00:00.000Z", needs_follow_up: true };
    vi.spyOn(healthFormsService, "status").mockResolvedValue(ok(done));
    const answers = vi.spyOn(healthFormsService, "answers").mockResolvedValue(
      ok({
        ...done,
        answers: [
          { index: 4, label: "Bone or joint problem?", type: "MULTIPLE_CHOICE", value: "yes" },
          { index: 7, label: "Details", type: "TEXTAREA", value: "Left knee" },
        ],
      }),
    );
    vi.spyOn(healthFormsService, "markFollowedUp").mockResolvedValue(
      ok({ ...done, followed_up_at: "2026-11-04T08:00:00.000Z", followed_up_by_name: "Ada Eze" }),
    );
    renderCard();
    expect(await screen.findByText(C.flag)).toBeInTheDocument();
    expect(screen.getByText(C.donePill)).toBeInTheDocument();
    expect(screen.getByText(C.doneOn("D(2026-11-03)"))).toBeInTheDocument();
    expect(answers).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText(C.showAnswers));
    expect(await screen.findByText(C.yes)).toBeInTheDocument();
    expect(screen.getByText("Left knee")).toBeInTheDocument();
    expect(screen.getByText(C.hideAnswers)).toBeInTheDocument();
    await userEvent.click(screen.getByText(C.markFollowedUp));
    await waitFor(() => expect(screen.getByText(C.followedUp("Ada Eze", "D(2026-11-04)"))).toBeInTheDocument());
    expect(screen.queryByText(C.flag)).toBeNull();
  });

  it("nothing for a refused read, or a gym that does not ask and sent nothing", async () => {
    vi.spyOn(healthFormsService, "status").mockResolvedValue({ success: false, message: "Forbidden" } as never);
    const { container } = renderCard();
    await waitFor(() => expect(healthFormsService.status).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(showsHealthCard({ ...base, required: false, status: "not_sent" })).toBe(false);
    expect(showsHealthCard({ ...base, required: false, status: "done" })).toBe(true);
  });

  it("an org that never saved booking rules shows the switch off", () => {
    expect(DEFAULT_BOOKING_RULES.require_parq).toBe(false);
  });
});
