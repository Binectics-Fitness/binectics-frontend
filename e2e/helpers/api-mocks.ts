import { type Page } from "@playwright/test";
import { TEST_USERS, type TestRole } from "../fixtures/test-data";

const API_PATTERN = "**/api/v1/**";

/** Standard success response shape matching ApiResponse<T> */
function success<T>(data: T, message = "Success") {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data, message }),
  };
}

/** Standard error response */
function error(message: string, status = 400) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify({ success: false, message, data: null }),
  };
}

/**
 * Register default API route mocks for common endpoints.
 * Call this at the start of each test, then override specific routes as needed.
 */
export async function mockDefaultApiRoutes(
  page: Page,
  role: TestRole = "USER",
): Promise<void> {
  const user = TEST_USERS[role];

  // Auth endpoints
  await page.route("**/api/v1/auth/login", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill(
        success({
          user,
          tokens: {
            access_token: "e2e-mock-access-token",
            refresh_token: "e2e-mock-refresh-token",
          },
        }),
      );
    }
    return route.continue();
  });

  await page.route("**/api/v1/auth/register", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill(success({ user, message: "Registration successful" }));
    }
    return route.continue();
  });

  await page.route("**/api/v1/auth/refresh", (route) => {
    return route.fulfill(
      success({
        access_token: "e2e-refreshed-token",
        refresh_token: "e2e-refreshed-refresh-token",
      }),
    );
  });

  await page.route("**/api/v1/auth/me", (route) => {
    return route.fulfill(success(user));
  });

  // Organizations (prevents unwanted redirects for USER role)
  await page.route("**/api/v1/teams/organizations/me", (route) => {
    return route.fulfill(success([]));
  });

  await page.route("**/api/v1/teams/organizations/*/members**", (route) => {
    return route.fulfill(success([]));
  });

  // Dashboard stats
  await page.route("**/api/v1/check-ins/dashboard**", (route) => {
    return route.fulfill(
      success({
        total_check_ins: 42,
        current_streak_days: 7,
        longest_streak_days: 14,
        this_month: 12,
      }),
    );
  });

  // Marketplace / listings
  await page.route("**/api/v1/marketplace/listings**", (route) => {
    return route.fulfill(
      success({
        listings: [],
        total: 0,
        page: 1,
        limit: 10,
      }),
    );
  });

  // Subscriptions
  await page.route("**/api/v1/subscriptions**", (route) => {
    return route.fulfill(success([]));
  });

  // Notifications
  await page.route("**/api/v1/notifications**", (route) => {
    return route.fulfill(success([]));
  });

  // Catch-all for any unhandled API routes — return empty success
  await page.route(API_PATTERN, (route) => {
    if (route.request().resourceType() === "fetch" || route.request().resourceType() === "xhr") {
      return route.fulfill(success(null));
    }
    return route.continue();
  });
}

/**
 * Mock a specific API endpoint with a custom response.
 * Call after mockDefaultApiRoutes to override specific behavior.
 */
export async function mockApiRoute(
  page: Page,
  urlPattern: string,
  responseData: unknown,
  status = 200,
): Promise<void> {
  await page.route(urlPattern, (route) => {
    return route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(
        status >= 400
          ? { success: false, message: responseData as string, data: null }
          : { success: true, data: responseData, message: "Success" },
      ),
    });
  });
}

/**
 * Mock a login failure response.
 */
export async function mockLoginFailure(
  page: Page,
  message = "Invalid email or password",
): Promise<void> {
  await page.route("**/api/v1/auth/login", (route) => {
    return route.fulfill(error(message, 401));
  });
}

export { success, error };
