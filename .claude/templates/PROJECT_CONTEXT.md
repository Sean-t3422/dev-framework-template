# Project Context - [PROJECT_NAME]

> **Purpose**: This file is the single source of truth for project-specific conventions.
> Claude Code reads this before every feature to understand the domain model and patterns.
> **Location**: Copy to `YOUR_PROJECT/.claude/PROJECT_CONTEXT.md`

---

## Project Overview

**Name**: [e.g., Homeschool Co-op Management]
**Type**: [e.g., Multi-tenant SaaS]
**Stack**: [e.g., Next.js 14, Supabase, TypeScript]

### Core Domain

[Describe in 2-3 sentences what this application does]

---

## Multi-Tenancy Model

### Tenant Identifier
- **Column**: `co_op_id` (UUID)
- **Present in**: All tenant-scoped tables
- **RLS Pattern**: `co_op_id = get_user_co_op_id(auth.uid())`

### Data Isolation
```
Tenant A (co_op_id: uuid-1)
├── families
├── students
├── classes
└── payments

Tenant B (co_op_id: uuid-2)
├── families (ISOLATED - cannot see A's data)
├── students
├── classes
└── payments
```

---

## Role Hierarchy

| Role | Level | Can Access |
|------|-------|------------|
| platform_admin | 0 | All co-ops (super admin) |
| admin | 1 | All data within their co-op |
| teacher | 2 | Their classes + assigned students |
| parent | 3 | Their family + their children |
| student | 4 | Their own data only |

### Role Check Pattern
```typescript
// Always check role hierarchy, not equality
if (userRole <= requiredRole) {
  // Access granted
}
```

---

## Database Conventions

### Table Naming
- **Style**: snake_case, plural
- **Examples**: `family_groups`, `payment_items`, `class_enrollments`
- **Junction tables**: `entity1_entity2` (e.g., `family_members`)

### Column Naming
- **Style**: snake_case
- **Primary key**: `id` (UUID, always)
- **Foreign keys**: `{table_singular}_id` (e.g., `family_group_id`)
- **Timestamps**: `created_at`, `updated_at` (TIMESTAMPTZ)
- **Soft delete**: `deleted_at` (TIMESTAMPTZ, nullable)

### Common Columns
```sql
-- Every table should have:
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- Tenant-scoped tables add:
co_op_id UUID NOT NULL REFERENCES co_ops(id)
```

### Naming Gotchas (Project-Specific)
| Wrong | Correct | Reason |
|-------|---------|--------|
| `families` | `family_groups` | Legacy naming convention |
| `name` (in family_groups) | `family_name` | Disambiguate from other names |
| `users` | `profiles` | Supabase uses auth.users |
| `classes.teacher` | `classes.teacher_id` | Always use _id suffix |

---

## Entity Relationships

### Core Entities
```
profiles (extends auth.users)
    ├── co_op_memberships (role per co-op)
    │       └── co_ops
    └── family_members (junction)
            └── family_groups
                    └── students
                            └── class_enrollments
                                    └── classes
                                            └── teachers (profiles)
```

### Key Relationships
- A user can belong to MULTIPLE co-ops (different roles each)
- A family_group belongs to ONE co-op
- Students belong to ONE family_group
- Classes are taught by teachers (profiles with teacher role)

---

## API Patterns

### Route Structure
```
src/app/api/
├── admin/           # Admin-only endpoints
│   ├── members/
│   └── classes/
├── teacher/         # Teacher endpoints
├── parent/          # Parent endpoints
└── public/          # Unauthenticated endpoints
```

### Standard Response Format
```typescript
// Success
return NextResponse.json({ data: result }, { status: 200 });

// Error
return NextResponse.json(
  { error: 'Human-readable message', code: 'ERROR_CODE' },
  { status: 400 }
);
```

### Auth Pattern
```typescript
// Every protected route starts with:
const supabase = createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Then check role:
const { data: membership } = await supabase
  .from('co_op_memberships')
  .select('role')
  .eq('user_id', user.id)
  .eq('co_op_id', coOpId)
  .single();

if (!membership || membership.role > REQUIRED_ROLE) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## Component Patterns

### File Naming
- **Components**: PascalCase (e.g., `StudentCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase (e.g., `Student.ts` or in `types.ts`)

### Component Structure
```typescript
// Standard component file structure
'use client'; // If needed

import { ... } from 'react';
import { ... } from '@/components/ui';
import { ... } from '@/lib/...';
import type { ... } from '@/types';

interface Props {
  // Props definition
}

export function ComponentName({ prop1, prop2 }: Props) {
  // Implementation
}
```

### State Management
- **Server state**: React Query (TanStack Query)
- **Form state**: React Hook Form + Zod
- **UI state**: useState/useReducer (local)
- **Global state**: Context (sparingly)

---

## Testing Conventions

### Test File Location
```
tests/
├── unit/           # Pure function tests
├── integration/    # API route tests
├── e2e/            # Playwright user flows
└── security/       # RLS policy tests
```

### Test Naming
```typescript
// Pattern: {feature}.{type}.test.ts
// Examples:
'student-enrollment.integration.test.ts'
'payment-validation.unit.test.ts'
'admin-dashboard.e2e.test.ts'
'classes-rls.security.test.ts'
```

---

## Security Requirements

### RLS Policies (MANDATORY)
Every table MUST have:
1. RLS enabled
2. Admin policy for co-op admins
3. User policy appropriate to data type
4. Index on co_op_id

### Input Validation
- All user input validated with Zod
- SQL uses parameterized queries only
- HTML output sanitized (DOMPurify)

### Rate Limiting
- Admin endpoints: 100 req/min
- User endpoints: 60 req/min
- Public endpoints: 30 req/min

---

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| API P95 | < 200ms | < 500ms |
| DB Query | < 100ms | < 200ms |
| Page Load | < 2s | < 4s |
| Bundle Size | < 500KB | < 1MB |

---

## Common Mistakes to Avoid

1. **Wrong table name**: Use `family_groups` not `families`
2. **Missing RLS**: Every new table needs RLS immediately
3. **N+1 queries**: Use RPC functions for complex queries
4. **Missing indexes**: Index all foreign keys
5. **Direct auth.users access**: Use profiles table instead
6. **SELECT ***: Always select specific columns
7. **Missing tenant filter**: Always include co_op_id in queries

---

## Quick Reference

### Get Current User's Co-op
```typescript
const { data: membership } = await supabase
  .from('co_op_memberships')
  .select('co_op_id, role')
  .eq('user_id', user.id)
  .single();
```

### Check Permission
```typescript
import { canAccess } from '@/lib/permissions';

if (!canAccess(userRole, 'manage_classes')) {
  return unauthorized();
}
```

### Create Tenant-Scoped Query
```typescript
const { data } = await supabase
  .from('students')
  .select('id, first_name, last_name')
  .eq('co_op_id', coOpId)  // ALWAYS include this
  .order('last_name');
```
