import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { assertLegalReady, findLegalProblems, isProductionDeploy, LEGAL_DOCS_FILE } from "./legalReady";

const DONE = `export const LEGAL_STATUS: Record<DocType, "draft" | "reviewed"> = { privacy: "reviewed", terms: "reviewed", cookies: "reviewed" };`;

describe("legal readiness check", () => {
  it("finds placeholders and draft documents", () => {
    const p = findLegalProblems(`x [OWNER TO SUPPLY: legal name] y [OWNER TO SUPPLY: DPO email]
      export const LEGAL_STATUS = { privacy: "draft", terms: "reviewed" };`);
    expect(p.placeholders).toEqual(["legal name", "DPO email"]);
    expect(p.drafts).toEqual(["privacy"]);
  });

  it("passes a finished, reviewed document", () => {
    expect(findLegalProblems(`Operated by Example Ltd. ${DONE}`)).toEqual({ placeholders: [], drafts: [] });
  });

  it("treats Netlify and Vercel production, and LEGAL_CHECK=strict, as production", () => {
    expect(isProductionDeploy({ CONTEXT: "production" })).toBe(true);
    expect(isProductionDeploy({ VERCEL_ENV: "production" })).toBe(true);
    expect(isProductionDeploy({ LEGAL_CHECK: "strict" })).toBe(true);
    expect(isProductionDeploy({ CONTEXT: "deploy-preview" })).toBe(false);
    expect(isProductionDeploy({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isProductionDeploy({})).toBe(false);
  });

  it("fails a production build on today's drafts, and only warns on a preview", () => {
    const source = readFileSync(LEGAL_DOCS_FILE, "utf8");
    expect(findLegalProblems(source).placeholders.length).toBeGreaterThan(0);
    expect(() => assertLegalReady({ CONTEXT: "production" })).toThrow(/not ready for production/);
    expect(() => assertLegalReady({ CONTEXT: "deploy-preview" })).not.toThrow();
  });
});
