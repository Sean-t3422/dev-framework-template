# Codex Checkpoint Review Guide

**CRITICAL**: This guide tells Claude when and how to invoke the `codex-reviewer` agent during `/build-feature` workflows.

## Core Principle

**Codex reviews are NOT optional for moderate/complex/critical features.**

**🔒 SECURITY + ⚡ PERFORMANCE = EQUALLY CRITICAL**

Every Codex review MUST check BOTH:
- **Security**: RLS, auth, input validation, CSRF, SQL injection, XSS
- **Performance**: N+1 queries, indexes, API times, React memoization, caching

**🚨 MANDATORY: ALWAYS USE `securityAndPerformanceReview()` method!**

This is NOT optional. Every checkpoint checks:
1. ✅ **Security** - All vulnerabilities caught during implementation
2. ✅ **Performance** - All bottlenecks caught during implementation
3. ✅ **Code Quality** - Maintainability, engineering balance, regression risk

**Why Both Matter Equally:**
- Slow code = Broken code (kills UX, wastes money)
- Insecure code = Broken code (leaks data, destroys trust)
- We catch BOTH during development, not in production

Reviews happen at **continuous checkpoints throughout implementation**, not just at the end.

---

## When to Invoke Codex Reviewer

### Checkpoint 1: After Test Generation ✅

**Trigger**: Tests have been generated but NOT yet run

**🚨 USE: `securityAndPerformanceReview()` - checks BOTH automatically**

**What Codex Reviews**:

**🔒 Security Tests** (Critical):
- ✅ RLS policy tests for all tables
- ✅ Authentication/authorization tests
- ✅ Input validation tests (SQL injection, XSS prevention)
- ✅ CSRF protection tests for mutations
- ✅ Edge cases and boundary conditions

**⚡ Performance Tests** (Critical):
- ✅ API response time benchmarks (<200ms P95 target)
- ✅ Database query performance tests (no N+1 queries)
- ✅ Load testing scenarios for critical paths
- ✅ React component render performance tests
- ✅ Bundle size impact tests

**📊 General**:
- ✅ Test coverage sufficient for complexity level
- ✅ Test structure follows project patterns
- ✅ Tests fail correctly (TDD red phase)

**Action After Review**:
- Fix ALL critical security test gaps
- Fix ALL critical performance test gaps
- Update tests based on Codex feedback
- Re-run tests to ensure they still fail (TDD)

---

### Checkpoint 2: After Database Migrations ✅

**Trigger**: Migrations have been written to files

**What Codex Reviews**:

**Security**:
- ✅ RLS policies correctly implement tenant isolation
- ✅ No SQL injection vulnerabilities
- ✅ Foreign key constraints properly defined

**Performance**:
- ✅ Indexes on ALL frequently queried columns (WHERE, JOIN, ORDER BY)
- ✅ Composite indexes for multi-column queries
- ✅ Partial indexes for filtered queries (WHERE clauses)
- ✅ No missing indexes that would cause sequential scans
- ✅ ANALYZE statements after index creation

**General**:
- ✅ Table/column naming follows project conventions
- ✅ Migration is reversible (has DOWN migration)

**Action After Review**:
- Fix any security issues IMMEDIATELY
- Add missing performance indexes
- Update migrations before applying to database
- Document any architectural decisions

---

### Checkpoint 3: After API Routes Implementation ✅

**Trigger**: API route files have been created/modified

**What Codex Reviews**:

**Security**:
- ✅ Authentication/authorization checks
- ✅ CSRF protection for mutations
- ✅ Input validation present (Zod schemas, sanitization)
- ✅ Rate limiting considerations
- ✅ Proper use of Supabase client (not service role unless needed)

**Performance**:
- ✅ No N+1 queries (use RPC functions or batch queries)
- ✅ Response time monitoring (performance.now() tracking)
- ✅ Efficient database queries (single RPC call preferred)
- ✅ Proper caching headers set (Cache-Control, ETag)
- ✅ No unnecessary data fetching (select only needed columns)
- ✅ Connection pooling properly configured

**General**:
- ✅ Error handling comprehensive (try/catch, status codes)
- ✅ Code follows project patterns (dynamic exports, etc.)

**Action After Review**:
- Fix security vulnerabilities IMMEDIATELY
- Optimize slow queries and N+1 problems
- Add performance monitoring
- Improve error messages and logging

---

### Checkpoint 4: After UI Components Implementation ✅

**Trigger**: React components have been created/modified

**What Codex Reviews**:

**Security**:
- ✅ XSS prevention (no dangerouslySetInnerHTML without sanitization)
- ✅ Accessibility attributes (aria-labels, semantic HTML)

