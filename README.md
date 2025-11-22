# Binectics

> A global ecosystem connecting gyms, fitness trainers, dieticians, and wellness enthusiasts in one seamless digital marketplace.

## Overview

Binectics is a comprehensive platform designed to bridge the fragmented fitness industry by integrating physical gym experiences, personal training, and diet management into a unified digital ecosystem. Built with a mobile-first, cross-platform architecture ready for web, iOS, and Android.

## Project Structure

```
Binectics/
├── apps/
│   ├── web/          # Next.js 16 web application
│   └── api/          # NestJS 11 REST API
├── packages/
│   ├── shared/       # Shared types, constants, and utilities
│   ├── config/       # Design tokens and configuration
│   └── ui/           # Reusable React UI components
└── pnpm-workspace.yaml
```

## Tech Stack

### Frontend (Web)
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5

### Backend (API)
- **Framework**: NestJS 11
- **Database**: PostgreSQL with Prisma 7 ORM
- **Runtime**: Node.js
- **Language**: TypeScript 5

### Shared Packages
- **Monorepo**: pnpm workspaces
- **Design System**: Blinkist-inspired (clean, minimal, professional)
- **Cross-platform**: Ready for React Native mobile apps

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 8
- PostgreSQL >= 14

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Binectics
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

**API** (`apps/api/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/binectics"
JWT_SECRET="your-secret-key"
PORT=3000
ALLOWED_ORIGINS="http://localhost:3001"
```

**Web** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

4. Run database migrations:
```bash
pnpm db:migrate
```

### Development

Start all services:

```bash
# Terminal 1 - API
pnpm dev:api

# Terminal 2 - Web
pnpm dev:web
```

Access the applications:
- Web: http://localhost:3001
- API: http://localhost:3000/api/v1

## Database Schema

The database includes models for:
- **Users** (multi-role: USER, GYM_OWNER, TRAINER, DIETICIAN, ADMIN)
- **Gyms** (facility management, locations, verification)
- **Trainer Profiles** (certifications, specializations)
- **Dietician Profiles** (company support, location-based)
- **Plans** (subscription offerings, multi-currency)
- **Subscriptions** (payment tracking, status management)
- **Staff** (gym employee management)
- **Check-ins** (QR-based gym entry)
- **Client Journals** (progress tracking)
- **Reviews** (ratings and feedback)

## Design System

Binectics uses a Blinkist-inspired design system with:

- **Primary Color**: Teal/Green (#00AF87) - energy, health, growth
- **Secondary Color**: Deep Blue (#1A4B9B) - trust, professionalism
- **Typography**: Inter (body), Plus Jakarta Sans (display)
- **Border Radius**: Rounded corners (0.75rem - 1.5rem)
- **Shadows**: Subtle, card-based elevation
- **Spacing**: 4px base unit

## Shared Packages

### `@binectics/shared`
TypeScript types and constants used across web and mobile:
- User types, roles, and enums
- API endpoint constants
- Common interfaces

### `@binectics/ui`
Reusable React components ready for web and React Native:
- Button, Input, Card, Badge, Container
- Consistent styling via design tokens

### `@binectics/config`
Design tokens and configuration:
- Colors, typography, spacing
- Exportable for Tailwind (web) and StyleSheet (mobile)

## API Structure

RESTful API with:
- **Base URL**: `/api/v1`
- **Authentication**: JWT-based (coming soon)
- **Response Format**: Consistent JSON structure
- **Error Handling**: Global exception filters
- **Validation**: Class-validator pipes
- **CORS**: Configured for web and mobile clients

## Roadmap

### Phase 1 (0-3 months) - MVP
- [ ] Multi-role authentication
- [ ] Gym registration and verification
- [ ] Trainer/dietician profiles
- [ ] Plan creation and management
- [ ] Location-based search
- [ ] QR check-in system

### Phase 2 (3-6 months) - Beta Launch
- [ ] Payment integration (Stripe, Flutterwave, Paystack)
- [ ] Client journals and progress tracking
- [ ] Messaging (SMS/WhatsApp integration)
- [ ] Mobile apps (iOS & Android)

### Phase 3 (6-12 months) - Growth
- [ ] E-commerce for gym merchandise
- [ ] Diet plan workflows
- [ ] Analytics dashboards
- [ ] Multi-location support

## Contributing

This is a private project. For team members:

1. Create a feature branch from `main`
2. Follow TypeScript and ESLint conventions
3. Test thoroughly before submitting PR
4. Request code review from team lead

## License

MIT License - See LICENSE file for details

---

**Built with ❤️ for the global fitness community**
