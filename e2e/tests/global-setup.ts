import { test as setup } from "@playwright/test";
import { setupAuthState, saveStorageState } from "../helpers/auth.helpers";
import { mockDefaultApiRoutes } from "../helpers/api-mocks";
import type { TestRole } from "../fixtures/test-data";

const ROLES: { role: TestRole; path: string }[] = [
  { role: "USER", path: "e2e/.auth/user.json" },
  { role: "GYM_OWNER", path: "e2e/.auth/gym-owner.json" },
  { role: "TRAINER", path: "e2e/.auth/trainer.json" },
  { role: "DIETITIAN", path: "e2e/.auth/dietitian.json" },
  { role: "ADMIN", path: "e2e/.auth/admin.json" },
];

for (const { role, path } of ROLES) {
  setup(`generate auth state for ${role}`, async ({ page }) => {
    // Mock API routes so the app doesn't make real calls during setup
    await mockDefaultApiRoutes(page, role);

    // Set up auth state (localStorage + cookies)
    await setupAuthState(page, role);

    // Save the storage state for use by role-specific projects
    await saveStorageState(page.context(), path);
  });
}
