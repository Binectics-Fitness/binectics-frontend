import { CLIENT_PAGE_COPY as COACH_COPY, SESSION_LABEL } from "@/app/dashboard/trainer/clients/[clientId]/copy";

/**
 * Every string on the dietitian's client page. It is the coach client page
 * (trainer copy, board binectics-plans/design/coach-client-page) with the
 * dietitian's own words where they differ, plus the meal plan section from
 * mobile ClientMealPlansSection. Logged meals keep their copy in
 * components/clients/ClientMealsCard.tsx.
 */
export const DIETITIAN_CLIENT_COPY = {
  ...COACH_COPY,
  notePlaceholder: "How eating is going, what to work on next",
  allSessions: "All consultations",
  mealPlans: "Meal plans",
  mealPlansLoadFailed: "Couldn't load their meal plans.",
  noMealPlan: "No meal plan yet.",
  giveMealPlan: "Give a meal plan",
  giveAnother: "Give another meal plan",
  paused: "Paused",
  mealCount: (n: number) => `${n} meal${n === 1 ? "" : "s"}`,
  document: (file?: string) => (file ? `Document · ${file}` : "Document"),
  assigned: (date: string) => `assigned ${date}`,
  // The template picker.
  pickerTitle: "Give a meal plan",
  pickerHelp: "They get their own copy. Later edits to the template won't change it.",
  template: "Template",
  loadingTemplates: "Loading templates…",
  pickTemplate: "Pick a template…",
  templatesFailed: "Couldn't load your templates.",
  noTemplates: "No templates yet.",
  newMealPlan: "New meal plan",
  give: "Give plan",
  giving: "Giving…",
  cancel: "Cancel",
  given: (title: string, first: string) => `${title} given to ${first}`,
  giveFailed: "Couldn't give the plan. Try again.",
} as const;

export { SESSION_LABEL };
