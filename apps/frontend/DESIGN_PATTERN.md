# Frontend Design Patterns

This document outlines the design patterns and conventions used in the UptimeBeacon frontend application to ensure consistency across the codebase.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Page Structure](#page-structure)
6. [Form Patterns](#form-patterns)
7. [Card Patterns](#card-patterns)
8. [Empty States](#empty-states)
9. [Data Fetching](#data-fetching)
10. [Status Indicators](#status-indicators)
11. [Button Patterns](#button-patterns)
12. [Responsive Patterns](#responsive-patterns)

---

## Component Architecture

### UI Library

We use **shadcn/ui** components built on **Radix UI** primitives with custom styling.

### Key Utilities

- **class-variance-authority (CVA)** - For managing component variants
- **cn() utility** - Combines `clsx` and `tailwind-merge` for className handling
- **data-slot attributes** - For semantic identification and debugging

### Example Component Pattern

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const componentVariants = cva(
  "base-classes-here",
  {
    variants: {
      variant: {
        default: "default-variant-classes",
        secondary: "secondary-variant-classes",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
        lg: "h-11 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ComponentProps extends VariantProps<typeof componentVariants> {
  className?: string;
}

export function Component({ variant, size, className }: ComponentProps) {
  return (
    <div
      data-slot="component"
      className={cn(componentVariants({ variant, size }), className)}
    />
  );
}
```

---

## Color System

### Theme Philosophy

Pure monochromatic dark theme with semantic colors only for status indicators.

### Core Colors

| Purpose | Color | Tailwind Class |
|---------|-------|----------------|
| Background | `#000000` | `bg-background` |
| Card | `#0a0a0a` | `bg-card` |
| Border | `#262626` | `border-border` |
| Input | `#1f1f1f` | `bg-input` |
| Muted text | - | `text-muted-foreground` |

### Semantic Status Colors

Defined in `src/lib/constants.ts` via `STATUS_CONFIG`:

| Status | Color | Usage |
|--------|-------|-------|
| UP | `green-500` | Service operational |
| DOWN | `red-500` | Service unavailable |
| DEGRADED | `yellow-500` | Performance issues |
| MAINTENANCE | `blue-500` | Scheduled maintenance |
| PENDING | `neutral-500` | Awaiting first check |

### Severity Colors

Defined in `SEVERITY_CONFIG`:

| Severity | Color |
|----------|-------|
| minor | `yellow-500` |
| major | `orange-500` |
| critical | `red-500` |

### Channel Colors

Defined in `CHANNEL_COLORS`:

| Channel | Color |
|---------|-------|
| DISCORD | `indigo-500` |
| SLACK | `green-500` |
| EMAIL | `blue-500` |
| WEBHOOK | `orange-500` |
| TELEGRAM | `sky-500` |

### Color Usage Rules

1. **Never use arbitrary colors** outside the defined system
2. **Status colors** are the only non-neutral colors in the UI
3. **Use opacity variants** for backgrounds: `bg-green-500/10` for subtle backgrounds

---

## Typography

### Text Styles

| Element | Classes |
|---------|---------|
| Page title | `font-bold text-2xl tracking-tight` |
| Card title | `font-medium text-base` or `font-semibold` |
| Section title | `font-semibold` |
| Description | `text-muted-foreground` |
| Label | `font-medium text-sm` |
| Help text | `text-muted-foreground text-xs` |
| Badge text | `text-xs` or `text-[10px]` |

### Page Header Pattern

```tsx
<div>
  <h1 className="font-bold text-2xl tracking-tight">Page Title</h1>
  <p className="mt-1 text-muted-foreground">
    Description of the page purpose
  </p>
</div>
```

---

## Spacing System

### Vertical Spacing (space-y)

| Use Case | Class |
|----------|-------|
| Between major page sections | `space-y-6` |
| Between cards or groups | `space-y-4` |
| Between list items | `space-y-3` |
| Within form groups | `space-y-2` |

### Gap Patterns

| Use Case | Class |
|----------|-------|
| Form layout | `grid gap-4` |
| Inline elements | `gap-2` |
| Icon + text | `gap-1.5` or `gap-2` |

### Padding Patterns

| Component | Padding |
|-----------|---------|
| Card content | `p-6` |
| Button default | `px-4 py-2` |
| Button small | `px-3 py-1.5` |
| Badge | `px-2 py-0.5` |

---

## Page Structure

### Server + Client Pattern

All data-fetching pages follow this pattern:

```tsx
// page.tsx (Server Component)
import { Suspense } from "react";
import { api, HydrateClient } from "@/trpc/server";
import { PageSkeleton } from "@/components/shared";
import { PageClient } from "./_components/PageClient";

export default async function Page() {
  // Prefetch data on server
  void api.resource.getAll.prefetch();

  return (
    <HydrateClient>
      <Suspense fallback={<PageSkeleton />}>
        <PageClient />
      </Suspense>
    </HydrateClient>
  );
}
```

```tsx
// _components/PageClient.tsx (Client Component)
"use client";

import { api } from "@/trpc/react";

export function PageClient() {
  // Use suspense query - data already prefetched
  const [data] = api.resource.getAll.useSuspenseQuery();

  return <div>{/* Render data */}</div>;
}
```

### File Organization

- `page.tsx` - Server component with prefetching
- `_components/` - Page-specific client components
- `loading.tsx` - Loading state (optional, Suspense preferred)

---

## Form Patterns

### Form Structure

Forms are organized into Card sections:

```tsx
<form className="space-y-6" onSubmit={handleSubmit}>
  <Card>
    <CardHeader>
      <CardTitle>Section Name</CardTitle>
      <CardDescription>Section description</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Form fields */}
    </CardContent>
  </Card>
</form>
```

### Field Pattern

```tsx
<div className="space-y-2">
  <Label htmlFor="fieldId">Field Label</Label>
  <Input
    id="fieldId"
    placeholder="Placeholder text"
    value={value}
    onChange={(e) => setValue(e.target.value)}
  />
  <p className="text-muted-foreground text-xs">
    Help text explaining the field
  </p>
</div>
```

### Grid Layouts

```tsx
// Two column on desktop
<div className="grid gap-4 md:grid-cols-2">
  {/* Fields */}
</div>

// Three column on desktop
<div className="grid gap-4 md:grid-cols-3">
  {/* Fields */}
</div>
```

---

## Card Patterns

### Stat Card

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="font-medium text-sm">Metric Name</CardTitle>
    <Icon className="size-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="font-bold text-2xl">42</div>
    <p className="text-muted-foreground text-xs">+5% from last period</p>
  </CardContent>
</Card>
```

### List Item Card (Row Style)

```tsx
<div className="group flex items-center gap-4 rounded-lg border border-border/40 bg-card/50 p-4 transition-all duration-200 hover:border-border hover:bg-card">
  {/* Status indicator */}
  <StatusDot status={status} />

  {/* Main content - flexible */}
  <div className="min-w-0 flex-1">
    <h3 className="truncate font-medium">{title}</h3>
    <p className="truncate text-muted-foreground text-sm">{subtitle}</p>
  </div>

  {/* Stats - hidden on mobile */}
  <div className="hidden md:flex">
    {/* Responsive stats */}
  </div>

  {/* Actions */}
  <DropdownMenu>
    {/* Action menu */}
  </DropdownMenu>
</div>
```

### Settings Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Setting Group</CardTitle>
    <CardDescription>Description of settings</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Setting Name</p>
        <p className="text-muted-foreground text-sm">Setting description</p>
      </div>
      <Switch checked={value} onCheckedChange={setValue} />
    </div>
  </CardContent>
</Card>
```

---

## Empty States

### Standard Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12">
  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted/50">
    <Icon className="size-6 text-muted-foreground" />
  </div>
  <p className="font-medium">No items yet</p>
  <p className="mt-1 text-center text-muted-foreground text-sm">
    Description of what to do next
  </p>
  <Button className="mt-6">
    <Plus className="mr-2 size-4" />
    Create First Item
  </Button>
</div>
```

### Key Rules

- Icon container: `size-12` (not size-14 or other sizes)
- Icon inside: `size-6`
- Background: `bg-muted/50` with `rounded-full`
- Vertical padding: `py-12`

---

## Data Fetching

### Queries

```tsx
// With Suspense (preferred)
const [data] = api.resource.getAll.useSuspenseQuery();

// With optional parameters
const [data] = api.resource.getAll.useSuspenseQuery(
  search ? { search } : undefined
);

// Standard query (when Suspense not appropriate)
const { data, isLoading } = api.resource.getAll.useQuery();
```

### Mutations

```tsx
const utils = api.useUtils();

const mutation = api.resource.create.useMutation({
  onSuccess: () => {
    utils.resource.getAll.invalidate();
    toast.success("Created successfully");
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

// Usage
mutation.mutate({ name: "New Item" });
```

### Search with Deferred Value

```tsx
const [search, setSearch] = useState("");
const deferredSearch = useDeferredValue(search);

const [data] = api.resource.getAll.useSuspenseQuery(
  deferredSearch ? { search: deferredSearch } : undefined
);
```

---

## Status Indicators

### Available Components

Import from `@/components/shared`:

- **StatusDot** - Animated pulsing dot
- **StatusBadge** - Pill badge with optional icon
- **StatusText** - Colored text
- **UptimeBar** - Visual bar chart
- **OverallStatus** - Large status card

### Usage

```tsx
import { type Status, StatusDot, StatusBadge, UptimeBar } from "@/components/shared";

// StatusDot
<StatusDot status="UP" />
<StatusDot status="DOWN" animate={false} />

// StatusBadge
<StatusBadge status="UP" showIcon />

// UptimeBar
<UptimeBar days={30} />
```

### CSS Custom Properties

Status colors are also available as CSS variables:

- `--status-up`: green-500
- `--status-down`: red-500
- `--status-degraded`: yellow-500
- `--status-maintenance`: blue-500
- `--status-pending`: neutral-500

---

## Button Patterns

### Variants

```tsx
// Primary action
<Button>Create Item</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Tertiary action
<Button variant="ghost">View Details</Button>

// Destructive action
<Button variant="destructive">Delete</Button>
```

### Icon Buttons

```tsx
// Icon only
<Button size="icon-sm" variant="ghost">
  <MoreHorizontal className="size-4" />
</Button>

// Icon with text
<Button>
  <Plus className="mr-2 size-4" />
  Add Item
</Button>
```

### Link Buttons

```tsx
<Button asChild>
  <Link href="/path">Navigate</Link>
</Button>
```

---

## Responsive Patterns

### Progressive Disclosure

Hide less important information on smaller screens:

```tsx
{/* Always visible */}
<div className="flex items-center gap-4">
  <StatusDot status={status} />
  <span>{name}</span>
</div>

{/* Hidden on mobile, visible on tablet+ */}
<div className="hidden md:flex">
  {/* Stats */}
</div>

{/* Hidden on mobile/tablet, visible on desktop */}
<div className="hidden lg:flex">
  {/* Detailed info */}
</div>
```

### Responsive Grids

```tsx
{/* Single column mobile, 2 col tablet, 3 col desktop */}
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Breakpoint Reference

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

---

## Animation Patterns

### Transitions

Standard transition for interactive elements:

```tsx
className="transition-all duration-200 ease-out"
```

### Hover States

```tsx
// Card hover
className="hover:border-border hover:bg-card"

// Button hover (built into variants)
className="hover:bg-neutral-800"

// Link hover
className="hover:text-foreground"
```

### Click Feedback

```tsx
className="active:scale-[0.98]"
```

---

## File References

- Components: `src/components/ui/`
- Shared components: `src/components/shared/`
- Constants: `src/lib/constants.ts`
- Utilities: `src/lib/utils.ts`
- Global styles: `src/styles/globals.css`
