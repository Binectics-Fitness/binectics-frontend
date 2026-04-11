# Binectics UI Component Standards

## Rule: Always Use Shared Components

**Never create raw `<button>` or `<select>` elements with inline Tailwind classes.**

Use these shared components instead:

| Need                     | Component             | Import                           |
| ------------------------ | --------------------- | -------------------------------- |
| Button (action)          | `<Button>`            | `@/components/Button`            |
| Button (navigation link) | `<LinkButton>`        | `@/components/Button`            |
| Text input               | `<Input>`             | `@/components/Input`             |
| Dropdown / select        | `<SearchableSelect>`  | `@/components/SearchableSelect`  |
| Confirmation dialog      | `<ConfirmationModal>` | `@/components/ConfirmationModal` |

---

## Button Component

```tsx
import { Button, LinkButton } from "@/components/Button";
```

### Variants

| Variant           | Purpose              | Color        |
| ----------------- | -------------------- | ------------ |
| `primary`         | Main CTA (default)   | Green        |
| `accent-blue`     | Gym owner actions    | Blue         |
| `accent-yellow`   | Trainer actions      | Yellow       |
| `accent-purple`   | Dietitian actions    | Purple       |
| `outline`         | Secondary (emphasis) | Green border |
| `outline-neutral` | Secondary (neutral)  | Gray border  |
| `ghost`           | Tertiary / cancel    | Transparent  |
| `danger`          | Destructive actions  | Red          |

### Sizes

| Size | Height | Font      | Use Case                  |
| ---- | ------ | --------- | ------------------------- |
| `sm` | h-9    | text-sm   | Table actions, compact UI |
| `md` | h-11   | text-sm   | Form buttons, dashboard   |
| `lg` | h-14   | text-base | Hero CTA, landing page    |

### Examples

```tsx
{
  /* Primary CTA */
}
<Button onClick={handleSave}>Save Changes</Button>;

{
  /* Accent color for role-specific action */
}
<Button variant="accent-blue" size="sm">
  Manage Gym
</Button>;

{
  /* Navigation button */
}
<LinkButton href="/dashboard/settings" variant="outline-neutral">
  Settings
</LinkButton>;

{
  /* Full width submit */
}
<Button type="submit" fullWidth isLoading={submitting}>
  Create Account
</Button>;

{
  /* Danger with confirmation */
}
<Button variant="danger" size="sm" onClick={handleDelete}>
  Delete
</Button>;

{
  /* With icons */
}
<Button leftIcon={<PlusIcon className="h-4 w-4" />} variant="accent-blue">
  Add Member
</Button>;
```

### Props

| Prop        | Type                   | Default     | Description                   |
| ----------- | ---------------------- | ----------- | ----------------------------- |
| `variant`   | string (see above)     | `'primary'` | Visual style                  |
| `size`      | `'sm' \| 'md' \| 'lg'` | `'md'`      | Height and padding            |
| `fullWidth` | boolean                | `false`     | Stretches to container width  |
| `isLoading` | boolean                | `false`     | Shows spinner, disables click |
| `leftIcon`  | ReactNode              | —           | Icon before label             |
| `rightIcon` | ReactNode              | —           | Icon after label              |

---

## Input Component

```tsx
import { Input } from "@/components/Input";
```

Standard height `h-11`, rounded-xl, with label/error/helper support.

```tsx
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  error={errors.email?.message}
  fullWidth
/>
```

---

## Dropdown / Select

```tsx
import SearchableSelect from "@/components/SearchableSelect";
```

**Never use `<select>`**. Always use `SearchableSelect` for all dropdown fields.

```tsx
<SearchableSelect
  options={countries.map((c) => ({ label: c.name, value: c.code }))}
  value={selectedCountry}
  onChange={(val) => setValue("country", val)}
/>
```

---

## Design Tokens Quick Reference

### Colors (semantic usage)

| Token               | Hex       | Usage                            |
| ------------------- | --------- | -------------------------------- |
| `primary-500`       | `#00d991` | Green — main CTA, success states |
| `accent-blue-500`   | `#0267f2` | Blue — gym owners, links         |
| `accent-yellow-500` | `#fdb90e` | Yellow — trainers                |
| `accent-purple-500` | `#8b5cf6` | Purple — dietitians              |
| `foreground`        | `#03314b` | Dark blue — all body text        |
| `background`        | `#f7f4ef` | Cream — page background          |

### Text on colored backgrounds

- **Green/Yellow buttons**: Use `text-foreground` (dark text)
- **Blue/Purple buttons**: Use `text-white`
- **Never** use light text on green or yellow backgrounds

### Typography

| Element       | Classes                                        |
| ------------- | ---------------------------------------------- |
| Page heading  | `text-2xl sm:text-3xl font-black`              |
| Section title | `text-xl font-bold`                            |
| Card title    | `text-lg font-bold`                            |
| Body text     | `text-sm text-foreground-secondary`            |
| Small/label   | `text-xs font-medium text-foreground-tertiary` |

**Minimum font size on mobile**: `text-sm` (14px). Never use `text-xs` for readable body text on mobile.

### Spacing

| Context      | Classes             |
| ------------ | ------------------- |
| Page padding | `p-4 sm:p-6 lg:p-8` |
| Card padding | `p-4 sm:p-6`        |
| Section gap  | `space-y-6`         |
| Grid gap     | `gap-4 sm:gap-6`    |
| Button gap   | `gap-3`             |

### Cards

```
rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm
```

### Border radius

| Element | Class          |
| ------- | -------------- |
| Buttons | `rounded-lg`   |
| Cards   | `rounded-2xl`  |
| Inputs  | `rounded-xl`   |
| Badges  | `rounded-full` |

---

## Migration Checklist

When touching a file with raw inline button styles, migrate to `<Button>` / `<LinkButton>`:

1. Replace `<button className="...bg-primary-500...">` → `<Button>`
2. Replace `<Link className="...bg-primary-500..." href="...">` → `<LinkButton href="...">`
3. Replace `<button className="...border...">` → `<Button variant="outline-neutral">`
4. Replace `<button className="...bg-red-500...">` → `<Button variant="danger">`
5. Replace `<select>` → `<SearchableSelect>`
6. Match size: h-9 → `size="sm"`, h-10/h-11 → `size="md"`, h-12/h-14 → `size="lg"`