**Performance**:
- ✅ React.memo used for expensive components
- ✅ useMemo/useCallback for expensive calculations and callbacks
- ✅ No unnecessary re-renders (check component comparison function)
- ✅ List virtualization for long lists (>100 items)
- ✅ Image optimization (Next.js Image component, lazy loading)
- ✅ Code splitting for large components (dynamic imports)
- ✅ Debouncing/throttling for frequent events

**General**:
- ✅ Component structure clean and maintainable
- ✅ Proper use of hooks (no violations of Rules of Hooks)
- ✅ State management appropriate for complexity
- ✅ Error boundaries present for critical components
- ✅ Loading/error states handled

**Action After Review**:
- Fix any security issues
- Optimize component re-renders
- Add memoization where needed
- Refactor complex components
- Add accessibility improvements

---

### Checkpoint 5: After Integration Complete ✅

**Trigger**: All pieces connected (DB → API → UI)

**What Codex Reviews**:

**Security**:
- ✅ No breaking changes to existing features
- ✅ Proper error propagation through layers (no sensitive data leaks)

**Performance**:
- ✅ End-to-end response time acceptable (<500ms P95)
- ✅ No performance bottlenecks introduced
- ✅ Database queries optimized (no N+1, proper indexes used)
- ✅ Client-side caching working (React Query)
- ✅ Real-time subscriptions efficient (filtered, not global)
- ✅ Memory leaks prevented (cleanup on unmount)

**General**:
- ✅ Data flows correctly from UI → API → Database
- ✅ Integration tests cover critical paths
- ✅ Logging/monitoring adequate

**Action After Review**:
- Fix any performance bottlenecks
- Add integration tests for missing scenarios
- Fix any regression risks
- Document integration points

---

### Checkpoint 6: Final Comprehensive Review ✅

**Trigger**: Feature is complete, all tests passing

**What Codex Reviews** (Security & Performance EQUALLY important):

**🔒 Security** (Critical Priority):
- ✅ No vulnerabilities introduced (RLS, CSRF, XSS, SQL injection)
- ✅ Authentication/authorization working correctly
- ✅ Input validation comprehensive
- ✅ No sensitive data leaks in errors

**⚡ Performance** (Critical Priority):
- ✅ API response times meet targets (<200ms P95)
- ✅ Database queries optimized (no N+1, indexes used)
- ✅ Bundle size within limits (<2MB)
- ✅ React re-renders minimized (memoization used)
- ✅ Caching strategy implemented
- ✅ Load testing validates concurrent user capacity

**📊 Code Quality**:
- ✅ **Maintainability**: Code is readable and well-structured
- ✅ **Regression Risk**: Existing features won't break
- ✅ **Engineering Balance**: Not over-engineered, not under-engineered
- ✅ **Documentation**: Critical decisions documented
- ✅ **Testing**: Coverage meets complexity requirements

**Action After Review**:
- Fix ALL critical security issues
- Fix ALL critical performance issues
- Address maintainability concerns
- Consider Codex recommendations for improvements
- Document any technical debt for future work

---

## Complexity Level Rules

| Complexity | Checkpoints Required |
|------------|---------------------|
| **trivial** | None |
| **simple** | None |
| **moderate** | #1 (Tests), #6 (Final) |
| **complex** | #1, #2, #3, #4, #5, #6 (ALL) |
| **critical** | #1, #2, #3, #4, #5, #6 (ALL) |

---

## Example: Complex Feature Flow

```
User: /build-feature specs/payment-system.md

Claude:
1. Loads spec
2. Reviews spec with Codex + Gemini
3. Generates tests
4. 🤖 CHECKPOINT 1: Codex reviews tests ← INVOKE TASK TOOL
5. Updates tests based on feedback
6. Implements database migrations
7. 🤖 CHECKPOINT 2: Codex reviews migrations ← INVOKE TASK TOOL
8. Fixes RLS policy issues
9. Implements API routes
10. 🤖 CHECKPOINT 3: Codex reviews API routes ← INVOKE TASK TOOL
11. Adds missing error handling
12. Implements UI components
13. 🤖 CHECKPOINT 4: Codex reviews UI ← INVOKE TASK TOOL
14. Improves accessibility
15. Connects everything (integration)
16. 🤖 CHECKPOINT 5: Codex reviews integration ← INVOKE TASK TOOL
17. Adds integration tests
18. All tests passing
19. 🤖 CHECKPOINT 6: Final comprehensive review ← INVOKE TASK TOOL
20. Addresses final issues
21. Feature complete ✅
```

---

## Critical Reminders

