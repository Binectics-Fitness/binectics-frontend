#!/usr/bin/env node
/**
 * Sync design tokens from the Binectics design system into globals.css.
 *
 * Source of truth: `binectics-design-system/shared.css` — the token block the
 * design prototype (brand.html / index.html) actually renders. Its `:root`
 * tokens are a clean subset of globals.css; this script keeps their VALUES in
 * lockstep so a design-system token change propagates to the app instead of
 * being hand-copied per file.
 *
 * App-only tokens in globals.css (--consumer*, --motion-*, --ease*, --space-*,
 * --fs-*) are NOT in shared.css and are left untouched — they're documented
 * frontend extensions.
 *
 *   node scripts/sync-design-tokens.mjs           # check (CI): exit 1 on drift
 *   node scripts/sync-design-tokens.mjs --write    # apply DS values to globals.css
 *
 * The design-system repo is expected as a sibling checkout; override with
 * BINECTICS_DS_SHARED_CSS=/path/to/shared.css. If the source is absent (e.g. an
 * isolated CI checkout) the script warns and exits 0 so builds don't break.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const write = process.argv.includes("--write");

const sharedCssPath =
  process.env.BINECTICS_DS_SHARED_CSS ||
  resolve(scriptDir, "../../binectics-design-system/shared.css");
const globalsPath = resolve(scriptDir, "../src/app/globals.css");

if (!existsSync(sharedCssPath)) {
  console.warn(
    `⚠ design-system source not found at ${sharedCssPath} — skipping token sync.\n` +
      `  (set BINECTICS_DS_SHARED_CSS to point at the design-system checkout)`,
  );
  process.exit(0);
}

/** Parse the first `:root { … }` block into an ordered [name, value] list. */
function parseRootTokens(css) {
  const root = css.slice(css.indexOf(":root"));
  const block = root.slice(root.indexOf("{") + 1, root.indexOf("}"));
  const tokens = [];
  for (const line of block.split("\n")) {
    const m = line.match(/^\s*(--[\w-]+)\s*:\s*([^;]+?)\s*;/);
    if (m) tokens.push([m[1], m[2].trim()]);
  }
  return tokens;
}

const sharedTokens = parseRootTokens(readFileSync(sharedCssPath, "utf8"));
let globals = readFileSync(globalsPath, "utf8");

const drift = [];
const missing = [];

for (const [name, dsValue] of sharedTokens) {
  const re = new RegExp(`(^[ \\t]*${name}\\s*:\\s*)([^;]+?)(\\s*;)`, "m");
  const match = globals.match(re);
  if (!match) {
    missing.push(name);
    continue;
  }
  const appValue = match[2].trim();
  if (appValue !== dsValue) {
    drift.push({ name, dsValue, appValue });
    if (write) globals = globals.replace(re, `$1${dsValue}$3`);
  }
}

if (missing.length) {
  console.warn(
    `⚠ ${missing.length} design-system token(s) not present in globals.css: ${missing.join(", ")}`,
  );
}

if (write) {
  if (drift.length) {
    writeFileSync(globalsPath, globals);
    console.log(`✓ synced ${drift.length} token(s) from design system:`);
    for (const d of drift) console.log(`  ${d.name}: ${d.appValue} → ${d.dsValue}`);
  } else {
    console.log("✓ globals.css already matches the design system — nothing to write.");
  }
  process.exit(0);
}

// check mode
if (drift.length) {
  console.error(`✗ ${drift.length} token(s) drifted from the design system:`);
  for (const d of drift) {
    console.error(`  ${d.name}\n      design-system: ${d.dsValue}\n      globals.css:   ${d.appValue}`);
  }
  console.error(`\nRun \`npm run tokens:sync\` to bring globals.css back in line.`);
  process.exit(1);
}
console.log(`✓ ${sharedTokens.length} design-system tokens in sync with globals.css.`);
