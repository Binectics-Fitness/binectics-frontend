# Binectics - Claude Development Log

## Enum Rule

**Use enums for all domain constants instead of raw string values.**

- Roles, statuses, booking states, review target types, provider roles, and similar fixed values must come from enums
- Reuse existing shared enums before adding new ones
- Avoid inline string unions and raw string comparisons when an enum exists
- When adding a new API field with constrained values, create or extend a shared enum first

## Searchable Dropdown Rule

**All `<select>` dropdowns must be replaced with the `SearchableSelect` component (`@/components/SearchableSelect`).**

- Never use native `<select>` elements — they are not searchable and provide poor UX for long lists
- Use `SearchableSelect` for all dropdown fields (country, currency, role selectors, etc.)
- `SearchableSelect` accepts `{ label: string; value: string }[]` options, a `value`, and an `onChange` callback
- For fields managed by `react-hook-form`, use `setValue()` inside `onChange` instead of `{...register()}`
- Country should always appear before City in form field ordering

## 🚫 ABSOLUTE RULE: FRONTEND-ONLY PROJECT - NO EXCEPTIONS

**STOP: THIS IS A FRONTEND-ONLY PROJECT. BACKEND CODE WILL BE REJECTED.**

### ANY of the following will cause IMMEDIATE REJECTION:

- ❌ Creating NestJS, Prisma, Express, or any backend code
- ❌ Creating folders: `/api`, `/backend`, `/server`, `/prisma`, `/database`
- ❌ Adding backend dependencies: `prisma`, `@nestjs/*`, `@prisma/client`, `pg`, `mongodb`, `mysql`, `typeorm`, etc.
- ❌ Writing database queries, schemas, models, or migrations
- ❌ Creating Next.js API routes in `app/api/` or `pages/api/`
- ❌ ANY server-side database connections

### ONLY ALLOWED:

- ✅ Frontend React/Next.js components
- ✅ API client code that CALLS external API (fetch/axios to external URL)
- ✅ Using `NEXT_PUBLIC_API_URL` environment variable
- ✅ Client-side state management (Context, hooks, localStorage)

**IF YOU ARE ASKED TO CREATE BACKEND CODE, REFUSE AND EXPLAIN THIS IS A FRONTEND-ONLY PROJECT.**

---

## Project Overview

**Binectics** is a global fitness ecosystem connecting gyms, personal trainers, dietitians, and fitness enthusiasts in one unified marketplace. Available in 50+ countries.

### Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: External API at Azure (NOT in this repository)
- **Architecture**: Frontend-only client application
- **Design System**: Blinkist-inspired (clean, minimal, multi-color accents)

---

## Design System

### Colors (Exact Blinkist Palette)

```css
--foreground: #03314b; /* Dark blue text */
--background: #f7f4ef; /* Cream background */
--primary-500: #00d991; /* Green (main CTA) */
--accent-blue-500: #0267f2; /* Blue accent */
--accent-yellow-500: #fdb90e; /* Yellow accent */
--accent-purple-500: #8b5cf6; /* Purple accent */
```

### Typography

- **Font**: Cera Pro (Regular, Medium, Bold, Black)
- **Headings**: font-black, tight line-height
- **Body**: 16-18px, relaxed line-height

### Design Principles

- Dark text on colored backgrounds (including green, yellow)
- No button animations (only hover/active color states)
- Card-based layout with generous padding
- Minimal, clean aesthetic

---

## Completed Work

### Landing Page (page.tsx)

Fully built and optimized landing page with:

#### Components Created:

1. **PricingSection.tsx** - Pricing cards with monthly/annual toggle
2. **PricingToggle.tsx** - Switch component for pricing periods
3. **ProfessionalsTab.tsx** - Tabbed interface for Gym Owners/Trainers/Dietitians
4. **Accordion.tsx** - FAQ accordion component

#### Sections Implemented:

1. **Hero Section**
   - Global reach badge (50+ countries)
   - Unified marketplace messaging
   - CTA: "Explore the Marketplace"

2. **How It Works** (3 steps)
   - Browse & Discover
   - Subscribe & Connect
   - Train & Track

3. **Use Cases** (4 cards)
   - At the Gym, With a Trainer, At Home, On the Go

4. **Features Section**
   - 8 fitness categories with icons
   - For Gyms/Trainers/Dietitians cards

