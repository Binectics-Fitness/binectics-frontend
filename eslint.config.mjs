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

// Confirmation goes through the app's own dialog (useConfirmationModal):
// labelled, focus-trapped and held open while the action runs. The browser's
// native confirm is none of those. no-restricted-globals is scope-aware, so a
// component's own `confirm` function is still allowed.
const NO_NATIVE_CONFIRM = "Use useConfirmationModal, not the browser's confirm().";
const noNativeConfirm = {
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/tests/**"],
  rules: {
    "no-restricted-globals": ["error", { name: "confirm", message: NO_NATIVE_CONFIRM }],
    "no-restricted-properties": [
      "error",
      { object: "window", property: "confirm", message: NO_NATIVE_CONFIRM },
      { object: "globalThis", property: "confirm", message: NO_NATIVE_CONFIRM },
      { object: "self", property: "confirm", message: NO_NATIVE_CONFIRM },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  noEmDashInCopy,
  noNativeConfirm,
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
