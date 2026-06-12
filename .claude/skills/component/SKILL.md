---
name: component
description: Extract a repeated UI pattern into a reusable design system component. Detects the pattern, creates the component, wires it into existing usage sites, and exports from ds/index.ts.
argument-hint: [pattern description or file path]
arguments: [pattern]
allowed-tools: Bash(grep *) Bash(find *) Read Edit Write
---

## Design system context

Existing DS components live in `src/components/ds/`. Current exports:

!`cat src/components/ds/index.ts`

## Design system conventions

- Components are in `src/components/ds/ComponentName.tsx`
- Each component is a named export (not default)
- All components must be added to `src/components/ds/index.ts`
- Use `"use client"` directive if the component uses state, effects, or event handlers
- Props interfaces are exported alongside the component
- Use CSS custom properties from globals.css — never raw colors
- 44px minimum touch targets on interactive elements (`min-h-11`)
- Use generic type parameters where the component needs to be flexible (see `TogglePill<T>`)

## Instructions

The user wants to extract this pattern into a DS component: **$pattern**

Follow this process:

### 1. Find the pattern
Search the codebase for repeated instances of this pattern. Identify:
- Which files contain it
- What varies between instances (these become props)
- What stays the same (this is the component's core)

### 2. Design the component
- Name it clearly (PascalCase)
- Define the props interface — only expose what varies
- Keep the API minimal — fewer props is better
- Type it strictly — use `as const` assertions, generic type params, or union types

### 3. Create the component
Write it to `src/components/ds/ComponentName.tsx`

### 4. Wire it in
Replace every instance of the pattern in the codebase with the new component. Every instance — do not leave any behind.

### 5. Export it
Add the component and its props type to `src/components/ds/index.ts`

### 6. Verify
Run `npx tsc --noEmit` to confirm the refactor compiles.

### 7. Report
```
Created: src/components/ds/ComponentName.tsx
Props: { prop1: Type, prop2: Type }
Replaced: X instances across Y files
Type-check: PASS
```