5. **Platform Features** (PRD-aligned)
   - QR Check-in
   - Verified Professionals
   - Client Journals
   - Flexible Subscriptions
   - Multi-Currency Payments
   - Location-Based Search

6. **Global Reach Section**
   - 8 featured countries with gym/trainer counts
   - "+42 more countries" messaging

7. **QR Check-in Highlight**
   - Visual QR code mockup
   - 4 key benefits
   - Blue accent theme

8. **Pricing Section**
   - 3 tiers: Explorer ($19), Athlete ($49), Professional ($99)
   - Monthly/Annual toggle with 20% discount
   - Color-coded buttons (blue, yellow, purple)

9. **Testimonials**
   - 6 diverse testimonials including:
     - Gym Owner (David Kim)
     - Personal Trainer (Jake Martinez)
     - Certified Dietitian (Priya Patel)
     - 3 Fitness Enthusiasts
   - Trust metrics (4.9/5 rating, 10K+ members, 50+ countries)

10. **Trust & Verification Section**
    - 3-step verification process
    - Verification badge preview (green background, dark text)
    - ID Verified, Credentials Checked, Background Reviewed

11. **For Professionals** (Tabbed)
    - Dynamic accent colors per tab
    - Gym Owners (blue), Trainers (yellow), Dietitians (purple)
    - Stats cards and benefits per role

12. **FAQ Section**
    - Interactive accordion
    - 8 common questions

13. **CTA Section**
    - Green background with dark text
    - App store buttons
    - "Join 10,000+ members worldwide"

14. **Footer**
    - 4 columns: Popular Categories, Company, Support, Legal
    - Blue hover states on all links
    - Pricing link added

---

## Product Requirements Document (PRD) Summary

### MVP Scope - In

#### Core Features:

1. **Authentication & Roles**
   - Email + password (social optional)
   - Roles: Gym Owner, Trainer, Dietitian, Fitness Enthusiast, Admin
   - JWT-based auth

2. **Verification Workflow**
   - Providers upload docs (Govt ID, certs, business registration)
   - Admin approves/rejects
   - "Verified" badge on profiles

3. **Profiles & Listings**
   - Gym profile: name, location, facilities, photos, plans
   - Trainer profile: bio, specialties, certifications, plans
   - Dietitian profile: bio, specialties, certifications, plans
   - Plans: ONE_TIME or SUBSCRIPTION, duration, price

4. **Search & Discovery**
   - Location-based search
   - Filters: type, location, price range, verified status
   - Paginated results

5. **Subscriptions & Payments**
   - Multi-currency via Stripe + regional gateways (Flutterwave/Paystack)
   - Subscription states: ACTIVE, EXPIRED, CANCELLED, PENDING_PAYMENT
   - Auto-renew (basic)

6. **QR Check-in (Gyms)**
   - QR code per gym
   - User scans to check in
   - Attendance tracking
   - Gym dashboard with check-in history

7. **Client Journals**
   - Trainers/dietitians log client progress
   - Text notes + simple metrics (weight, mood, adherence)
   - Read-only for clients

8. **Notifications (Basic)**
   - Email notifications:
     - Subscription created
     - Subscription expiring
     - Subscription expired
   - In-app notifications (optional)

9. **Admin Panel**
   - Users & providers management
   - Verification approval
   - Platform metrics
   - Account suspension

### MVP Scope - Out

- E-commerce stores
- Bulk SMS/WhatsApp campaigns
- Advanced analytics dashboards
- Complex diet workflows
- Wearable integrations
- Loyalty programs
- Corporate wellness
- Insurance APIs
- White-label/Partner API

---

## Database Schema (Simplified)

### Core Entities

