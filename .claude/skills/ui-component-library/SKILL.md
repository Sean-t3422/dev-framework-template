# UI Component Library Skill

**Purpose**: Check existing components BEFORE building custom ones. This skill provides a catalog of available UI components from shadcn/ui and Radix UI.

---

## Discovery Hierarchy (FOLLOW THIS ORDER!)

```
1. OUR CODEBASE FIRST
   Check: src/components/ui/
   Check: src/components/
   If found → USE IT

2. shadcn/ui COMPONENTS
   Pre-built, accessible, customizable
   If available → INSTALL AND USE IT

3. RADIX UI PRIMITIVES
   Unstyled, accessible building blocks
   If available → COMPOSE WITH TAILWIND

4. BUILD CUSTOM (LAST RESORT)
   Only if nothing above works
   Document WHY custom was needed
```

---

## shadcn/ui Component Catalog

### Layout & Structure
| Component | Use Case | Install |
|-----------|----------|---------|
| **Card** | Content containers, dashboard widgets | `npx shadcn-ui@latest add card` |
| **Separator** | Visual dividers | `npx shadcn-ui@latest add separator` |
| **Accordion** | Collapsible content sections | `npx shadcn-ui@latest add accordion` |
| **Tabs** | Tabbed navigation/content | `npx shadcn-ui@latest add tabs` |
| **Collapsible** | Show/hide content | `npx shadcn-ui@latest add collapsible` |
| **Resizable** | Resizable panels | `npx shadcn-ui@latest add resizable` |
| **Scroll Area** | Custom scrollbars | `npx shadcn-ui@latest add scroll-area` |
| **Aspect Ratio** | Fixed aspect ratio containers | `npx shadcn-ui@latest add aspect-ratio` |

### Forms & Inputs
| Component | Use Case | Install |
|-----------|----------|---------|
| **Form** | Form handling with react-hook-form | `npx shadcn-ui@latest add form` |
| **Input** | Text inputs | `npx shadcn-ui@latest add input` |
| **Textarea** | Multi-line text | `npx shadcn-ui@latest add textarea` |
| **Select** | Dropdown selection | `npx shadcn-ui@latest add select` |
| **Checkbox** | Boolean selection | `npx shadcn-ui@latest add checkbox` |
| **Radio Group** | Single selection from options | `npx shadcn-ui@latest add radio-group` |
| **Switch** | Toggle on/off | `npx shadcn-ui@latest add switch` |
| **Slider** | Range selection | `npx shadcn-ui@latest add slider` |
| **Date Picker** | Date selection | `npx shadcn-ui@latest add date-picker` |
| **Calendar** | Date display/selection | `npx shadcn-ui@latest add calendar` |
| **Combobox** | Searchable select | `npx shadcn-ui@latest add combobox` |
| **Input OTP** | One-time password input | `npx shadcn-ui@latest add input-otp` |

### Buttons & Actions
| Component | Use Case | Install |
|-----------|----------|---------|
| **Button** | All button types | `npx shadcn-ui@latest add button` |
| **Toggle** | Binary state buttons | `npx shadcn-ui@latest add toggle` |
| **Toggle Group** | Grouped toggle buttons | `npx shadcn-ui@latest add toggle-group` |

### Navigation
| Component | Use Case | Install |
|-----------|----------|---------|
| **Navigation Menu** | Main site navigation | `npx shadcn-ui@latest add navigation-menu` |
| **Menubar** | Application menubar | `npx shadcn-ui@latest add menubar` |
| **Breadcrumb** | Path navigation | `npx shadcn-ui@latest add breadcrumb` |
| **Pagination** | Page navigation | `npx shadcn-ui@latest add pagination` |
| **Command** | Command palette (cmd+k) | `npx shadcn-ui@latest add command` |
| **Sidebar** | Side navigation | `npx shadcn-ui@latest add sidebar` |

### Overlays & Modals
| Component | Use Case | Install |
|-----------|----------|---------|
| **Dialog** | Modal dialogs | `npx shadcn-ui@latest add dialog` |
| **Alert Dialog** | Confirmation dialogs | `npx shadcn-ui@latest add alert-dialog` |
| **Sheet** | Slide-out panels | `npx shadcn-ui@latest add sheet` |
| **Drawer** | Bottom/side drawers | `npx shadcn-ui@latest add drawer` |
| **Popover** | Floating content | `npx shadcn-ui@latest add popover` |
| **Tooltip** | Hover information | `npx shadcn-ui@latest add tooltip` |
| **Hover Card** | Rich hover previews | `npx shadcn-ui@latest add hover-card` |
| **Context Menu** | Right-click menus | `npx shadcn-ui@latest add context-menu` |
| **Dropdown Menu** | Dropdown menus | `npx shadcn-ui@latest add dropdown-menu` |

### Data Display
| Component | Use Case | Install |
|-----------|----------|---------|
| **Table** | Data tables | `npx shadcn-ui@latest add table` |
| **Data Table** | Advanced tables with sorting/filtering | `npx shadcn-ui@latest add data-table` |
| **Avatar** | User avatars | `npx shadcn-ui@latest add avatar` |
| **Badge** | Status indicators, tags | `npx shadcn-ui@latest add badge` |
| **Label** | Form labels | `npx shadcn-ui@latest add label` |
| **Progress** | Progress bars | `npx shadcn-ui@latest add progress` |
| **Skeleton** | Loading placeholders | `npx shadcn-ui@latest add skeleton` |
| **Chart** | Data visualization | `npx shadcn-ui@latest add chart` |
| **Carousel** | Image/content carousel | `npx shadcn-ui@latest add carousel` |

