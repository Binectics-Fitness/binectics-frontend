import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HealthFormClient } from "@/app/dashboard/member/health-forms/[id]/HealthFormClient";
import { HealthFormRows, PARQ_QUESTION_COUNT } from "@/app/dashboard/member/_components/HealthFormRows";
import { buildHealthFormAnswers } from "@/app/dashboard/member/health-forms/[id]/healthFormAnswers";
import { myHealthFormsService, type MyHealthFormDetail } from "@/lib/api/healthForms";
import { HEALTH_FORM_COPY as C } from "@/lib/constants/healthFormCopy";

/** The member fills in the gym's PAR-Q on web (parity with mobile #273; board parq M1-M5). */

const ADVICE =
  "A yes answer does not necessarily mean you cannot train, but please speak with your doctor before becoming much more physically active.";
const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];
const LABELS = [
  "Has your doctor ever said that you have a heart condition and that you should only do physical activity recommended by a doctor?",
  "Do you feel pain in your chest when you do physical activity?",
  "In the past month, have you had chest pain when you were not doing physical activity?",
  "Do you lose your balance because of dizziness, or do you ever lose consciousness?",
  "Do you have a bone or joint problem (for example, back, knee or hip) that could be made worse by a change in your physical activity?",
  "Is your doctor currently prescribing medication for your blood pressure or a heart condition?",
  "Do you know of any other reason why you should not do physical activity?",
];

/** The API's reply for GET /me/health-forms/:id (the PAR-Q template). */
const FORM: MyHealthFormDetail = {
  id: "hf1",
  organization_id: "o1",
  organization_name: "Ikoyi Strength",
  status: "pending",
  sent_at: "2026-11-20T08:00:00.000Z",
  submitted_at: null,
  title: "PAR-Q health screening",
  questions: [
    ...LABELS.map((label, index) => ({
      index,
      type: "MULTIPLE_CHOICE",
      label,
      help_text: null,
      is_required: true,
      options: YES_NO,
    })),
    {
      index: 7,
      type: "TEXTAREA",
      label: "If you answered yes to any question, please give details",
      help_text: ADVICE,
      is_required: false,
      options: [],
    },
  ],
  answers: [],
  advice: null,
};

const ok = <T,>(data: T) => ({ success: true, data }) as never;

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const get = vi.spyOn(myHealthFormsService, "get");
const submit = vi.spyOn(myHealthFormsService, "submit");
const list = vi.spyOn(myHealthFormsService, "list");

/** Picks No on every yes/no question, or Yes on the given ones. */
async function answerAll(yesOn: number[] = []) {
  for (let i = 0; i < LABELS.length; i++) {
    const group = screen.getByRole("radiogroup", { name: new RegExp(`^${i + 1}\\. `) });
    await userEvent.click(within(group).getByRole("radio", { name: yesOn.includes(i) ? "Yes" : "No" }));
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue(ok(FORM));
  submit.mockReset();
});

