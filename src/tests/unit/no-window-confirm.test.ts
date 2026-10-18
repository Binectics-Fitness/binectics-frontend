import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

/**
 * Product code asks for confirmation through the app's own dialog
 * (useConfirmationModal → ConfirmationModal: labelled, focus-trapped,
 * Escape-aware, and held open while the action is pending). The browser's
 * native confirm is none of those, so it must not come back.
 */

const SRC = join(__dirname, "..", "..");
const NATIVE_CONFIRM = /\b(?:window|globalThis)\s*\.\s*confirm\s*\(/;

function isTestPath(rel: string): boolean {
  return (
    /\.test\.[cm]?[jt]sx?$/.test(rel) ||
    rel.split("/").some((part) => part === "__tests__" || part === "tests" || part === "test")
  );
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.[cm]?[jt]sx?$/.test(name)) out.push(full);
  }
  return out;
}

describe("no native confirm in product code", () => {
  it("finds no window.confirm( outside tests", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const rel = relative(SRC, file).split("\\").join("/");
      if (isTestPath(rel)) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (NATIVE_CONFIRM.test(line)) offenders.push(`src/${rel}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(offenders, "Use useConfirmationModal instead of window.confirm").toEqual([]);
  });

  it("would catch one", () => {
    expect(NATIVE_CONFIRM.test('if (!window.confirm("Delete?")) return;')).toBe(true);
    expect(NATIVE_CONFIRM.test("onClick={() => void confirm()}")).toBe(false);
  });
});
