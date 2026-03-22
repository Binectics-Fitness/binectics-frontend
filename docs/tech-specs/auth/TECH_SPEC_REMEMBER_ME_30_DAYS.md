# Tech Spec: Remember Me (30 Days)

**Status**: Implemented
**Author**: Copilot
**Date**: 2026-03-21
**Scope**: Frontend + API authentication contract

---

## 1) Context

The login UI includes a checkbox labeled **"Remember me for 30 days"**, but the value is currently not wired to any backend/session behavior.

Current behavior:

- Login page has local `rememberMe` state.
- Login request does **not** send `rememberMe`.
- Session lifetime is effectively controlled by default JWT/refresh behavior.

Result: the checkbox is non-functional and can mislead users.

---

## 2) Decision (Best Practice)

**Do not use `rememberMe` to extend access-token JWT lifetime.**

Use `rememberMe` only to control **refresh-token/session persistence**:

- Access token: short-lived (e.g., 15–60 minutes), always.
- `rememberMe = false`: session refresh token (browser session cookie) or short refresh TTL.
- `rememberMe = true`: persistent refresh token with max age of 30 days.

This aligns with standard security practice and limits risk if an access token is leaked.

---

## 3) Goals / Non-Goals

### Goals

1. Make "Remember me for 30 days" actually control auth persistence.
2. Keep access-token TTL unchanged and short.
3. Ensure behavior is deterministic and testable across frontend + API.

### Non-Goals

- Changing default JWT signing algorithm.
- Building multi-device session management UI in this PR.
- Introducing social login/session federation.

---

## 4) Proposed Contract Changes

## 4.1 Login Request

Add optional field:

```ts
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

Default behavior when omitted: `rememberMe = false`.

## 4.2 Response

No required shape change to login response payload.

Token/cookie semantics change server-side based on `rememberMe`.

---

## 5) Backend Changes (API)

1. **DTO**
   - Extend `LoginDto` with optional boolean `rememberMe`.

2. **Controller**
   - Pass `rememberMe` through `authService.login(...)` flow.

3. **Auth Service / Token Issuance**
   - Access token remains short-lived (existing `JWT_EXPIRES_IN`).
   - Refresh token issuance:
     - `rememberMe=true`: persistent refresh token with 30-day expiry.
     - `rememberMe=false`: session-only or short-lived refresh token.

4. **Storage strategy**
   - Prefer HTTP-only, secure cookie for refresh token.
   - If DB-backed refresh sessions exist, persist `expiresAt` and `rememberMe`.

5. **Revocation**
   - Logout revokes current refresh token/session.
   - Expired refresh tokens rejected by server and removed opportunistically.

---

## 6) Frontend Changes

1. **Login page**
   - Send `rememberMe` in login payload.

2. **Auth service**
   - Update login request type and post body.

3. **Auth context**
   - No major behavior change required; continue role-based redirect.

4. **UX copy**
   - Keep label: "Remember me for 30 days".
   - Optional helper text: "Applies to this device/browser only."

---

## 7) Security Requirements

1. Access token TTL must remain short regardless of `rememberMe`.
2. Refresh tokens must be rotatable/revocable.
3. Cookies (if used) must be `HttpOnly`, `Secure`, `SameSite=Lax` (or stricter as needed).
4. `rememberMe` must never bypass lockout, OTP, or existing auth controls.

---

## 8) Acceptance Criteria

1. Login with `rememberMe=true` creates a refresh session valid for 30 days.
2. Login with `rememberMe=false` does not create 30-day persistence.
3. Access token expiration remains unchanged for both paths.
4. Existing login and role redirect flows continue to work.
5. Checkbox state visibly affects persistence behavior in integration tests.

---

## 9) Test Plan

## Backend

- Unit:
  - `LoginDto` validates optional boolean `rememberMe`.
  - Auth service issues correct refresh expiry based on `rememberMe`.
- Integration/E2E:
  - `POST /auth/login` with `rememberMe=true/false` yields expected refresh semantics.
  - Expired refresh behavior rejects appropriately.

## Frontend

- Unit:
  - Login submit includes `rememberMe` field in request body.
- Integration:
  - Checkbox checked path persists session after browser restart simulation (where feasible in test harness).

---

## 10) Rollout Plan

1. Add backend support first (DTO + service + tests).
2. Wire frontend payload + tests.
3. Feature validate in staging with manual scenarios:
   - checked/unchecked login behavior
   - token expiry handling
4. Deploy behind normal release process.

---

## 11) Open Questions

1. Do we want strict 30x24-hour TTL or calendar-based 30 days?
2. Do we enforce single active refresh session per device/user?
3. Should "remember me" be hidden on high-risk/admin login surfaces?