describe("HealthFormClient: the form (M2, M3)", () => {
  it("shows the intro, the privacy line, the count and the template's questions as labelled radio groups", async () => {
    wrap(<HealthFormClient id="hf1" />);
    expect(await screen.findByText(C.formIntro("Ikoyi Strength"))).toBeInTheDocument();
    expect(screen.getByText(C.formPrivacy("Ikoyi Strength"))).toBeInTheDocument();
    expect(screen.getByText(C.formCount(8))).toBeInTheDocument();
    expect(screen.getAllByRole("radiogroup")).toHaveLength(7);
    expect(screen.getByRole("radiogroup", { name: `1. ${LABELS[0]} (required)` })).toBeInTheDocument();
    // The doctor advice sits with the details question, in full.
    expect(screen.getByText(ADVICE)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /please give details/ })).toBeInTheDocument();
    expect(screen.getByText(C.answered(0, 8))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: C.send })).toBeInTheDocument();
  });

  it("radios work from the keyboard", async () => {
    wrap(<HealthFormClient id="hf1" />);
    const group = await screen.findByRole("radiogroup", { name: /^1\. / });
    const yes = within(group).getByRole("radio", { name: "Yes" });
    yes.focus();
    await userEvent.keyboard(" ");
    expect(yes).toBeChecked();
    await userEvent.keyboard("{ArrowRight}");
    expect(within(group).getByRole("radio", { name: "No" })).toBeChecked();
  });

  it("a missing yes/no is caught on the page and nothing is sent", async () => {
    wrap(<HealthFormClient id="hf1" />);
    await userEvent.click(await screen.findByRole("button", { name: C.send }));
    expect(screen.getByRole("alert")).toHaveTextContent("7 questions need attention");
    expect(screen.getAllByText(C.required)).toHaveLength(7);
    expect(screen.getByRole("radiogroup", { name: /^1\. / })).toHaveAttribute("aria-invalid", "true");
    // Focus moves to the first question that needs an answer.
    expect(document.activeElement).toBe(within(screen.getByRole("radiogroup", { name: /^1\. / })).getAllByRole("radio")[0]);
    expect(submit).not.toHaveBeenCalled();
  });

  it("one missing answer is named in the singular, and its error clears once answered", async () => {
    wrap(<HealthFormClient id="hf1" />);
    await screen.findByRole("button", { name: C.send });
    for (let i = 0; i < 6; i++) {
      await userEvent.click(within(screen.getByRole("radiogroup", { name: new RegExp(`^${i + 1}\\. `) })).getByRole("radio", { name: "No" }));
    }
    await userEvent.click(screen.getByRole("button", { name: C.send }));
    expect(screen.getByRole("alert")).toHaveTextContent("1 question needs attention");
    const last = screen.getByRole("radiogroup", { name: /^7\. / });
    expect(last).toHaveAttribute("aria-invalid", "true");
    await userEvent.click(within(last).getByRole("radio", { name: "Yes" }));
    expect(last).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText(C.required)).toBeNull();
    expect(screen.getByText(C.answered(7, 8))).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });
});

