// Unit tests for FeedbackPrompt logic — score validation and snooze persistence.

import { describe, it, expect, beforeEach, vi } from "vitest";

const SNOOZE_KEY = "feedback_prompt_snoozed_until";
const SNOOZE_HOURS = 24;

function isSnoozed(now: number): boolean {
  const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
  return Boolean(snoozedUntil && now < snoozedUntil);
}

function snoozeNow(now: number): void {
  localStorage.setItem(SNOOZE_KEY, String(now + SNOOZE_HOURS * 60 * 60 * 1000));
}

describe("FeedbackPrompt logic", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("snooze behavior", () => {
    it("considers prompt not-snoozed when localStorage is empty", () => {
      expect(isSnoozed(Date.now())).toBe(false);
    });

    it("snoozes for 24 hours after dismissal", () => {
      const now = Date.now();
      snoozeNow(now);
      expect(isSnoozed(now)).toBe(true);
      expect(isSnoozed(now + 23 * 60 * 60 * 1000)).toBe(true);
      expect(isSnoozed(now + 25 * 60 * 60 * 1000)).toBe(false);
    });

    it("clears snooze flag explicitly", () => {
      snoozeNow(Date.now());
      localStorage.removeItem(SNOOZE_KEY);
      expect(isSnoozed(Date.now())).toBe(false);
    });
  });

  describe("score validation", () => {
    const isValidScore = (s: number) =>
      Number.isInteger(s) && s >= 1 && s <= 5;

    it.each([1, 2, 3, 4, 5])("accepts valid score %i", (s) => {
      expect(isValidScore(s)).toBe(true);
    });

    it.each([0, 6, -1, 1.5, NaN])("rejects invalid score %s", (s) => {
      expect(isValidScore(s)).toBe(false);
    });

    it("classifies 4 and 5 as positive (CSAT KPI)", () => {
      const positive = [4, 5].every((s) => s >= 4);
      const negative = [1, 2, 3].every((s) => s < 4);
      expect(positive).toBe(true);
      expect(negative).toBe(true);
    });
  });
});
