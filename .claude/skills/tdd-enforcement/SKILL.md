---
name: tdd-enforcement
description: Automatically enforce Test-Driven Development practices. Use when implementing features, writing code, or when tests are mentioned. Ensures tests are written before implementation.
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# TDD Enforcement Skill

## When This Skill Activates

Automatically applies when:
- User says "implement", "build", "create feature"
- Working on files in `src/` without corresponding tests
- User mentions "tests" or "testing"
- During `/build-feature` workflow

## Core TDD Principle

**RED → GREEN → REFACTOR**

1. **RED**: Write failing tests first
2. **GREEN**: Write minimal code to pass tests
3. **REFACTOR**: Improve code while keeping tests green

## Complexity-Adaptive Testing

The framework uses complexity levels to determine test coverage:

### Trivial (No Tests)
- Typo fixes
- Copy/text updates
- Simple config changes

### Simple (Integration Tests Only)
- Single-file changes
- UI tweaks
- Basic CRUD operations

**Coverage**: 30%

```typescript
// tests/integration/feature-name.integration.test.ts
describe('Feature Name', () => {
  it('should perform basic operation', async () => {
    // Test the happy path
  });
});
```

### Moderate (Integration + Unit)
- Form validation
- Multi-file features
- Business logic

**Coverage**: 50%

```typescript
// tests/integration/feature.integration.test.ts
// tests/unit/feature-logic.unit.test.ts
// tests/unit/feature-validation.unit.test.ts
```

### Complex (Integration + Unit + E2E)
- New workflows
- Multi-step processes
- State management

**Coverage**: 70%

Add E2E tests with Playwright:
```typescript
// tests/e2e/feature-flow.e2e.test.ts
test('user completes entire workflow', async ({ page }) => {
  // Test full user journey
});
```

### Critical (All + Security)
- Authentication/Authorization
- Payment processing
- Data privacy features

**Coverage**: 85%

Add security tests:
```typescript
// tests/security/feature-rls.security.test.ts
describe('RLS Security', () => {
  it('prevents unauthorized access', async () => {
    // Test RLS policies
  });
});
```

## TDD Workflow Enforcement

### Step 1: Block Implementation Without Tests

When you detect implementation before tests:

```
⚠️ TDD VIOLATION DETECTED

You're about to write implementation code without tests!

This violates TDD principles. Would you like me to:
1. Write tests first (recommended)
2. Continue anyway (not recommended)

Choose: _
```

### Step 2: Write Failing Tests First

```typescript
// Example: Feature to add email validation

// FIRST: Write the test (it will fail)
describe('Email Validation', () => {
  it('should reject invalid emails', () => {
    expect(validateEmail('notanemail')).toBe(false);
  });

  it('should accept valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
});

// Run test: ❌ FAIL (function doesn't exist yet)
```

### Step 3: Minimal Implementation

```typescript
// NOW: Write minimal code to pass
export function validateEmail(email: string): boolean {
  return email.includes('@');
}

// Run test: ✅ PASS
```

### Step 4: Refactor

```typescript
// FINALLY: Improve implementation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Run test: ✅ STILL PASS
```

## Test File Structure

### Location Mapping
```
src/app/(app)/classes/[id]/edit/page.tsx
  → tests/integration/classes-edit.integration.test.ts
  → tests/unit/classes-validation.unit.test.ts

src/lib/utils/email.ts
  → tests/unit/email-utils.unit.test.ts

src/components/ui/Button.tsx
  → tests/unit/Button.unit.test.ts
```

### Naming Convention
- Integration: `feature-name.integration.test.ts`
- Unit: `component-name.unit.test.ts`
- E2E: `workflow-name.e2e.test.ts`
- Security: `feature-rls.security.test.ts`

## Common Test Patterns

