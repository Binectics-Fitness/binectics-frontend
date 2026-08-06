import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Em dashes read as AI slop in product copy, so they are banned from it. The
// selectors target only where copy lives — string literals, template chunks and
// JSX text — so code comments (which are not user-facing) are untouched. Nothing
// legitimate puts an em dash in an identifier or operator, so this catches copy
// and only copy. Use a hyphen, comma or colon, or rephrase.
const NO_EM_DASH = "Avoid em dashes in product copy: use a hyphen, comma or colon, or rephrase.";
const noEmDashInCopy = {
  files: ["src/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-syntax": [
      "error",
      { selector: "Literal[value=/\\u2014/]", message: NO_EM_DASH },
      { selector: "TemplateElement[value.raw=/\\u2014/]", message: NO_EM_DASH },
      { selector: "JSXText[value=/\\u2014/]", message: NO_EM_DASH },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  noEmDashInCopy,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
