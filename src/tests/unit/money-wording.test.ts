import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Where provider money goes (owner ruling, Oct 20 2026): straight to the
 * provider's own Paystack account once they connect one; until then the
 * platform collects it and pays it out after verification. "Binectics never
 * holds money" was wrong, and so was "1:1 sessions are always collected by
 * Binectics" (since api #189 they use the provider's own key too).
 */
const SENTENCE =
  "Payments go straight to your own Paystack account when you've connected one. Until then, Binectics collects them and pays them out to you after verification.";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const PROVIDER_FACING = [
  "src/app/dashboard/gym-owner/payouts/page.tsx",
  "src/app/onboarding/_gym.tsx",
  "src/app/onboarding/_trainer.tsx",
  "src/app/onboarding/_dietitian.tsx",
  "src/app/pricing/page.tsx",
  "src/app/for-trainers/page.tsx",
];

const MONEY_COPY = [
  ...PROVIDER_FACING,
  "src/app/page.tsx",
  "src/app/about/page.tsx",
  "src/app/help/page.tsx",
  "src/app/features/multi-currency/page.tsx",
  "src/components/provider/GatewaysSection.tsx",
  "src/lib/provider/setupSteps.ts",
];

describe("money wording", () => {
  it.each(PROVIDER_FACING)("%s uses the agreed sentence", (path) => {
    expect(read(path)).toContain(SENTENCE);
  });

  it.each(MONEY_COPY)("%s makes no wrong claim about held money or sessions", (path) => {
    const src = read(path);
    expect(src).not.toMatch(/never holds?\b/i);
    expect(src).not.toMatch(/1:1 sessions?(, and memberships)?[^."]*collected by Binectics/i);
    expect(src).not.toMatch(/Binectics collects 1:1/i);
  });
});