### Integration Test (API Route)
```typescript
import { createClient } from '@/lib/supabase/server';

describe('GET /api/classes', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeEach(async () => {
    supabase = createClient();
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup
  });

  it('returns classes for authenticated user', async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*');

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
  });

  it('filters by teacher role', async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', 'test-teacher-id');

    expect(data).toHaveLength(1);
    expect(data[0].teacher_id).toBe('test-teacher-id');
  });
});
```

### Unit Test (Validation Logic)
```typescript
import { validateClassData } from '@/lib/validations/class';

describe('validateClassData', () => {
  it('accepts valid class data', () => {
    const valid = {
      name: 'Math 101',
      teacher_id: 'uuid',
      capacity: 20
    };

    expect(validateClassData(valid)).toEqual({ success: true });
  });

  it('rejects missing required fields', () => {
    const invalid = { name: 'Math 101' };

    const result = validateClassData(invalid);
    expect(result.success).toBe(false);
    expect(result.error).toContain('teacher_id');
  });

  it('rejects negative capacity', () => {
    const invalid = {
      name: 'Math 101',
      teacher_id: 'uuid',
      capacity: -5
    };

    const result = validateClassData(invalid);
    expect(result.success).toBe(false);
    expect(result.error).toContain('capacity');
  });
});
```

### E2E Test (User Flow)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Class Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
  });

  test('admin can create new class', async ({ page }) => {
    await page.goto('http://localhost:3000/classes');
    await page.click('text=Add Class');

    await page.fill('[name="name"]', 'Science 101');
    await page.fill('[name="capacity"]', '25');
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Science 101')).toBeVisible();
  });
});
```

### Security Test (RLS)
```typescript
import { createClient } from '@/lib/supabase/server';

describe('Classes RLS Policies', () => {
  it('prevents non-admin from viewing all classes', async () => {
    const supabase = createClient(); // Regular user

    const { data, error } = await supabase
      .from('classes')
      .select('*');

    // Should only see their own classes
    expect(data?.every(c => c.teacher_id === 'current-user-id')).toBe(true);
  });

  it('allows admin to view all classes', async () => {
    const supabase = createClient(); // Admin user

    const { data, error } = await supabase
      .from('classes')
      .select('*');

    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
  });
});
```

## Test Running Strategy

### During Development
```bash
# Watch mode - runs tests on file save
npm test -- --watch

# Run specific test file
npm test -- classes-edit.integration.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create"
```

### Before Commit
```bash
# All tests
npm test

# Coverage report
npm test -- --coverage
```

### CI/CD
```bash
# Fail if coverage below threshold
npm test -- --coverage --coverageThreshold='{"global": {"lines": 70}}'
```

## Integration with Dev Framework

### During `/build-feature`
1. Complexity analysis determines test level
2. Tests are generated BEFORE implementation
3. You implement to make tests pass
4. Codex reviews test quality
5. Tests must pass before feature is complete

### Standalone TDD
When working outside `/build-feature`:
- This skill activates automatically
- Reminds you to write tests first
- Guides test structure based on file type
- Enforces RED → GREEN → REFACTOR

## Warning Signs (TDD Violations)

This skill will warn you if:
- ❌ Implementation exists without tests
- ❌ Tests are skipped/commented out
- ❌ Coverage drops below complexity threshold
- ❌ Tests are written after implementation
- ❌ Tests only test happy path (no edge cases)

## Best Practices

### ✅ DO:
- Write tests first
- Test edge cases and error conditions
- Keep tests focused (one assertion per test)
- Use descriptive test names
- Mock external dependencies
- Run tests frequently

### ❌ DON'T:
- Skip tests for "quick fixes"
- Write tests after implementation
- Test implementation details
- Couple tests to internal structure
- Use real API calls in unit tests
- Commit failing tests

## Mocking Patterns

### Mock Supabase Client
```typescript
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: mockData, error: null }))
    }))
  }))
};
```

### Mock Next.js Router
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  })
}));
```

### Mock Environment Variables
```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Testing](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- Framework: `docs/TDD_WORKFLOW_SPECIFICATION.md`
- Patterns: `docs/workflows/claude/test-patterns/MOCK_PATTERNS.md`
