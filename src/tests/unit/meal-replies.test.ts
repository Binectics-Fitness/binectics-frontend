import { describe, it, expect } from "vitest";
import {
  MAX_MEAL_REPLY,
  isOwnMealReply,
  mealReplyAuthorName,
  mealReplyError,
  mergeMealFeed,
} from "@/lib/progress/mealReplies";
import type { MealFeedback } from "@/lib/api/progress";
import { resolveNotificationLink } from "@/utils/resolveNotificationLink";
import { UserRole } from "@/lib/types";

const reply = (author: MealFeedback["reply"] extends infer R ? (R extends { author_id: infer A } ? A : never) : never) => ({
  text: "Add greens",
  author_id: author,
  created_at: "2026-10-20T10:00:00Z",
  updated_at: "2026-10-20T10:00:00Z",
});

describe("meal replies", () => {
  it("names the author from the populated reply, else 'Your dietitian'", () => {
    expect(mealReplyAuthorName(reply({ _id: "d1", first_name: "Nadia", last_name: "Hassan" }))).toBe("Nadia Hassan");
    expect(mealReplyAuthorName(reply("d1"))).toBe("Your dietitian");
    expect(mealReplyAuthorName(null)).toBe("Your dietitian");
  });

  it("only the author's own reply is editable", () => {
    expect(isOwnMealReply(reply({ _id: "d1" }), "d1")).toBe(true);
    expect(isOwnMealReply(reply("d1"), "d1")).toBe(true);
    expect(isOwnMealReply(reply({ _id: "d2" }), "d1")).toBe(false);
    expect(isOwnMealReply(undefined, "d1")).toBe(false);
    expect(isOwnMealReply(reply({ _id: "d1" }), undefined)).toBe(false);
  });

  it("checks the text as the API does", () => {
    expect(mealReplyError("   ")).toBe("Write a reply first.");
    expect(mealReplyError("x".repeat(MAX_MEAL_REPLY + 1))).toMatch(/under 1000/);
    expect(mealReplyError(" ok ")).toBeNull();
  });

  it("merges clients' meals newest first, each meal once", () => {
    const meal = (id: string, day: number) => ({ _id: id, meal_date: `2026-10-${String(day).padStart(2, "0")}T12:00:00Z` }) as MealFeedback;
    const out = mergeMealFeed([[meal("a", 1), meal("b", 3)], [meal("b", 3), meal("c", 2)]], 10);
    expect(out.map((m) => m._id)).toEqual(["b", "c", "a"]);
    expect(mergeMealFeed([[meal("a", 1), meal("b", 3)]], 1).map((m) => m._id)).toEqual(["b"]);
  });

  it("a reply notification opens the member's meal log on that meal", () => {
    expect(resolveNotificationLink("/dashboard/member/meal-log?mealId=m1", UserRole.USER)).toBe(
      "/dashboard/member/meal-log?mealId=m1",
    );
  });
});