### Feedback
| Component | Use Case | Install |
|-----------|----------|---------|
| **Alert** | Inline messages | `npx shadcn-ui@latest add alert` |
| **Toast** | Notifications | `npx shadcn-ui@latest add toast` |
| **Sonner** | Better toast notifications | `npx shadcn-ui@latest add sonner` |

---

## Radix UI Primitives

Use these when you need unstyled building blocks for custom designs:

### Core Primitives
| Primitive | Purpose |
|-----------|---------|
| `@radix-ui/react-accordion` | Collapsible sections |
| `@radix-ui/react-alert-dialog` | Accessible confirmation dialogs |
| `@radix-ui/react-avatar` | User avatars with fallback |
| `@radix-ui/react-checkbox` | Accessible checkbox |
| `@radix-ui/react-collapsible` | Show/hide content |
| `@radix-ui/react-context-menu` | Right-click menus |
| `@radix-ui/react-dialog` | Modal dialogs |
| `@radix-ui/react-dropdown-menu` | Dropdown menus |
| `@radix-ui/react-hover-card` | Rich hover content |
| `@radix-ui/react-label` | Accessible labels |
| `@radix-ui/react-menubar` | Application menubar |
| `@radix-ui/react-navigation-menu` | Site navigation |
| `@radix-ui/react-popover` | Floating content |
| `@radix-ui/react-progress` | Progress indicators |
| `@radix-ui/react-radio-group` | Radio buttons |
| `@radix-ui/react-scroll-area` | Custom scrollbars |
| `@radix-ui/react-select` | Select dropdowns |
| `@radix-ui/react-separator` | Visual dividers |
| `@radix-ui/react-slider` | Range sliders |
| `@radix-ui/react-switch` | Toggle switches |
| `@radix-ui/react-tabs` | Tab panels |
| `@radix-ui/react-toast` | Notifications |
| `@radix-ui/react-toggle` | Toggle buttons |
| `@radix-ui/react-toggle-group` | Grouped toggles |
| `@radix-ui/react-tooltip` | Tooltips |

### Utility Primitives
| Primitive | Purpose |
|-----------|---------|
| `@radix-ui/react-aspect-ratio` | Fixed aspect containers |
| `@radix-ui/react-portal` | Render outside DOM hierarchy |
| `@radix-ui/react-presence` | Animate mount/unmount |
| `@radix-ui/react-slot` | Merge props to child |
| `@radix-ui/react-visually-hidden` | Screen reader only |

---

## Pattern Matching Guide

When you need to build something, check this table first:

| You Need This | Use This Instead |
|---------------|------------------|
| Modal/popup | `Dialog` or `AlertDialog` |
| Dropdown select | `Select` or `Combobox` |
| Side panel | `Sheet` |
| Notifications | `Sonner` (preferred) or `Toast` |
| Data table | `DataTable` |
| Form validation | `Form` (uses react-hook-form + zod) |
| Command palette | `Command` |
| Date picker | `DatePicker` + `Calendar` |
| Loading skeleton | `Skeleton` |
| User avatar | `Avatar` |
| Confirmation | `AlertDialog` |
| Right-click menu | `ContextMenu` |
| Hover preview | `HoverCard` |
| Accordion FAQ | `Accordion` |
| Tab panels | `Tabs` |
| Toggle buttons | `Toggle` or `ToggleGroup` |
| Progress bar | `Progress` |
| Charts/graphs | `Chart` (uses Recharts) |
| Breadcrumbs | `Breadcrumb` |
| Pagination | `Pagination` |

---

## Common Composition Patterns

### Form with Validation
```tsx
// Uses: Form, Input, Button, Label
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
```

### Data Table with Actions
```tsx
// Uses: DataTable, DropdownMenu, Button
import { DataTable } from "@/components/ui/data-table"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
```

### Modal Form
```tsx
// Uses: Dialog, Form, Button
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
```

### Slide-out Panel
```tsx
// Uses: Sheet
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
```

### Command Palette
```tsx
// Uses: Command, Dialog
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
```

---

## When to Build Custom

Only build custom components when:

1. **No shadcn/ui or Radix equivalent exists**
2. **Very specific business logic** that can't be composed from primitives
3. **Performance critical** (rare) - like virtualized lists beyond what DataTable provides
4. **Brand-specific design** that can't be achieved with Tailwind customization

**Always document why custom was needed** in the Story's "Build Custom" section.

---

## Quick Reference Commands

```bash
# Install all commonly used components
npx shadcn-ui@latest add button card dialog form input label select table toast

# Install for forms
npx shadcn-ui@latest add form input textarea select checkbox radio-group switch

# Install for data display
npx shadcn-ui@latest add table data-table avatar badge skeleton

# Install for navigation
npx shadcn-ui@latest add navigation-menu breadcrumb tabs

# Install for feedback
npx shadcn-ui@latest add alert toast sonner
```

---

## Integration with UI Guru

When UI Guru (design-uiguru-generator) creates designs:

1. **Before designing**: Load this skill to know what's available
2. **During design**: Reference existing components, don't reinvent
3. **In output**: Specify which shadcn/ui components to use

Example UI Guru output:
```markdown
## Components to Use
- shadcn/ui Dialog for modal
- shadcn/ui Form with Input, Select
- shadcn/ui Button (primary variant)
- shadcn/ui Table for data display
- Custom: None needed
```

---

## Checklist Before Building Custom

- [ ] Checked `src/components/ui/` for existing component?
- [ ] Checked shadcn/ui catalog above?
- [ ] Checked if Radix primitive + Tailwind can achieve this?
- [ ] Confirmed NO existing solution works?
- [ ] Documented reason in Story?

If all checked, proceed with custom component.
