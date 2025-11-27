---
name: ui-design-patterns
description: Automatically apply UI/UX best practices, design system patterns, and accessibility guidelines when building React/Next.js components. Use when working with UI code.
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# UI Design Patterns Skill

## When This Skill Activates

Automatically applies when:
- Creating or modifying React/Next.js components
- Working with files in `src/components/` or `src/app/`
- User mentions UI/UX terms: "button", "form", "modal", "layout"
- UI-related tasks: "make it look better", "improve design"

## Design System Foundation

### Component Library Structure
```
src/components/
├── ui/              # Base design system components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── Modal.tsx
├── forms/           # Form-specific components
├── dashboard/       # Feature-specific components
└── layout/          # Layout components
```

### Always Check for Existing Components First!

**Before creating a new component:**
```bash
# Search for similar components
find src/components -name "*Button*"
find src/components -name "*Form*"

# Check if pattern already exists
grep -r "modal" src/components/ui/
```

**Reuse over recreation!**

## Tailwind CSS Patterns

### Spacing Scale (Use Consistently)
```tsx
// ✅ Good - follows scale
<div className="p-4 m-2 gap-3">
  {/* 4 = 1rem, 2 = 0.5rem, 3 = 0.75rem */}
</div>

// ❌ Bad - arbitrary values
<div className="p-[15px] m-[8px]">
  {/* Inconsistent spacing */}
</div>
```

**Scale Reference**: 1, 2, 3, 4, 6, 8, 12, 16, 20, 24

### Color Usage (Semantic Colors)
```tsx
// ✅ Good - semantic names
<button className="bg-blue-600 hover:bg-blue-700 text-white">

// ✅ Good - state variants
<div className="border-gray-200 dark:border-gray-700">

// ❌ Bad - random colors
<button className="bg-[#3b82f6]">
```

**Color Categories**:
- Primary actions: `blue-600`
- Destructive: `red-600`
- Success: `green-600`
- Warning: `yellow-600`
- Neutral: `gray-*`

### Responsive Design Patterns
```tsx
// ✅ Good - mobile-first
<div className="text-sm md:text-base lg:text-lg">
  {/* Scales up from mobile */}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>

// ❌ Bad - desktop-first
<div className="text-lg md:text-sm">
```

**Breakpoints**: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`

## Common UI Patterns

### Button Variants
```tsx
// Primary action
<Button className="bg-blue-600 hover:bg-blue-700 text-white">
  Save Changes
</Button>

// Secondary action
<Button
  variant="outline"
  className="border-gray-300 text-gray-700 hover:bg-gray-50"
>
  Cancel
</Button>

// Destructive action
<Button
  variant="destructive"
  className="bg-red-600 hover:bg-red-700 text-white"
>
  Delete
</Button>

// Ghost button
<Button
  variant="ghost"
  className="hover:bg-gray-100"
>
  Skip
</Button>
```

### Form Patterns
```tsx
// Consistent form structure
<form onSubmit={handleSubmit} className="space-y-6">
  {/* Form field group */}
  <div className="space-y-2">
    <label
      htmlFor="name"
      className="block text-sm font-medium text-gray-700"
    >
      Name
    </label>
    <input
      id="name"
      type="text"
      className="w-full rounded-md border-gray-300 shadow-sm
                 focus:border-blue-500 focus:ring-blue-500"
      aria-describedby="name-error"
    />
    {error && (
      <p id="name-error" className="text-sm text-red-600">
        {error}
      </p>
    )}
  </div>

  {/* Form actions */}
  <div className="flex justify-end gap-3">
    <Button type="button" variant="outline">
      Cancel
    </Button>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save'}
    </Button>
  </div>
</form>
```

### Card Patterns
```tsx
// Standard card
<Card className="p-6">
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>
    {/* Main content */}
  </Card.Content>
  <Card.Footer>
    {/* Actions */}
  </Card.Footer>
</Card>

// Clickable card
<Card
  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
  onClick={handleClick}
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  {/* Card content */}
</Card>
```

### Modal/Dialog Patterns
```tsx
// Accessible modal
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>

    {/* Modal body */}
    <div className="py-4">
      {children}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Loading States
