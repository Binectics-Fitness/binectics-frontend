#!/usr/bin/env node
// Generates src/lib/exercises/memberTextAllowlist.generated.ts from the API's
// src/exercise-library/member-text-allowlist.json (the single source of truth).
// Usage: node scripts/gen-member-text-allowlist.mjs <path-to-allowlist.json> <api-sha>
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [, , src, sha] = process.argv;
if (!src || !sha) {
  console.error("usage: gen-member-text-allowlist.mjs <allowlist.json> <api-sha>");
  process.exit(1);
}
const j = JSON.parse(readFileSync(src, "utf8"));
const approved = [...j.approved].sort();
const withheld = Object.keys(j.withheld_pending_review).sort();
const list = (a) => a.map((x) => `  "${x}",`).join("\n");
const out = `// generated from api src/exercise-library/member-text-allowlist.json at ${sha}
// Do not edit by hand: run scripts/gen-member-text-allowlist.mjs.
// Fails closed: an id in neither list is NOT approved (see memberText.ts).

export const MEMBER_TEXT_APPROVED_IDS: readonly string[] = [
${list(approved)}
];

export const MEMBER_TEXT_WITHHELD_IDS: readonly string[] = [
${list(withheld)}
];
`;
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "../src/lib/exercises/memberTextAllowlist.generated.ts"), out);
console.log(`approved ${approved.length}, withheld ${withheld.length}`);
