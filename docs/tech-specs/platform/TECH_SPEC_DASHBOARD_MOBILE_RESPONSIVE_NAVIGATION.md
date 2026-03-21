# Tech Spec: Dashboard Mobile Responsive Navigation

**Status**: Proposed
**Author**: Copilot
**Date**: 2026-03-21
**Scope**: Frontend only (dashboard navigation UX)

---

## 1) Context

Today, dashboard pages render a desktop-style sidebar on small screens. For fitness enthusiasts and other roles using phones, this blocks content area and makes navigation difficult.

Problem summary:

- Sidebar consumes too much horizontal space on mobile.
- Important dashboard actions are harder to reach with one-hand usage.
- Navigation pattern is not optimized for phone viewport constraints.

---

## 2) Goals / Non-Goals

### Goals

1. Remove persistent desktop sidebar from phone-sized viewports.
2. Introduce mobile-first dashboard navigation that is easy to access and dismiss.
3. Keep role-based navigation items consistent across desktop and mobile.
4. Improve usability and accessibility without changing backend contracts.

### Non-Goals

- Redesigning dashboard content modules/cards.
- Adding new backend endpoints or API changes.
- Changing role permissions or dashboard information architecture.

---

## 3) User Roles Affected

This applies to all dashboard users:

- Fitness Enthusiast (user)
- Gym Owner
- Trainer
- Dietitian
- Admin

All roles should use the same mobile navigation shell behavior, with role-specific menu items.

---

## 4) UX Decision

## 4.1 Breakpoint Behavior

- **Desktop (`lg` and above)**:
  - Keep existing left sidebar behavior.
- **Tablet (`md` to `<lg`)**:
  - Use compact/overlay sidebar pattern (non-persistent), depending on available width.
- **Mobile (`<md`)**:
  - Hide persistent sidebar completely.
  - Use a top app bar + menu trigger.
  - Open navigation as a slide-over drawer.
  - Optionally show primary quick actions in a bottom nav when needed.

## 4.2 Mobile Navigation Pattern (Primary)

For phone UX, implement:

1. **Top App Bar**
   - Left: menu button (opens drawer)
   - Center: current section title
   - Right: optional notification/profile action

2. **Slide-Over Drawer**
   - Contains full role-based nav list.
   - Covers content with backdrop.
   - Closes on backdrop click, Escape, and route selection.

3. **Content Area**
   - Full width on mobile.
   - Safe bottom padding if bottom actions are present.

This avoids always-visible sidebar while preserving complete navigation access.

---

## 5) Information Architecture Consistency

Use one shared navigation config as source of truth for both desktop sidebar and mobile drawer.

Rules:

- Do not duplicate nav definitions in separate files.
- Role filtering logic must be shared.
- Active route highlighting should match in desktop and mobile.

If introducing constrained constants for navigation mode/type, use shared enums (not raw strings), aligned with project enum conventions.

---

## 6) Accessibility Requirements

1. Drawer menu button must have `aria-label` and `aria-expanded`.
2. Drawer uses `role="dialog"` or semantic sheet pattern with focus trap.
3. Keyboard support:
   - Open via Enter/Space on trigger
   - Close via Escape
   - Tab order constrained while drawer is open
4. Ensure contrast and touch target size (minimum 44x44 logical pixels).
5. Prevent background scroll when drawer is open.

---

## 7) Technical Implementation Plan (Frontend)

## 7.1 Shared Components

- Introduce/extend a responsive dashboard shell component (example: `DashboardLayout` wrapper).
- Keep current sidebar component for desktop.
- Add `MobileDashboardNav` component for drawer-based navigation.

## 7.2 Suggested File Touchpoints

- Dashboard layout wrapper under `src/app/dashboard/...` (or shared dashboard layout path)
- Navigation component(s) under `src/components/...` (sidebar + mobile nav)
- Shared nav config under `src/lib` or `src/utils` (single source of truth)

## 7.3 State and Routing

- Local UI state (`isMobileNavOpen`) with controlled open/close handlers.
- Close mobile drawer on route change.
- Preserve existing route guards and role checks.

## 7.4 Styling

- Use existing Tailwind tokens and design primitives only.
- No new hard-coded color system outside established theme tokens.
- Keep interaction transitions minimal and fast.

---

## 8) Performance Considerations

1. Avoid rendering both heavy nav trees for mobile and desktop simultaneously when not needed.
2. Keep drawer animation lightweight (transform/opacity only).
3. Minimize layout shift by reserving top bar height.

---

## 9) Acceptance Criteria

1. On screens `<md`, persistent sidebar is not visible on any dashboard role page.
2. Mobile users can open/close navigation drawer reliably and reach all role-allowed routes.
3. Active route is correctly indicated in mobile drawer.
4. Drawer closes automatically after selecting a route.
5. Desktop behavior remains unchanged.
6. Keyboard and screen-reader navigation pass basic accessibility checks.
7. No backend/API changes required.

---

## 10) QA Test Plan

## Manual

- Test at representative widths: 360px, 390px, 430px, 768px, 1024px, 1280px.
- Validate all role dashboards (user, gym owner, trainer, dietitian, admin).
- Confirm drawer behavior: open/close/backdrop/Escape/route transition.
- Verify no horizontal overflow on key dashboard pages.

## Regression

- Ensure desktop sidebar still works with existing navigation and active states.
- Confirm dashboard content spacing remains correct after responsive shell updates.

---

## 11) Rollout Plan

1. Implement responsive shell + mobile drawer behind normal PR flow.
2. Validate role-by-role in staging across iOS and Android viewports.
3. Release with dashboard UX notes in changelog.

---

## 12) Open Questions

1. Should tablet (`md`) use drawer-only, or a compact collapsible sidebar?
2. Do we want bottom nav for top 3–5 frequent routes, or app-bar + drawer only for MVP?
3. Should notification/profile actions stay in app bar for all roles or user role only?
