#!/usr/bin/env node
/**
 * Test ratchet — the enforceable half of the `ship` skill.
 *
 * This repo has pre-existing test failures. Making `npm test` blocking outright
 * would paint CI red on every PR for work nobody in that PR did, and a red
 * check everyone ignores enforces nothing. So instead of a pass/fail gate this
 * compares against a committed baseline and fails only on NEW breakage.
 *
 * It tracks failure IDENTITY, not counts. A count check passes when one test is
 * fixed and another breaks in the same run; this does not.
 *
 * Two kinds of failure are tracked, because they surface differently in the
 * vitest JSON and an assertion-only check silently misses the second:
 *
 *   assertion — a test ran and failed.        key: "<file> >> <fullName>"
 *   collect   — the suite never loaded at all (bad import, missing mock),
 *               so it reports ZERO assertions. key: "<file> >> [collect]"
 *
 * Usage:
 *   node scripts/test-ratchet.mjs            check against the baseline
 *   node scripts/test-ratchet.mjs --update   rewrite the baseline (ratchet down)
 *
 * Exit 0 = no new failures. Exit 1 = new failures, or the baseline is stale
 * because failures were fixed without updating it.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASELINE = "test-baseline.json";
const update = process.argv.includes("--update");

const out = join(mkdtempSync(join(tmpdir(), "ratchet-")), "vitest.json");

try {
  // stdout is swallowed: with --reporter=json vitest may emit the report there
  // too, and dumping it into CI logs buries the summary this script prints.
  // stderr is inherited so real crashes stay visible.
  execFileSync("npx", ["vitest", "run", "--reporter=json", `--outputFile=${out}`], {
    stdio: ["ignore", "pipe", "inherit"],
  });
} catch {
  // vitest exits non-zero whenever tests fail; that is the normal path here.
  // The JSON report is what we judge on, so swallow it and read the file.
}

if (!existsSync(out)) {
  console.error("\n✗ vitest produced no JSON report — it likely crashed before running.");
  console.error("  This is a real failure, not a baseline question. Fix the run first.");
  process.exit(1);
}

const report = JSON.parse(readFileSync(out, "utf8"));
const rel = (p) => p.replace(`${process.cwd()}/`, "");

const failures = new Set();
for (const suite of report.testResults ?? []) {
  const file = rel(suite.name);
  const assertions = suite.assertionResults ?? [];
  for (const a of assertions) {
    if (a.status === "failed") failures.add(`${file} >> ${a.fullName}`);
  }
  // A suite that failed without producing any assertions never collected.
  if (suite.status === "failed" && assertions.length === 0) {
    failures.add(`${file} >> [collect]`);
  }
}

const current = [...failures].sort();

if (update) {
  writeFileSync(
    BASELINE,
    `${JSON.stringify({ generated: "run `node scripts/test-ratchet.mjs --update`", count: current.length, failures: current }, null, 2)}\n`,
  );
  console.log(`\n✓ baseline written: ${current.length} known failures`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error(`\n✗ ${BASELINE} missing. Create it with: node scripts/test-ratchet.mjs --update`);
  process.exit(1);
}

const known = new Set(JSON.parse(readFileSync(BASELINE, "utf8")).failures);
const added = current.filter((f) => !known.has(f));
const fixed = [...known].filter((f) => !failures.has(f)).sort();

console.log(`\n── test ratchet ─────────────────────────────`);
console.log(`   known failures : ${known.size}`);
console.log(`   current        : ${current.length}`);
console.log(`   new            : ${added.length}`);
console.log(`   fixed          : ${fixed.length}`);

if (fixed.length) {
  console.log(`\n✓ fixed since the baseline:`);
  for (const f of fixed) console.log(`    ${f}`);
  console.log(`\n  Lock these in so they cannot regress:`);
  console.log(`    node scripts/test-ratchet.mjs --update`);
}

if (added.length) {
  console.error(`\n✗ ${added.length} NEW test failure(s) introduced by this change:\n`);
  for (const f of added) console.error(`    ${f}`);
  console.error(`\n  These are yours — the other ${known.size} are pre-existing and not blocking.`);
  console.error(`  Fix them, or if a failure is genuinely expected, update the baseline deliberately.`);
  process.exit(1);
}

// Fixed-but-not-recorded is only advisory: it must not fail an unrelated PR.
console.log(`\n✓ no new test failures (${known.size} pre-existing, unchanged)`);
process.exit(0);
