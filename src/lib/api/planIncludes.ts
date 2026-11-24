import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import { DietPlanDeliveryType } from "@/lib/types";
import { normalizeAccess } from "./paidContent";
import type { ProgramTemplate } from "./programs";
import type { DietPlan } from "./progress";

/**
 * What a membership plan includes (binectics-api src/content-access,
 * PlanIncludesController): paid programs and paid library meal plans that
 * come with the plan. GET/PUT /marketplace/organizations/:org/plans/:plan/includes,
 * both behind marketplace:manage_listing (the owner holds it).
 *
 * PUT replaces the whole list. Added items become paid; items taken out stay
 * with current members until their plan ends. Mirrors mobile api/planIncludes.
 */

export interface IncludedItem {
  id: string;
  name: string;
}

export interface PlanIncludes {
  programs: IncludedItem[];
  mealPlans: IncludedItem[];
}

const idOf = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "_id" in v) return String((v as { _id: unknown })._id);
  return String(v ?? "");
};

function nameList(rows: unknown, key: "name" | "title"): IncludedItem[] {
  if (!Array.isArray(rows)) return [];
  return (rows as Record<string, unknown>[])
    .map((r) => ({
      id: idOf(r?.id ?? r?._id),
      name: String((key === "name" ? r?.name : r?.title) ?? "").trim() || "Untitled",
    }))
    .filter((r) => r.id);
}

/** The API's includes payload, kept only when well-formed. */
export function normalizePlanIncludes(raw: unknown): PlanIncludes {
  const d = (raw ?? {}) as { programs?: unknown; meal_plans?: unknown };
  return { programs: nameList(d.programs, "name"), mealPlans: nameList(d.meal_plans, "title") };
}

const url = (orgId: string, planId: string) =>
  `/marketplace/organizations/${encodeURIComponent(orgId)}/plans/${encodeURIComponent(planId)}/includes`;

export const planIncludesService = {
  /** What the plan includes now. */
  async get(orgId: string, planId: string): Promise<ApiResponse<PlanIncludes>> {
    const res = await apiClient.get<unknown>(url(orgId, planId));
    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: normalizePlanIncludes(res.data) };
  },

  /** Replace what the plan includes. */
  async set(orgId: string, planId: string, programIds: string[], mealPlanIds: string[]): Promise<ApiResponse<unknown>> {
    return apiClient.put<unknown>(url(orgId, planId), { program_ids: programIds, meal_plan_ids: mealPlanIds });
  },
};

// ─── Pick-lists ─────────────────────────────────────────────────────────────

const paid = (access: unknown) => normalizeAccess(access)?.mode === "paid";

/** The provider's paid programs, not archived. */
export function pickablePrograms(rows: readonly ProgramTemplate[]): IncludedItem[] {
  return rows
    .filter((p) => p.status !== "archived" && paid(p.access))
    .map((p) => ({ id: p._id, name: p.name?.trim() || "Untitled" }));
}

/** The provider's paid library meal plans: not client copies, not PDFs, not archived. */
export function pickableMealPlans(rows: readonly DietPlan[]): IncludedItem[] {
  return rows
    .filter(
      (m) =>
        m.client_profile_id == null &&
        m.client_id == null &&
        m.delivery_type !== DietPlanDeliveryType.DOCUMENT &&
        String(m.status) !== "archived" &&
        paid(m.access),
    )
    .map((m) => ({ id: m._id, name: m.title?.trim() || "Untitled" }));
}

/** A pick-list with the items already included added, so nothing included is ever hidden. */
export function withIncluded(list: readonly IncludedItem[], included: readonly IncludedItem[]): IncludedItem[] {
  return [...list, ...included.filter((e) => !list.some((l) => l.id === e.id))];
}

/** The same ids, in any order. */
export function sameIds(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((x) => set.has(x));
}

/** The sentence under "Includes" in the plan editor. */
export function includesCopy(planName: string): string {
  const name = planName.trim();
  return `Members who buy ${name ? `“${name}”` : "this plan"} also get these programs and meal plans.`;
}
