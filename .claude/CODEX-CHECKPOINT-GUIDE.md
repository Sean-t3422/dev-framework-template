# Codex Checkpoint Review Guide

**CRITICAL**: This guide tells Claude when and how to invoke the `codex-reviewer` agent during `/build-feature` workflows.

## Core Principle

**Codex reviews are NOT optional for moderate/complex/critical features.**

**🔒 SECURITY + ⚡ PERFORMANCE = EQUALLY CRITICAL**

Every Codex review MUST check BOTH.

---

## When to Invoke Codex Reviewer

### Checkpoint 1: After Test Generation ✅
- Security tests present?
- Performance tests present?
- Test coverage sufficient?

### Checkpoint 2: After Database Migrations ✅
- RLS policies correct?
- Indexes on all queried columns?
- Migration reversible?

### Checkpoint 3: After API Routes Implementation ✅
- Authentication checks present?
- No N+1 queries?
- Response time monitoring?

### Checkpoint 4: After UI Components Implementation ✅
- XSS prevention?
- Components memoized?
- Lists virtualized?

### Checkpoint 5: After Integration Complete ✅
- End-to-end time acceptable?
- No regression risks?
- Data flows correctly?

### Checkpoint 6: Final Comprehensive Review ✅
- All security issues fixed?
- All performance targets met?
- Code maintainable?

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

## How to Invoke Codex Reviewer

Use the **Task tool** with `subagent_type: "codex-reviewer"`

---

## Critical Reminders

1. **DO NOT SKIP CHECKPOINTS** - They catch issues early
2. **ACTUALLY INVOKE THE TASK TOOL** - Don't just say "I'll review"
3. **ACT ON FEEDBACK** - Address issues immediately
4. **SECURITY & PERFORMANCE FIRST** - Critical issues = STOP and fix
5. **PERFORMANCE IS NOT OPTIONAL** - Slow code is broken code
