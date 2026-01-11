# Contributing to Binectics Frontend

Thank you for your interest in contributing to Binectics! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 20+ (specified in `.nvmrc`)
- npm 10+

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```text
src/
├── app/              # Next.js App Router pages and routes
├── components/       # Reusable React components
│   ├── UI Components (Button, Input, Card, etc.)
│   ├── Layout Components (Navbar, Footer, etc.)
│   └── Feature Components (Dashboard, Pricing, etc.)
├── hooks/            # Custom React hooks
└── lib/              # Shared utilities and types
    ├── constants/    # Application constants
    ├── types/        # TypeScript type definitions
    └── design-tokens.ts # Design system tokens
```

## Code Style

### Component Guidelines

1. **UI Components** - Use named exports:

   ```tsx
   export const Button = () => { ... }
   export type ButtonProps = { ... }
   ```

2. **Page/Layout Components** - Use default exports:

   ```tsx
   export default function LoginPage() { ... }
   ```

3. **File Naming**:
   - Components: PascalCase (e.g., `Button.tsx`)
   - Utilities: camelCase (e.g., `formatDate.ts`)
   - Types: camelCase (e.g., `userTypes.ts`)

### Import Order

1. React imports
2. Third-party libraries
3. Internal components (using `@/components`)
4. Internal utilities (using `@/lib`)
5. Styles/CSS

Example:

```tsx
import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components";
import { USER_ROLES } from "@/lib/constants";
```

### TypeScript

- Always use TypeScript for new files
- Prefer interfaces for object shapes
- Use `type` for unions, intersections, and mapped types
- Export types alongside components

## Commit Messages

Use conventional commit format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:

```
feat: add user authentication flow
fix: resolve navigation menu overflow on mobile
docs: update README with new setup instructions
```

## Testing

Before submitting a PR:

1. Run the linter:

   ```bash
   npm run lint
   ```

2. Build the project:

   ```bash
   npm run build
   ```

3. Test the production build locally:
   ```bash
   npm start
   ```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Ensure all tests pass and there are no linting errors
4. Update documentation if needed
5. Submit a PR with a clear description of changes

## Questions?

If you have questions about contributing, please open an issue for discussion.