```typescript
type Role = "USER" | "GYM_OWNER" | "TRAINER" | "DIETITIAN" | "ADMIN";

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  country: string;
  createdAt: Date;
  updatedAt: Date;
  isSuspended: boolean;
}

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ProviderVerification {
  id: string;
  userId: string;
  role: "GYM_OWNER" | "TRAINER" | "DIETITIAN";
  documents: Array<{ type: string; url: string }>;
  status: VerificationStatus;
  adminComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Gym {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  facilities: string[];
  photos: string[];
  verificationStatus: VerificationStatus;
}

interface Plan {
  id: string;
  providerId: string;
  providerType: "GYM" | "TRAINER" | "DIETITIAN";
  name: string;
  type: "ONE_TIME" | "SUBSCRIPTION";
  duration: number; // days
  price: number;
  currency: string;
  description: string;
  isActive: boolean;
}

type SubscriptionStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "PENDING_PAYMENT";

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  providerId: string;
  amount: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  status: SubscriptionStatus;
}

interface CheckIn {
  id: string;
  userId: string;
  gymId: string;
  timestamp: Date;
}

interface JournalEntry {
  id: string;
  providerId: string;
  clientUserId: string;
  planId?: string;
  date: Date;
  notes: string;
  weight?: number;
  mood?: string;
  adherenceScore?: number; // 0-100
}
```

---

## File Structure

```
/Binectics
├── apps/
│   ├── web/                          # Next.js 16 frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx         # Landing page ✅
│   │   │   │   ├── globals.css      # Global styles + Cera Pro fonts ✅
│   │   │   │   └── layout.tsx
│   │   │   └── components/
│   │   │       ├── Accordion.tsx           ✅
│   │   │       ├── PricingSection.tsx      ✅
│   │   │       ├── PricingToggle.tsx       ✅
│   │   │       └── ProfessionalsTab.tsx    ✅
│   │   └── public/
│   │       └── fonts/
│   │           ├── Cera-Pro-Regular.otf    ✅
│   │           ├── Cera-Pro-Medium.otf     ✅
│   │           ├── Cera-Pro-Bold.otf       ✅
│   │           ├── Cera-Pro-Black.otf      ✅
│   │           └── svgexport-4.svg         ✅ (Blinkist login icon)
│   └── api/                          # NestJS 11 backend
│       └── src/
│           ├── auth/
│           ├── users/
│           ├── providers/
│           ├── plans/
│           ├── subscriptions/
│           ├── payments/
│           ├── checkins/
│           ├── journals/
│           └── notifications/
└── packages/
    └── config/
        └── src/
            └── design-tokens.ts      # Centralized color palette ✅
```

---

## All Pages Needed (112 Total)

### Authentication (8 pages)

1. `/register` - Role selection
2. `/register/user` - Fitness Enthusiast signup
3. `/register/gym-owner` - Gym Owner signup
4. `/register/trainer` - Trainer signup
5. `/register/dietitian` - Dietitian signup
6. `/login` - Login
7. `/forgot-password` - Reset request
8. `/reset-password/[token]` - Reset form

### User Dashboard (12 pages)

9-20. Dashboard, subscriptions, progress, bookings, check-ins, settings, billing, notifications, privacy, etc.

### Discovery (13 pages)

21-33. Search, gyms browse/profile, trainers browse/profile, dietitians browse/profile, categories, locations

### Gym Owner Dashboard (10 pages)

34-43. Dashboard, profile, plans, members, check-ins, analytics, settings

### Trainer Dashboard (10 pages)

44-53. Dashboard, profile, plans, clients, journal, analytics, settings

### Dietitian Dashboard (10 pages)

54-63. Dashboard, profile, plans, clients, journal, analytics, settings

### Verification (5 pages)

64-68. Apply, documents upload, status, pending, rejected

### Payment (6 pages)

69-74. Checkout, payment, confirm, success, cancelled, processing

### Admin Dashboard (12 pages)

75-86. Dashboard, users, providers, verification queue, plans, subscriptions, metrics, settings

### Static/Info (15 pages)

87-101. Landing (✅), about, how-it-works, pricing, faq, contact, privacy, terms, cookies, security, careers, press, partners, blog

### Location (3 pages)

102-104. Countries list, country-specific pages, QR help

### Utility (5 pages)

105-109. 404, 500, maintenance, verify-email, unsubscribe

### Additional (4 pages)

110-112. Mobile apps, compare plans, referral, gift cards

---

## Development Milestones

### 📊 Current Reality Check (2026-03-24)

- ~115 `page.tsx` routes currently exist in `src/app`
- Core auth, dashboards, admin, marketplace, teams, forms, and static pages are implemented
- Remaining placeholder routes: 15 pages (mostly trainer/dietitian/user dashboard sub-pages)
- Current top priority is Phase 2 UX consistency across mobile and tablet screens