describe("HealthFormClient: sending (M4, M5)", () => {
  it("all no sends every yes/no by index, leaves out the empty details, and shows the plain confirmation", async () => {
    submit.mockResolvedValue(ok({ id: "hf1", status: "done", submitted_at: "x", any_yes: false, advice: null }));
    wrap(<HealthFormClient id="hf1" />);
    await screen.findByRole("button", { name: C.send });
    await answerAll();
    await userEvent.click(screen.getByRole("button", { name: C.send }));
    expect(await screen.findByText(C.doneTitle("Ikoyi Strength"))).toBeInTheDocument();
    expect(screen.getByText(C.doneBody)).toBeInTheDocument();
    expect(screen.queryByTestId("health-form-advice")).toBeNull();
    expect(submit).toHaveBeenCalledWith(
      "hf1",
      LABELS.map((_, index) => ({ index, value: "no" })),
    );
    expect(screen.getByRole("link", { name: C.doneButton })).toHaveAttribute("href", "/dashboard/member");
  });

  it("a yes, with details, is sent as given and the API's advice is shown once", async () => {
    submit.mockResolvedValue(ok({ id: "hf1", status: "done", submitted_at: "x", any_yes: true, advice: ADVICE }));
    wrap(<HealthFormClient id="hf1" />);
    await screen.findByRole("button", { name: C.send });
    await answerAll([4]);
    await userEvent.type(screen.getByRole("textbox", { name: /please give details/ }), "Old knee injury");
    await userEvent.click(screen.getByRole("button", { name: C.send }));
    expect(await screen.findByTestId("health-form-advice")).toHaveTextContent(ADVICE);
    expect(screen.getAllByText(ADVICE)).toHaveLength(1);
    const sent = submit.mock.calls[0][1];
    expect(sent.find((a) => a.index === 4)?.value).toBe("yes");
    expect(sent.find((a) => a.index === 7)?.value).toBe("Old knee injury");
    expect(sent).toHaveLength(8);
  });

  it("a form sent elsewhere meanwhile (409) reloads and opens on the confirmation", async () => {
    submit.mockResolvedValue({ success: false, status: 409, code: "HEALTH_FORM_ALREADY_SENT", message: "You already sent this form." } as never);
    wrap(<HealthFormClient id="hf1" />);
    await screen.findByRole("button", { name: C.send });
    await answerAll();
    get.mockResolvedValue(ok({ ...FORM, status: "done", submitted_at: "2026-11-21T08:00:00.000Z" }));
    await userEvent.click(screen.getByRole("button", { name: C.send }));
    expect(await screen.findByText(C.doneTitle("Ikoyi Strength"))).toBeInTheDocument();
  });

  it("any other refusal shows the API's words and keeps the answers", async () => {
    submit.mockResolvedValue({ success: false, status: 400, message: "Answer yes or no to question 3." } as never);
    wrap(<HealthFormClient id="hf1" />);
    await screen.findByRole("button", { name: C.send });
    await answerAll();
    await userEvent.click(screen.getByRole("button", { name: C.send }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Answer yes or no to question 3.");
    expect(within(screen.getByRole("radiogroup", { name: /^1\. / })).getByRole("radio", { name: "No" })).toBeChecked();
  });
});

describe("HealthFormClient: already sent, and load failure", () => {
  it("a form already sent opens on the confirmation, with the advice when it had a yes", async () => {
    get.mockResolvedValue(ok({ ...FORM, status: "done", submitted_at: "2026-11-21T08:00:00.000Z", advice: ADVICE }));
    wrap(<HealthFormClient id="hf1" />);
    expect(await screen.findByText(C.doneTitle("Ikoyi Strength"))).toBeInTheDocument();
    expect(screen.getByTestId("health-form-advice")).toHaveTextContent(ADVICE);
    expect(screen.queryByRole("button", { name: C.send })).toBeNull();
  });

  it("a form that can't be read says so, with Try again", async () => {
    get.mockResolvedValueOnce({ success: false, status: 404, message: "Health form not found" } as never);
    wrap(<HealthFormClient id="hf1" />);
    expect(await screen.findByRole("alert")).toHaveTextContent(C.loadFailed);
    await userEvent.click(screen.getByRole("button", { name: C.tryAgain }));
    expect(await screen.findByText(C.formIntro("Ikoyi Strength"))).toBeInTheDocument();
  });
});

describe("buildHealthFormAnswers", () => {
  it("rejects a value that is not one of the options", () => {
    const { answers, errors } = buildHealthFormAnswers(FORM.questions, { 0: "maybe" });
    expect(errors[0]).toBe(C.chooseOption);
    expect(errors[1]).toBe(C.required);
    expect(errors[7]).toBeUndefined();
    expect(answers).toEqual([]);
  });
});

describe("HealthFormRows (M1)", () => {
  it("one row per pending form, linking to it; sent forms are left out", async () => {
    list.mockResolvedValue(
      ok([
        { id: "hf1", organization_id: "o1", organization_name: "Ikoyi Strength", status: "pending", sent_at: null, submitted_at: null },
        { id: "hf2", organization_id: "o2", organization_name: "Lekki Lift", status: "done", sent_at: null, submitted_at: "x" },
      ]),
    );
    wrap(<HealthFormRows />);
    const link = await screen.findByRole("link", { name: new RegExp(C.taskTitle) });
    expect(link).toHaveAttribute("href", "/dashboard/member/health-forms/hf1");
    expect(link).toHaveTextContent(C.taskMeta("Ikoyi Strength", PARQ_QUESTION_COUNT));
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("renders nothing when none is pending or the read fails", async () => {
    list.mockResolvedValue({ success: false, status: 500 } as never);
    const { container } = wrap(<HealthFormRows />);
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
