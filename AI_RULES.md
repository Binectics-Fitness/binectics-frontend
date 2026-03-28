# AI Development Rules for Binectics Frontend

## Enum Usage

**ABSOLUTE RULE: USE ENUMS FOR DOMAIN VALUES, NOT RAW STRING LITERALS**

- Use enums for roles, statuses, target types, provider types, and other fixed-value API fields
- Do not create inline string unions when a shared enum already exists
- Do not compare API values with raw strings like `"ADMIN"`, `"PENDING"`, or `"DIETITIAN"` when an enum is available
- If a shared enum does not exist yet, create one in the relevant shared API/types module and reuse it everywhere

✅ Correct:

```typescript
if (user.role === UserRole.ADMIN) {
  router.push("/admin");
}
```

❌ Wrong:

```typescript
if (user.role === "ADMIN") {
  router.push("/admin");
}
```

## Database Model Naming Convention

**ABSOLUTE RULE: ALL API RESPONSE PROPERTIES MUST USE SNAKE_CASE**

### ✅ Correct (snake_case):

```typescript
interface User {
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  profile_picture?: string;
}

interface Gym {
  owner_id: string;
  verification_status: VerificationStatus;
  is_public: boolean;
  opening_hours?: OpeningHours;
}

interface Subscription {
  user_id: string;
  plan_id: string;
  start_date: Date;
  end_date: Date;
  payment_id?: string;
}
```

### ❌ Wrong (camelCase):

```typescript
interface User {
  firstName: string; // ❌ Wrong
  lastName: string; // ❌ Wrong
  isEmailVerified: boolean; // ❌ Wrong
  createdAt: Date; // ❌ Wrong
  profilePicture?: string; // ❌ Wrong
}

interface Gym {
  ownerId: string; // ❌ Wrong
  verificationStatus: string; // ❌ Wrong
  isPublic: boolean; // ❌ Wrong
  openingHours?: OpeningHours; // ❌ Wrong
}
```

## Why Snake Case?

1. **Backend Consistency**: The NestJS backend API uses snake_case in all database models and API responses
2. **MongoDB Convention**: MongoDB field names use snake_case
3. **API Contract**: Frontend must match backend API response structure exactly
4. **Type Safety**: TypeScript interfaces must reflect actual API response shape

## Migration Completed

Date: February 23, 2026
Branch: `chore/migrate-database-models-to-snake-case`

### Changed Interfaces

All TypeScript interfaces in `src/lib/types/index.ts` updated:

1. **User** - Already using snake_case ✅
2. **Gym**
   - `ownerId` → `owner_id`
   - `verificationStatus` → `verification_status`
   - `isPublic` → `is_public`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`
   - `openingHours` → `opening_hours`

3. **TrainerProfile**
   - `userId` → `user_id`
   - `brandName` → `brand_name`
   - `verificationStatus` → `verification_status`
   - `isPublic` → `is_public`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

4. **DietitianProfile**
   - `userId` → `user_id`
   - `companyName` → `company_name`
   - `verificationStatus` → `verification_status`
   - `isPublic` → `is_public`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

5. **Plan**
   - `durationType` → `duration_type`
   - `isActive` → `is_active`
   - `gymId` → `gym_id`
   - `trainerId` → `trainer_id`
   - `dietitianId` → `dietitian_id`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

6. **Subscription**
   - `userId` → `user_id`
   - `planId` → `plan_id`
   - `startDate` → `start_date`
   - `endDate` → `end_date`
   - `paymentId` → `payment_id`
   - `paymentMethod` → `payment_method`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

7. **SearchFilters**
   - `minRating` → `min_rating`
   - `maxPrice` → `max_price`

8. **PaginatedResponse**
   - `totalPages` → `total_pages`

## Future Development

When creating new types or interfaces that represent API data:

1. Always use snake_case for property names
2. Match the backend API response structure exactly
3. Reference existing types in `src/lib/types/index.ts` as examples
4. Never use camelCase for database/API-related properties

## Related Backend Rules

See `/Users/daniel/Documents/GitHub/binectics-api/AI_RULES.md` for backend conventions.

## Testing

All pages build successfully with these type changes (verified Feb 23, 2026).
Component updates may be needed as API integration progresses.

## No Frontend Workarounds for Backend Gaps

**ABSOLUTE RULE: DO NOT WORK AROUND MISSING BACKEND DATA ON THE FRONTEND**

- If the backend API does not return the data the frontend needs (e.g. missing field population, missing endpoint), fix it at the source in the backend
- Do not add extra API calls, lookup maps, or local state hacks on the frontend to compensate for incomplete backend responses
- If a Mongoose query should `.populate()` a ref field, add the populate call in the backend service — do not fetch related data separately on the frontend
- If an endpoint is missing, create it in the backend — do not cobble together multiple calls client-side as a substitute

## Design System & Visual Standards

**ABSOLUTE RULE: FOLLOW THE ESTABLISHED DESIGN SYSTEM FOR ALL UI WORK**

### Shadow System (CSS Variables)

Use CSS variable shadows instead of Tailwind utility shadows for cards and elevated surfaces:

```tsx
// ✅ Correct
className="shadow-[var(--shadow-card)]"
className="hover:shadow-[var(--shadow-card-hover)]"
className="shadow-[var(--shadow-elevated)]"