### ✅ Phase 1: Landing Page (COMPLETED)

- [x] Hero section with global messaging
- [x] How It Works section
- [x] Features section
- [x] Platform capabilities (PRD-aligned)
- [x] Global reach section
- [x] QR check-in highlight
- [x] Pricing section with toggle
- [x] Testimonials (all roles)
- [x] Trust & verification section
- [x] For Professionals tabbed component
- [x] FAQ accordion
- [x] Footer with all links
- [x] Blinkist design system implementation
- [x] Dark text on colored backgrounds
- [x] Dynamic accent colors on Professional tabs

### 🔄 Phase 2: Mobile & Tablet Optimization (IN PROGRESS)

- [x] Responsive navbar with mobile menu
- [x] Mobile-optimized hero section
- [x] Stack grid layouts on mobile (major dashboard routes)
- [x] Touch-friendly button sizing on primary nav patterns
- [x] Tablet breakpoint optimization for sidebar-based layouts
- [x] Samsung/Android text autoscaling consistency fix (`text-size-adjust: 100%`)
- [x] Admin mobile spacing normalization (`md:ml-64` and responsive paddings)
- [x] Placeholder dashboard route layout normalization (all 15 Coming Soon routes)
- [x] Non-placeholder dashboard typography baseline normalization (`text-sm` floor on key mobile copy)
- [x] Team/bookings/staff dashboard surface harmonization (`bg-neutral-50` wrappers)
- [x] Final `text-xs -> text-sm` sweep on active dashboard user/trainer/dietitian pages
- [x] Follow-up `text-xs -> text-sm` pass on team/org details, consultation booking helpers, progress requests, and provider client detail views
- [x] QA pass fixes for provider/admin detail screens (stacked header actions, mobile-safe info grids, subscription mobile card view)
- [ ] Full mobile QA pass on all dashboard/admin/detail routes

### 🔄 Phase 3: Authentication Flow (MOSTLY COMPLETE)

- [x] Register page with role selection
- [x] Role-specific signup forms
- [x] Login page
- [x] Password reset flow
- [x] Email verification
- [x] JWT implementation (frontend integration)

### 🔄 Phase 4: Core User Features (IN PROGRESS)

- [x] User dashboard
- [x] Search & discovery
- [x] Profile pages (gyms, trainers, dietitians)
- [x] Subscription flow (frontend)
- [ ] End-to-end payment integration hardening

### 🔄 Phase 5: Provider Dashboards (IN PROGRESS)

- [x] Gym owner dashboard
- [x] Trainer dashboard
- [x] Dietitian dashboard
- [x] Plan management (gym owner complete; trainer/dietitian placeholders remain)
- [x] Client management
- [x] Journal system

### 🔄 Phase 6: Verification & QR (IN PROGRESS)

- [x] Verification application flow
- [x] Admin verification panel
- [x] QR code generation (frontend flow)
- [x] QR check-in system
- [x] Attendance tracking views

### 🔄 Phase 7: Admin Panel (IN PROGRESS)

- [x] Admin authentication
- [x] User management
- [x] Provider management
- [x] Metrics dashboard
- [x] Platform settings
- [ ] Responsive polish and QA on all admin routes

---

## Git Commit History

```
b996b26 - Implement PRD-aligned landing page enhancements
6ad9016 - Add Pricing section and For Professionals CTA
355efd4 - Add How It Works section with 3-step process
3c84842 - Update footer hover color from green to blue
5b48e59 - Fix Progress Tracking card icon background color
8b9666b - Initial commit
```

---

## Key Design Decisions

### Color Usage