```tsx
// Loading button
<Button disabled={isLoading}>
  {isLoading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Loading...' : 'Submit'}
</Button>

// Loading skeleton
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

// Loading overlay
{isLoading && (
  <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
    <Spinner className="h-8 w-8 text-blue-600" />
  </div>
)}
```

### Empty States
```tsx
// Helpful empty state
<div className="text-center py-12">
  <Icon className="mx-auto h-12 w-12 text-gray-400" />
  <h3 className="mt-2 text-sm font-semibold text-gray-900">
    No classes yet
  </h3>
  <p className="mt-1 text-sm text-gray-500">
    Get started by creating a new class.
  </p>
  <Button className="mt-6">
    <PlusIcon className="mr-2 h-4 w-4" />
    New Class
  </Button>
</div>
```

### Error States
```tsx
// Error message
<div className="rounded-md bg-red-50 p-4">
  <div className="flex">
    <XCircleIcon className="h-5 w-5 text-red-400" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-red-800">
        There was an error
      </h3>
      <div className="mt-2 text-sm text-red-700">
        <p>{error.message}</p>
      </div>
    </div>
  </div>
</div>
```

## Accessibility Checklist

### ✅ Required for Every Component

#### Semantic HTML
```tsx
// ✅ Good - semantic elements
<nav>
  <ul>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

// ❌ Bad - divs for everything
<div>
  <div>
    <div className="cursor-pointer" onClick={navigate}>About</div>
  </div>
</div>
```

#### ARIA Labels
```tsx
// Icon-only button
<button aria-label="Close dialog">
  <XIcon className="h-4 w-4" />
</button>

// Form input
<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && <p id="email-error">{error}</p>}
```

#### Keyboard Navigation
```tsx
// Clickable card (non-button element)
<div
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  tabIndex={0}
  role="button"
>
  {/* Card content */}
</div>

// Skip to main content
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to content
</a>
```

#### Focus Management
```tsx
// Visible focus ring
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click me
</button>

// Don't disable focus
// ❌ Bad
<button className="focus:outline-none">

// ✅ Good - replace with custom focus
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500">
```

#### Color Contrast
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Check contrast**: Use browser DevTools or online contrast checkers

## Layout Patterns

### App Layout (with Sidebar)
```tsx
// src/app/(app)/layout.tsx
export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <Header />
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
```

### Page Layout Pattern
```tsx
// Consistent page structure
export default function ClassesPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Classes
          </h1>
          <p className="text-sm text-gray-500">
            Manage your classes
          </p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {/* Filters/tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((c) => (
          <ClassCard key={c.id} class={c} />
        ))}
      </div>
    </div>
  );
}
```

## Performance Patterns

### Image Optimization
```tsx
import Image from 'next/image';

// ✅ Good - Next.js Image
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={800}
  height={600}
  priority // For above-fold images
/>

// ❌ Bad - regular img
<img src="/hero.jpg" alt="Hero image" />
```

### Code Splitting
```tsx
// Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Spinner />,
  ssr: false // If not needed on server
});
```

### Memoization
```tsx
// Expensive calculations
const filteredClasses = useMemo(() => {
  return classes.filter(c => c.status === filter);
}, [classes, filter]);

// Callbacks to prevent re-renders
const handleClick = useCallback(() => {
  setCount(c => c + 1);
}, []);
```

## Common Mistakes to Avoid

### ❌ Don't:
1. **Inline styles** - Use Tailwind classes
2. **Magic numbers** - Use spacing scale
3. **Nested ternaries** - Extract to components/functions
4. **onClick on div** - Use button or add keyboard handling
5. **Missing alt text** - Always provide for images
6. **Fixed pixel values** - Use responsive units
7. **Forgetting dark mode** - Use dark: variants
8. **No loading states** - Always show feedback
9. **Ignoring empty states** - Design for zero data
10. **Skip error boundaries** - Wrap risky components

## Integration with Dev Framework

### During `/build-feature`
When UI feature is detected:
1. Design options generated (minimal/balanced/rich)
2. User picks preferred design
3. Components built following patterns from this skill
4. UI quality reviewer polishes the result

### Standalone UI Work
This skill applies automatically when:
- Creating components
- Modifying styles
- Improving UX
- Fixing layout issues

## Resources

- Tailwind: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- React Aria: https://react-spectrum.adobe.com/react-aria/
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