1. **DO NOT SKIP CHECKPOINTS** - They catch issues early when they're cheap to fix
2. **ACTUALLY INVOKE THE TASK TOOL** - Don't just say "I'll review", actually call codex-reviewer
3. **ACT ON FEEDBACK** - Don't ignore Codex warnings, address them immediately
4. **SECURITY & PERFORMANCE FIRST** - Any critical security OR performance issue = STOP and fix before proceeding
5. **PERFORMANCE IS NOT OPTIONAL** - Slow code is broken code, optimize as you build
6. **DOCUMENT DECISIONS** - If you disagree with Codex, document why

---

## How to Invoke Codex Reviewer

**CRITICAL: Always use the `--security-and-performance` flag for comprehensive reviews!**

Use the **Task tool** with these parameters:

```
Tool: Task
Parameters:
  - subagent_type: "codex-reviewer"
  - description: "Comprehensive review [checkpoint] for [feature]"
  - prompt: "node testing-framework/agents/codex-reviewer.js --security-and-performance --file [filepath]

    OR for inline code review:

    Review the following code with --security-and-performance flag:

    Files:
    - src/app/api/payments/route.ts
    - src/lib/payments/service.ts
    - supabase/migrations/045_payments.sql

    Focus Areas (EQUALLY IMPORTANT):

    🔒 SECURITY:
    - RLS policies, input validation, CSRF protection
    - Authentication/authorization
    - No SQL injection or XSS vulnerabilities

    ⚡ PERFORMANCE:
    - No N+1 queries, proper indexes
    - Response time <200ms (P95)
    - React re-renders minimized
    - Caching strategy implemented

    📊 CODE QUALITY:
    - Maintainability and structure
    - Engineering balance (not over/under-engineered)
    - Regression risk assessment

    Provide specific feedback with:
    - ✅ What's good
    - ⚠️ What needs improvement
    - 🚨 Critical issues that must be fixed (security OR performance)

    Be thorough but concise."
```

---

## Checkpoint Template

When you reach a checkpoint, use this template:

```
🤖 CHECKPOINT [N]: [Name]

Invoking Codex reviewer to analyze:
[List files]

Focus: Security & Performance (equally important) + Code Quality

[Invoke Task tool with codex-reviewer]

[Wait for Codex response]

Codex Feedback:

🔒 SECURITY:
✅ [Good items]
⚠️ [Improvements needed]
🚨 [Critical issues]

⚡ PERFORMANCE:
✅ [Good items]
⚠️ [Improvements needed]
🚨 [Critical issues]

📊 CODE QUALITY:
✅ [Good items]
⚠️ [Improvements needed]

Action Items:
1. [Fix critical security issue X]
2. [Fix critical performance issue Y]
3. [Improve code quality Z]
4. [Document decision W]

[Make fixes]

✅ Checkpoint passed - proceeding to next phase
```

---

## What NOT to Do

❌ **DON'T** say "I'll review the code" and then implement without invoking Codex
❌ **DON'T** skip checkpoints "to save time" - they save MORE time by catching issues early
❌ **DON'T** ignore Codex warnings without documenting why
❌ **DON'T** proceed with critical security OR performance issues unfixed
❌ **DON'T** batch all reviews to the end - that defeats continuous quality gates
❌ **DON'T** focus only on security and ignore performance - they are EQUALLY important
❌ **DON'T** ship slow code thinking "we'll optimize later" - optimize as you build

---

## Success Metrics

You know you're doing it right when:
- ✅ Every checkpoint is documented in the conversation
- ✅ Codex feedback (security AND performance) is addressed before moving to next phase
- ✅ Security issues are caught and fixed during implementation (not in production)
- ✅ Performance issues are caught and fixed during implementation (not in production)
- ✅ API response times meet targets (<200ms P95)
- ✅ Database queries are optimized (no N+1, proper indexes)
- ✅ React components are memoized appropriately
- ✅ Code quality improves iteratively throughout the build
- ✅ Final review finds minimal issues (everything was caught earlier)

---

## Integration with TDD Workflow

Checkpoints integrate seamlessly with TDD:

1. **Red Phase**: Write failing tests (including performance benchmarks) → Codex reviews tests for security + performance coverage
2. **Green Phase**:
   - Implement DB migrations → Codex reviews (security RLS + performance indexes)
   - Implement API routes → Codex reviews (security validation + performance optimization)
   - Implement UI components → Codex reviews (security XSS + performance memoization)
   - Connect integration → Codex reviews (end-to-end security + performance)
3. **Refactor Phase**: Final comprehensive review → Codex provides security + performance + maintainability guidance

This ensures **security AND performance quality** at EVERY step, not just at the end.

**Performance is built-in, not bolted-on.**
