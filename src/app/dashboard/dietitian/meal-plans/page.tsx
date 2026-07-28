import type { Metadata } from "next";
import MealPlansClient from "./MealPlansClient";

export const metadata: Metadata = {
  title: "Meal plans",
  description: "Reusable plan templates you can assign to clients",
};

/**
 * Real diet-plan manager backed by the progress API (provider diet plans).
 * `?new=1` opens the create form immediately (used by the New plan launcher).
 */
export default async function DietitianMealPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const sp = await searchParams;
  return <MealPlansClient initialCreateOpen={sp?.new === "1"} />;
}
