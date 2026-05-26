import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI
    ? [["html", { open: "never" }], ["json", { outputFile: "results.json" }]]
    : [["html", { open: "on-failure" }]],

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Setup project generates auth state for each role
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
    },

    // Public / unauthenticated tests
    {
      name: "unauthenticated",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /\/(auth|navigation|landing|static)\//,
    },

    // Role-specific authenticated tests
    {
      name: "user",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testMatch: /\/dashboard\/user-/,
    },
    {
      name: "gym-owner",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/gym-owner.json",
      },
      dependencies: ["setup"],
      testMatch: /\/dashboard\/gym-owner-/,
    },
    {
      name: "trainer",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/trainer.json",
      },
      dependencies: ["setup"],
      testMatch: /\/dashboard\/trainer-/,
    },
    {
      name: "dietitian",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/dietitian.json",
      },
      dependencies: ["setup"],
      testMatch: /\/dashboard\/dietitian-/,
    },
    {
      name: "admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
      testMatch: /\/admin\//,
    },

    // Marketplace/checkout uses user auth state
    {
      name: "marketplace",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testMatch: /\/(marketplace|forms)\//,
    },
  ],

  webServer: {
    command: "npm run dev",
    port: 3001,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
