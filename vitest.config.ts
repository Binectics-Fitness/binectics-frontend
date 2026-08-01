import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // globals is required for @testing-library/react's automatic
    // cleanup-after-each-test (it registers via the global afterEach).
    // Without it, each render leaks into the next test's DOM — the
    // source of long-standing "found multiple elements" failures.
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
