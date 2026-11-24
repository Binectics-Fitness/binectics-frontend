// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "tailwindcss";
import { describe, expect, it } from "vitest";

/**
 * Touch targets must be at least 44px (WCAG 2.5.5, Apple HIG).
 *
 * The root font size is 15px, so Tailwind's rem steps are 15/16 of their
 * usual size: the stock min-h-11 (2.75rem) is 41.25px. globals.css fixes
 * that centrally with a px token, --touch-target: 44px, exposed as
 * min-h-touch / min-w-touch / h-touch / w-touch / size-touch, and pins step
 * 11 (the app's "44px" class everywhere) to the same token.
 *
 * This test compiles the real globals.css with Tailwind and checks the
 * utilities, so a change to the root size, the token or the theme that
 * shrinks a target fails here. It also stops a new base (non-responsive)
 * min-h-1..10, which in this codebase only ever means a tap target sized
 * under 44px. md:/lg: variants are desktop pointer sizes and stay allowed.
 * min-w is not scanned: small min-w steps size count badges, not targets.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SRC = join(ROOT, "src");
const GLOBALS = join(SRC, "app/globals.css");
const require = createRequire(join(ROOT, "package.json"));

async function buildUtilities(candidates: string[]): Promise<string> {
  const compiler = await compile(readFileSync(GLOBALS, "utf8"), {
    base: ROOT,
    loadStylesheet: async (id, base) => {
      const path = require.resolve(id === "tailwindcss" ? "tailwindcss/index.css" : id);
      return { path, base, content: readFileSync(path, "utf8") };
    },
  });
  return compiler.build(candidates);
}

/** The declarations Tailwind emitted for one class, e.g. "min-height: var(--touch-target);". */
function rule(css: string, className: string): string {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = css.match(new RegExp(`\\.${escaped}\\s*\\{([^}]*)\\}`));
  return m ? m[1].trim() : "";
}

describe("touch targets are 44px", () => {
  it("--touch-target is 44px in px, not rem (the root is 15px)", () => {
    const css = readFileSync(GLOBALS, "utf8");
    const root = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")));
    expect(root).toMatch(/--touch-target:\s*44px;/);
  });

  const SIZED = {
    "min-h-11": ["min-height"],
    "min-w-11": ["min-width"],
    "h-11": ["height"],
    "w-11": ["width"],
    "size-11": ["width", "height"],
    "min-h-touch": ["min-height"],
    "min-w-touch": ["min-width"],
    "h-touch": ["height"],
    "w-touch": ["width"],
    "size-touch": ["width", "height"],
  } as const;

  it.each(Object.entries(SIZED))("%s resolves to var(--touch-target)", async (cls, props) => {
    const css = await buildUtilities([cls]);
    const body = rule(css, cls);
    for (const prop of props) expect(body).toContain(`${prop}: var(--touch-target);`);
  });

  it("other spacing steps keep the default multiplier", async () => {
    const css = await buildUtilities(["h-10", "h-12"]);
    expect(rule(css, "h-10")).toContain("calc(var(--spacing) * 10)");
    expect(rule(css, "h-12")).toContain("calc(var(--spacing) * 12)");
  });
});

// Base min-h-1..10 that predate the guard. Each is a dense
// desktop control; fix (and remove from here) rather than add to it.
const KNOWN_UNDERSIZED = new Set([
  "src/app/dashboard/gym-owner/schedule/[classId]/AttendanceControl.tsx: min-h-8",
  "src/components/ds/MultiSelect.tsx: min-h-9",
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "tests" || name === "__tests__") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

// No variant prefix (a ":" before it would make it md:, hover:, ...).
const UNDERSIZED_MIN = /(?<![\w:\-[])min-h-(10|[1-9](?:\.5)?)(?![\w.\-/])/g;

describe("no new tap targets under 44px", () => {
  it("does not add a base min-h-1..10 (use min-h-touch)", () => {
    const found: string[] = [];
    for (const file of walk(SRC)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(UNDERSIZED_MIN)) {
        const key = `${relative(ROOT, file)}: ${m[0]}`;
        if (!KNOWN_UNDERSIZED.has(key)) found.push(key);
      }
    }
    expect(found).toEqual([]);
  });
});
