# Function Signature Standards

> **Purpose**: Ensure consistent function signatures across the codebase.
> This prevents the "51% test failure" problem where tests use different
> signatures than implementations.

---

## Core Principles

1. **TypeScript strict mode** - No `any`, no implicit returns
2. **Named parameters** for 3+ args - Use object destructuring
3. **Return type explicit** - Always declare return type
4. **Error handling** - Return Result type, don't throw

---

## Standard Patterns

### API Route Handler

```typescript
// src/app/api/{resource}/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Input validation schema
const CreateResourceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth check
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // 2. Parse and validate input
    const body = await request.json();
    const parsed = CreateResourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 3. Business logic
    const { data, error } = await supabase
      .from('resources')
      .insert({ ...parsed.data, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create resource', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // 4. Success response
    return NextResponse.json({ data }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

### Service Function

```typescript
// src/lib/services/{service}.ts

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Result type for service functions
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Service function signature
export async function createStudent(
  supabase: SupabaseClient<Database>,
  params: {
    firstName: string;
    lastName: string;
    familyGroupId: string;
    coOpId: string;
    birthDate?: string;
  }
): Promise<Result<Student>> {
  const { firstName, lastName, familyGroupId, coOpId, birthDate } = params;

  // Validation
  if (!firstName.trim()) {
    return { success: false, error: 'First name required', code: 'VALIDATION_ERROR' };
  }

  // Database operation
  const { data, error } = await supabase
    .from('students')
    .insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      family_group_id: familyGroupId,
      co_op_id: coOpId,
      birth_date: birthDate || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message, code: 'DB_ERROR' };
  }

  return { success: true, data };
}
```

### React Hook

```typescript
// src/hooks/use{Resource}.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UseStudentsOptions {
  coOpId: string;
  familyGroupId?: string;
  enabled?: boolean;
}

interface UseStudentsReturn {
  students: Student[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStudents({
  coOpId,
  familyGroupId,
  enabled = true,
}: UseStudentsOptions): UseStudentsReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['students', coOpId, familyGroupId],
    queryFn: async () => {
      const response = await fetch(
        `/api/students?coOpId=${coOpId}${familyGroupId ? `&familyGroupId=${familyGroupId}` : ''}`
      );
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    students: data?.data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
```

### React Component

```typescript
// src/components/{Component}.tsx

'use client';

import { memo, useCallback } from 'react';
import type { Student } from '@/types';

interface StudentCardProps {
  student: Student;
  onEdit?: (studentId: string) => void;
  onDelete?: (studentId: string) => void;
  showActions?: boolean;
  className?: string;
}

export const StudentCard = memo(function StudentCard({
  student,
  onEdit,
  onDelete,
  showActions = true,
  className = '',
}: StudentCardProps) {
  const handleEdit = useCallback(() => {
    onEdit?.(student.id);
  }, [onEdit, student.id]);

  const handleDelete = useCallback(() => {
    onDelete?.(student.id);
  }, [onDelete, student.id]);

  return (
    <div className={`student-card ${className}`}>
      <h3>{student.first_name} {student.last_name}</h3>
      {showActions && (
        <div className="actions">
          {onEdit && <button onClick={handleEdit}>Edit</button>}
          {onDelete && <button onClick={handleDelete}>Delete</button>}
        </div>
      )}
    </div>
  );
});
```

### Validation Schema

```typescript
// src/lib/validations/{entity}.ts

import { z } from 'zod';

// Base schema
export const StudentBaseSchema = z.object({
  firstName: z.string().min(1, 'First name required').max(50),
  lastName: z.string().min(1, 'Last name required').max(50),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
});

// Create schema (requires family)
export const CreateStudentSchema = StudentBaseSchema.extend({
  familyGroupId: z.string().uuid('Invalid family ID'),
});

// Update schema (all optional)
export const UpdateStudentSchema = StudentBaseSchema.partial();

// Types derived from schemas
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>;
```

### Database Types

```typescript
// src/types/database.ts (generated by Supabase)

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          family_group_id: string;
          co_op_id: string;
          birth_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['students']['Insert']>;
      };
      // ... other tables
    };
  };
}

// Convenience types
export type Student = Database['public']['Tables']['students']['Row'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];
```

---

## Naming Conventions

### Functions
| Pattern | Example |
|---------|---------|
| Fetch single | `getStudent(id)` |
| Fetch list | `listStudents(params)` |
| Create | `createStudent(data)` |
| Update | `updateStudent(id, data)` |
| Delete | `deleteStudent(id)` |
| Check | `canAccessStudent(userId, studentId)` |
| Validate | `validateStudentData(data)` |

### Variables
| Pattern | Example |
|---------|---------|
| Boolean | `isLoading`, `hasPermission`, `canEdit` |
| Handler | `handleSubmit`, `onDelete`, `onClick` |
| Ref | `inputRef`, `formRef` |
| State | `[students, setStudents]` |

### Types
| Pattern | Example |
|---------|---------|
| Entity | `Student`, `Class`, `Payment` |
| Input | `CreateStudentInput`, `UpdateStudentInput` |
| Props | `StudentCardProps`, `StudentListProps` |
| Return | `StudentResult`, `UseStudentsReturn` |

---

## Test Signature Matching

When writing tests, signatures MUST match implementation exactly:

```typescript
// ❌ WRONG - Different signature than implementation
test('createStudent should work', async () => {
  const result = await createStudent('John', 'Doe', 'family-123');
});

// ✅ CORRECT - Matches implementation signature
test('createStudent should work', async () => {
  const result = await createStudent(supabase, {
    firstName: 'John',
    lastName: 'Doe',
    familyGroupId: 'family-123',
    coOpId: 'coop-123',
  });
});
```

### Pre-Test Checklist
1. [ ] Read the actual function signature from source
2. [ ] Match parameter names exactly
3. [ ] Match parameter types exactly
4. [ ] Match return type exactly
5. [ ] Include all required parameters

---

## Migration from Old Patterns

If you find code not following these patterns:

1. **Don't refactor during feature work** - Create tech debt ticket
2. **New code must follow patterns** - No exceptions
3. **Tests must match current signatures** - Even if pattern is old
