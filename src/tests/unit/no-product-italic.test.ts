import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Owner ruling, Oct 14 2026: no serif italic on product screens ("the italic
 * thing ... looks odd"). This reverses the Oct 6 "one serif word per title"
 * rule. Product titles go through TitleWithEmphasis / PageHeader /
 * SuccessTakeover, which now render plain.
 *
 * Marketing pages (home, about, pricing, for-*, features, legal, privacy,
 * contact, qr-help, marketplace) keep their serif moments and are not
 * scanned here. The rich-text editor's italic button is a user formatting
 * control, not decoration, and lives outside these paths.
 */
const ROOT = resolve(__dirname, "../..");

/** Signed-in routes (middleware protectedRoutes), auth, and account-state pages. */
const PRODUCT_DIRS = [
  "app/dashboard",
  "app/member",
  "app/admin",
  "app/check-in",
  "app/checkout",
  "app/teams",
  "app/onboarding",
  "app/login",
  "app/register",
  "app/forgot-password",
  "app/reset-password",
  "app/verify-email",
  "app/verification",
  "app/account-deleted",
  "app/account-locked",
  "app/account-suspended",
  "app/session-expired",
  "app/rate-limit",
  "app/maintenance",
  "components/ds",
];
const PRODUCT_FILES = ["components/AccountStatePanel.tsx"];
/** A marketing mockup of the member app, shown on /for-members only. */
const MARKETING_EXCEPTIONS = new Set(["components/ds/MemberDemo.tsx"]);

const ITALIC = [
  /\bfont-serif\b/,
  /--font-serif/,
  /className="[^"]*\bitalic\b/,
  /fontStyle:\s*["']italic["']/,
  /font-style:\s*italic/,
  /<em[\s>]/,
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "__tests__") walk(full, out);
    } else if (/\.(tsx?|css)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

describe("no serif italic on product screens", () => {
  const files = [
    ...PRODUCT_DIRS.flatMap((d) => walk(join(ROOT, d))),
    ...PRODUCT_FILES.map((f) => join(ROOT, f)),
  ].filter((f) => !MARKETING_EXCEPTIONS.has(relative(ROOT, f)));

  it("scans the product source", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("finds no italic or serif styling", () => {
    const hits: string[] = [];
    for (const file of files) {
      const lines = stripComments(readFileSync(file, "utf8")).split("\n");
      lines.forEach((line, i) => {
        if (ITALIC.some((re) => re.test(line))) hits.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
