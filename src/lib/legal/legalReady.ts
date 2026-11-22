/**
 * Blocks a PRODUCTION build while the legal documents are unfinished.
 *
 * The privacy policy and terms (src/app/privacy/legalDocs.tsx) are drafts
 * with "[OWNER TO SUPPLY: ...]" placeholders for facts only the owner can
 * give (legal name, address, DPO...). Publishing them half-filled would put
 * an unfinished legal document on the live site, so next.config.ts calls
 * assertLegalReady() during `next build` and the build fails on:
 *   - any "[OWNER TO SUPPLY" left in the documents, or
 *   - LEGAL_STATUS still "draft" for a document (set it to "reviewed" only
 *     once a lawyer has approved that text).
 *
 * Only production builds fail: Netlify's production context, Vercel's
 * production environment, or LEGAL_CHECK=strict (set it on any other
 * production pipeline, e.g. the Azure workflow). Previews and local builds
 * print a warning and carry on, so the drafts can be reviewed on a preview.
 *
 * Kept free of path-alias imports: next.config.ts loads it before they exist.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const LEGAL_DOCS_FILE = "src/app/privacy/legalDocs.tsx";
export const PLACEHOLDER = "[OWNER TO SUPPLY";

type Env = Record<string, string | undefined>;

export function isProductionDeploy(env: Env = process.env): boolean {
  return env.CONTEXT === "production" || env.VERCEL_ENV === "production" || env.LEGAL_CHECK === "strict";
}

export interface LegalProblems {
  placeholders: string[];
  drafts: string[];
}

/** Every unfinished item in the documents' source text. */
export function findLegalProblems(source: string): LegalProblems {
  const placeholders: string[] = [];
  const re = /\[OWNER TO SUPPLY:?\s*([^\]]*)\]/g;
  for (let m = re.exec(source); m; m = re.exec(source)) placeholders.push(m[1].trim() || "(unnamed)");
  const drafts: string[] = [];
  const status = source.match(/LEGAL_STATUS[^=]*=\s*\{([^}]*)\}/);
  if (status) {
    for (const m of status[1].matchAll(/(\w+)\s*:\s*"draft"/g)) drafts.push(m[1]);
  } else {
    drafts.push("(LEGAL_STATUS not found)");
  }
  return { placeholders, drafts };
}

export function legalProblemReport(p: LegalProblems): string {
  const lines: string[] = [];
  if (p.drafts.length) lines.push(`Not yet legally reviewed: ${p.drafts.join(", ")}`);
  if (p.placeholders.length) {
    const unique = [...new Set(p.placeholders)];
    lines.push(`${p.placeholders.length} placeholder(s) still to supply:`);
    for (const u of unique) lines.push(`  - ${u}`);
  }
  return lines.join("\n");
}

export function assertLegalReady(env: Env = process.env, root: string = process.cwd()): void {
  const source = readFileSync(join(root, LEGAL_DOCS_FILE), "utf8");
  const problems = findLegalProblems(source);
  if (!problems.placeholders.length && !problems.drafts.length) return;
  const report = legalProblemReport(problems);
  if (isProductionDeploy(env)) {
    throw new Error(
      `The privacy policy / terms in ${LEGAL_DOCS_FILE} are not ready for production.\n${report}\n` +
        "Fill every [OWNER TO SUPPLY] placeholder and record the legal review before deploying to production.",
    );
  }
  console.warn(`⚠ Legal documents are drafts (fine for previews, blocks production):\n${report}`);
}
