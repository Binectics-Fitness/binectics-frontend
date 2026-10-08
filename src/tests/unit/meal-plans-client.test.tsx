import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import MealPlansClient from "@/app/dashboard/dietitian/meal-plans/MealPlansClient";
import { progressService, type DietPlan } from "@/lib/api/progress";
import { DietPlanDeliveryType, MealSlot, PlanStatus } from "@/lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/ds/DietitianDashboardShell", () => ({
  DietitianDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const meal = (calories: number) => ({ meal_type: MealSlot.LUNCH, title: "Lunch", foods: [], calories, order: 1 });

const plan = (over: Partial<DietPlan>): DietPlan =>
  ({
    _id: "p",
    professional_id: "pro",
    created_by: "pro",
    title: "Plan",
    delivery_type: DietPlanDeliveryType.PLATFORM,
    status: PlanStatus.ACTIVE,
    meals: [],
    days: [
      { day_of_week: "every_day", meals: [meal(1500)] },
      { day_of_week: "monday", meals: [{ ...meal(400), meal_type: MealSlot.DINNER }] },
    ],
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
    ...over,
  }) as DietPlan;

const TEMPLATE = plan({ _id: "t1", title: "Template week", client_profile_id: null, client_id: null });
const ASSIGNED = plan({
  _id: "a1",
  title: "Assigned week",
  client_profile_id: "cp1",
  client_id: { _id: "u1", first_name: "Bola", last_name: "Ade", email: "b@example.com" },
});
const DOCUMENT = plan({ _id: "d1", title: "PDF plan", delivery_type: DietPlanDeliveryType.DOCUMENT, days: [] });

const card = (title: string) => {
  // The card is the DSCard holding the title; walk up to the one with buttons.
  let el: HTMLElement | null = screen.getByText(title);
  while (el && !within(el).queryByRole("button", { name: "Edit" })) el = el.parentElement;
  return el as HTMLElement;
};

describe("MealPlansClient cards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(progressService, "getProviderDietPlans").mockResolvedValue({
      success: true,
      data: [TEMPLATE, ASSIGNED, DOCUMENT],
    });
    vi.spyOn(progressService, "getMyClientProfiles").mockResolvedValue({ success: true, data: [] });
  });

  it("offers Assign only on platform templates (the server copies templates only)", async () => {
    render(<MealPlansClient />);
    await screen.findByText("Template week");
    expect(within(card("Template week")).getByRole("button", { name: "Assign" })).toBeInTheDocument();
    expect(within(card("Assigned week")).queryByRole("button", { name: "Assign" })).toBeNull();
    expect(within(card("PDF plan")).queryByRole("button", { name: "Assign" })).toBeNull();
  });

  it("shows kcal per day as a range instead of the week's sum", async () => {
    render(<MealPlansClient />);
    await screen.findByText("Template week");
    const c = card("Template week");
    expect(within(c).getByText("Kcal/day")).toBeInTheDocument();
    expect(
      within(c).getByText(`${(1500).toLocaleString()}–${(1900).toLocaleString()}`),
    ).toBeInTheDocument();
  });

  it("opens Assign as a labelled dialog with a named close button", async () => {
    render(<MealPlansClient />);
    await screen.findByText("Template week");
    fireEvent.click(within(card("Template week")).getByRole("button", { name: "Assign" }));
    const dialog = await screen.findByRole("dialog", { name: "Assign to client" });
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("the builder is a labelled dialog whose day tabs expose aria-pressed", async () => {
    render(<MealPlansClient />);
    await screen.findByText("Template week");
    fireEvent.click(within(card("Template week")).getByRole("button", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit meal plan" });
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    const everyDay = within(dialog).getByRole("button", { name: /^Every day/ });
    const monday = within(dialog).getByRole("button", { name: /^Monday/ });
    expect(everyDay).toHaveAttribute("aria-pressed", "true");
    expect(monday).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(monday);
    expect(monday).toHaveAttribute("aria-pressed", "true");
    expect(everyDay).toHaveAttribute("aria-pressed", "false");
  });
});

describe("MealPlansClient builder keyboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(progressService, "getProviderDietPlans").mockResolvedValue({ success: true, data: [TEMPLATE] });
  });

  const openBuilder = async () => {
    render(<MealPlansClient />);
    await screen.findByText("Template week");
    const trigger = screen.getByRole("button", { name: /New meal plan/ });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "New meal plan" });
    return { trigger, dialog };
  };

  it("moves focus to the title field on open", async () => {
    const { dialog } = await openBuilder();
    expect(document.activeElement).toBe(within(dialog).getByPlaceholderText(/Mediterranean week/));
  });

  it("traps Tab and Shift+Tab inside the dialog", async () => {
    const { dialog } = await openBuilder();
    const close = within(dialog).getByRole("button", { name: "Close" });
    const buttons = within(dialog).getAllByRole("button");
    const last = buttons[buttons.length - 1];
    close.focus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    // Focus that fell to <body> is pulled back in.
    (document.activeElement as HTMLElement).blur();
    fireEvent.keyDown(document.body, { key: "Tab" });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("Escape closes a clean builder and returns focus to the trigger", async () => {
    const { trigger, dialog } = await openBuilder();
    fireEvent.keyDown(within(dialog).getByPlaceholderText(/Mediterranean week/), { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "New meal plan" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("Escape on a dirty builder goes through the discard guard", async () => {
    const { dialog } = await openBuilder();
    const title = within(dialog).getByPlaceholderText(/Mediterranean week/);
    fireEvent.change(title, { target: { value: "Draft" } });
    fireEvent.keyDown(title, { key: "Escape" });
    expect(await screen.findByText("Discard changes?")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "New meal plan" })).toBeInTheDocument();
  });
});