// ❌ Wrong
className="shadow-card"
className="hover:shadow-xl"
className="shadow-lg"
```

Available shadow variables:
- `--shadow-card` — Default card elevation
- `--shadow-card-hover` — Hover state for interactive cards
- `--shadow-elevated` — Modals, popovers, elevated surfaces

### Icon Glow Backgrounds

Use `icon-glow-*` utility classes for icon containers instead of flat bg colors:

```tsx
// ✅ Correct
<div className="icon-glow-blue h-12 w-12 rounded-xl" />
<div className="icon-glow-green h-14 w-14 rounded-xl" />

// ❌ Wrong
<div className="bg-accent-blue-100 h-12 w-12 rounded-xl" />
<div className="bg-primary-100 h-14 w-14 rounded-xl" />
```

Available glows: `icon-glow-green`, `icon-glow-blue`, `icon-glow-yellow`, `icon-glow-purple`

### Section Background Gradients

Use gradient section tints for visual rhythm between page sections:

```tsx
// ✅ Correct
<section className="relative overflow-hidden">
  <div className="absolute inset-0 gradient-section-green" />
  <div className="relative">...</div>
</section>

// ❌ Wrong
<section className="bg-neutral-100">...</section>
```

Available gradients: `gradient-section-green`, `gradient-section-blue`, `gradient-section-purple`, `gradient-section-warm`

### Card Accent Borders

Use `card-accent-*` for top-border accent lines on cards:

```tsx
className="card-accent-blue rounded-xl bg-white"
```

Available: `card-accent-green`, `card-accent-blue`, `card-accent-yellow`, `card-accent-purple`

### Role-Based Visual Identity

Each role has a designated accent color. Apply consistently across dashboards, badges, and role-specific UI:

| Role | Primary Accent | Icon Glow | Card Accent | Gradient Bar |
|------|---------------|-----------|-------------|-------------|
| Gym Owner | Blue (`accent-blue-*`) | `icon-glow-blue` | `card-accent-blue` | `from-accent-blue-500 to-accent-blue-600` |
| Trainer | Yellow (`accent-yellow-*`) | `icon-glow-yellow` | `card-accent-yellow` | `from-accent-yellow-500 to-accent-yellow-600` |
| Dietitian | Purple (`accent-purple-*`) | `icon-glow-purple` | `card-accent-purple` | `from-accent-purple-500 to-accent-purple-600` |
| General/Marketplace | Green (`primary-*`) | `icon-glow-green` | `card-accent-green` | `from-primary-500 to-primary-600` |

### Dashboard Header Pattern

All dashboard pages must include a gradient accent bar next to the page title:

```tsx
<div className="flex items-center gap-3">
  <div className="h-8 w-1 rounded-full bg-gradient-to-b from-accent-blue-500 to-accent-blue-600" />
  <div>
    <h1 className="font-display text-3xl font-black text-foreground">Title</h1>
    <p className="text-foreground-secondary">Subtitle</p>
  </div>
</div>
```

### Card Styling Standards

- Background: `bg-white` (not `bg-background`)
- Border radius: `rounded-xl` for cards inside pages, `rounded-2xl` for standalone cards
- Shadow: `shadow-[var(--shadow-card)]`
- Hover: `hover:shadow-[var(--shadow-card-hover)]` with optional `hover:-translate-y-0.5`
- Transition: `transition-all duration-300`

### Animation & Motion

- Entrance animations: `animate-fade-in-up` with stagger classes (`stagger-1` through `stagger-8`)
- Icon hover: `group-hover:scale-105` on icon containers (using `group` on parent)
- Always support `prefers-reduced-motion` — all animations are disabled via `@media (prefers-reduced-motion: reduce)` in globals.css
- No button animations beyond color changes on hover/active states

### Shared Components

Use existing shared components before creating new ones:

- `SectionWrapper` — Scroll-triggered entrance animation + gradient tint backgrounds
- `StatCard` — Accent-colored stat cards for dashboards
- `PageHeader` — Consistent page header with accent line and breadcrumb
- `EmptyState` — Icon + accent color + CTA (supports compact mode)
- `Card` — Supports `glass` variant and `accent` prop
- `Modal` — Supports `size` prop and entrance/exit animation

### Transition Timing

Use the project's easing variable for smooth animations:

```tsx
className="transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
// or via CSS: var(--ease-out-expo)
```
