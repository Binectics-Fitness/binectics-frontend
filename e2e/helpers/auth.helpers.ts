import { type Page, type BrowserContext } from "@playwright/test";
import { TEST_USERS, type TestRole } from "../fixtures/test-data";

/**
 * Create a mock JWT token with a controllable expiration.
 * The AuthContext parses the JWT payload to read `exp` for session timeout.
 */
export function createMockJwt(
  payload: Record<string, unknown> = {},
  expiresInSeconds = 3600,
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    sub: "e2e-test",
    iat: now,
    exp: now + expiresInSeconds,
    ...payload,
  };

  const encode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64url")
      .replace(/=+$/, "");

  return `${encode(header)}.${encode(fullPayload)}.e2e-mock-signature`;
}

/**
 * Set up authentication state for a given role.
 * Sets both localStorage (app reads) and cookies (middleware reads).
 */
export async function setupAuthState(
  page: Page,
  role: TestRole,
): Promise<void> {
  const user = TEST_USERS[role];
  const token = createMockJwt({ sub: user.id, role: user.role });
  const refreshToken = `e2e-refresh-token-${role.toLowerCase()}`;

  // Navigate to base URL first so we can set localStorage on the correct origin
  await page.goto("/");

  // Set localStorage items
  await page.evaluate(
    ({ token, refreshToken, user }) => {
      localStorage.setItem("access_token", token);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
    },
    { token, refreshToken, user },
  );

  // Set cookies for middleware
  const context = page.context();
  const baseURL = page.url();
  const url = new URL(baseURL);

  await context.addCookies([
    {
      name: "access_token",
      value: token,
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
    },
    {
      name: "user_role",
      value: user.role,
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
    },
    {
      name: "refresh_token",
      value: refreshToken,
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
    },
  ]);
}

/**
 * Clear all authentication state (localStorage + cookies).
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  });
  await page.context().clearCookies();
}

/**
 * Save the current browser context's storage state to a file.
 * Used in global setup to generate .auth/*.json files.
 */
export async function saveStorageState(
  context: BrowserContext,
  path: string,
): Promise<void> {
  await context.storageState({ path });
}