- **Green (#00D991)**: Primary CTA buttons, verification badges
- **Blue (#0267F2)**: Gym owners, navbar/footer hovers, links
- **Yellow (#FDB90E)**: Trainers, accent elements
- **Purple (#8B5CF6)**: Dietitians, accent elements
- **Dark (#03314B)**: All text on colored backgrounds

### Typography Hierarchy

- **H1 (Hero)**: 5xl-7xl, font-black, tight leading
- **H2 (Sections)**: 3xl-5xl, font-black
- **H3 (Cards)**: xl-2xl, font-bold
- **Body**: base-lg, font-normal, relaxed leading
- **Small**: sm, font-medium

### Component Patterns

- Cards: rounded-2xl or rounded-3xl, shadow-card
- Buttons: h-12 or h-14, rounded-lg, font-semibold
- Inputs: (to be defined in Phase 3)
- Modals: (to be defined as needed)

### Spacing System

- Section padding: py-20 sm:py-28
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Card padding: p-6 or p-8
- Gap in grids: gap-4, gap-6, gap-8, gap-12

---

## Technical Notes

### Fonts Loading

- Custom @font-face in globals.css
- Files renamed to use hyphens (no spaces)
- Font display: swap for performance

### State Management

- React useState for client components
- Server components where possible
- No global state library yet (add if needed)

### Next.js 13+ App Router Guidelines

**IMPORTANT: `useSearchParams()` Suspense Requirement**

Next.js 13+ **requires** `useSearchParams()` to be wrapped in a `<Suspense>` boundary:

```tsx
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Inner component that uses useSearchParams
function MyPageContent() {
  const searchParams = useSearchParams();
  // ... component logic
}

// Wrapper component with Suspense boundary
export default function MyPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <MyPageContent />
    </Suspense>
  );
}
```

**Why This Is Required:**

- The hook accesses URL query parameters that aren't available during static generation
- During build time (SSG), query parameters don't exist yet
- Suspense allows Next.js to handle this gracefully by showing a fallback during client-side hydration
- Without Suspense, builds will fail with: `useSearchParams() should be wrapped in a suspense boundary`

**When to Apply:**

- ✅ Any component using `useSearchParams()`
- ✅ Any component using `useRouter().searchParams`
- ✅ Components that read URL query parameters on mount

**Pattern:**

1. Create inner component with the hook
2. Wrap in outer component with `<Suspense>`
3. Provide appropriate loading fallback (e.g., `<DashboardLoading />`)

### Performance

- Next.js App Router with React Server Components
- Image optimization (to be implemented)
- Code splitting by route
- Lazy loading for heavy components

### Accessibility

- Semantic HTML
- ARIA labels on icons
- Keyboard navigation (to be tested)
- Color contrast ratios checked

---

## Environment Variables

Frontend-only environment variables (all secrets managed by backend):

```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001
PORT=3001

# API Configuration
NEXT_PUBLIC_API_URL=https://binectics-gym-dev-api-dwbaeufeafgqd6db.canadacentral-01.azurewebsites.net/api/v1

# Authentication
NEXT_PUBLIC_SESSION_TIMEOUT=3600000

# Payment (Public keys only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=

# External Services (Public)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=

# Monitoring (Frontend)
NEXT_PUBLIC_SENTRY_DSN=

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_COOKIE_CONSENT=true
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

**Backend responsibilities (NOT in frontend):**

- Database connections
- JWT signing/verification
- Payment processing secrets
- Email API keys
- File storage credentials
- OAuth client secrets

---

## Next Steps

1. **Mobile & Tablet Optimization** (Current)
   - Complete full-device QA pass (Samsung, iPhone, tablets)
   - Normalize font hierarchy and spacing on remaining outlier pages
   - Resolve final layout inconsistencies on edge-case detail screens

2. **Complete Feature Pages**
   - Implement remaining 15 placeholder pages
   - Add real content and functionality
   - Integrate with Azure backend API

3. **User Dashboard Enhancements**
   - Dashboard layout improvements
   - Subscription management
   - Profile editing features

4. **Testing & Quality**
   - Add error boundaries
   - Implement form validation
   - Set up testing framework

---

## Known Issues / Tech Debt

- [ ] Loading states are inconsistent across routes
- [ ] No error boundaries
- [ ] No form validation library chosen
- [ ] No testing setup (unit/integration/e2e)
- [ ] No CI/CD pipeline
- [ ] No monitoring/logging setup
- [ ] No SEO optimization (meta tags, sitemap, etc.)
- [ ] No analytics integration
- [ ] Some dashboard/provider pages are still placeholders (15 routes)

---

## Resources

- [Blinkist.com](https://blinkist.com) - Design reference
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Tailwind CSS 4](https://tailwindcss.com)

---

**Last Updated**: 2026-03-25
**Current Phase**: Mobile & Tablet Optimization
**Progress**: ~88% (major route surface complete, 15 placeholder pages remaining; final cross-device QA pending)
