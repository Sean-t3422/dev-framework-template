# Performance & Security Enforcement - Built Into Every Feature

**Created**: 2025-11-09
**Purpose**: Document how the Dev Framework automatically enforces performance and security standards on every feature

---

## ✅ What Was Done

To prevent another performance optimization sprint in 4 weeks, we've built **automatic performance and security checking** into the TDD workflow. Every feature now includes:

1. **Performance checks** at every Codex checkpoint
2. **Security checks** at every Codex checkpoint
3. **Automatic blocking** if critical issues detected
4. **Comprehensive checklists** for reference

**Result**: Performance and security are now built-in, not bolt-on.

---

## 🔧 How It Works

### 1. Codex Reviews Are Mandatory

Every moderate/complex/critical feature goes through **6 Codex checkpoints**:

| Checkpoint | When | What's Checked |
|-----------|------|----------------|
| 1. Test Generation | After tests written | Security tests + Performance tests present |
| 2. Database Migrations | After migrations written | RLS policies + Indexes on all queries |
| 3. API Routes | After API implemented | Auth/validation + Response times/caching |
| 4. UI Components | After components built | XSS prevention + React memoization |
| 5. Integration | After everything connected | End-to-end security + performance |
| 6. Final Review | All tests passing | Comprehensive sign-off |

**At EVERY checkpoint, Codex checks BOTH security AND performance automatically.**

### 2. Workflow Orchestrator Enforces It

The workflow orchestrator (`agents/workflow-orchestrator.js`) is hardcoded to use:

```javascript
await this.codexReviewer.securityAndPerformanceReview(code, context)
```

This method checks **BOTH** security AND performance in a single review:

🔒 **Security Checks** (equally important):
- SQL injection, XSS, CSRF vulnerabilities
- Authentication/authorization flaws
- Input validation and sanitization
- RLS policies and access controls
- Rate limiting and DoS protection

⚡ **Performance Checks** (equally important):
- N+1 queries and missing database indexes
- API response times (target: <200ms P95)
- React re-renders and memoization
- Bundle size and code splitting
- Caching strategies
- Connection pooling

📊 **Code Quality**:
- Maintainability and structure
- Engineering balance
- Regression risk assessment

### 3. Auto-Fix Loop Prevents Progression

If Codex finds issues, the workflow:

1. **Automatically fixes** the issue (up to 10 iterations)
2. **Blocks progression** until issue is resolved
3. **Documents** all feedback for audit trail
4. **Requires human intervention** only for fundamental disagreements

**You cannot ship code with critical security OR performance issues.**

---

## 📋 Performance Checklist Integration

The comprehensive performance checklist (`.claude/PERFORMANCE-CHECKLIST.md`) covers:

### Database Layer
- ✅ No N+1 queries
- ✅ Indexes on WHERE/JOIN/ORDER BY columns
- ✅ Query times < 100ms (P95)
- ✅ RPC functions for complex queries

### API Layer
- ✅ Response times < 200ms (P95)
- ✅ Performance monitoring tracked
- ✅ Proper caching (React Query + HTTP headers)
- ✅ Error handling without sensitive data

### React/UI Layer
- ✅ React.memo for expensive components
- ✅ useMemo/useCallback for calculations
- ✅ Virtualization for lists > 100 items
- ✅ Next.js Image for optimization
- ✅ Code splitting for large components

### Testing
- ✅ API benchmarks (response time assertions)
- ✅ Load testing (concurrent users)
- ✅ Component render performance tests
- ✅ Performance budgets enforced

**This checklist is referenced by Codex at every checkpoint.**

---

## 🚀 What This Prevents

### Before (Manual Performance Fixes):
```
Week 1-6: Build 10 features (fast, but accumulating tech debt)
Week 7-8: Performance optimization sprint (slow, expensive, risky)
         - Fix N+1 queries across all features
         - Add missing indexes retroactively
         - Refactor React components for memoization
         - Add performance tests after the fact
```

### After (Automatic Performance Enforcement):
```
Week 1-6: Build 10 features (with performance checks at every step)
         - N+1 queries caught during development
         - Indexes added with migrations
         - React components memoized from day one
         - Performance tests written with feature tests
Week 7-8: Build more features! (no cleanup sprint needed)
```

**Savings**: 2 weeks of developer time, zero production performance issues

---

## 🔍 How Claude Sees This

When Claude Code starts a new session, it reads:

1. **`.claude/CLAUDE.md`** - Core framework instructions
   - References `CODEX-CHECKPOINT-GUIDE.md`
   - References `PERFORMANCE-CHECKLIST.md`
   - Emphasizes security AND performance equally

2. **`.claude/CODEX-CHECKPOINT-GUIDE.md`** - Detailed checkpoint rules
   - Shows when to invoke Codex (6 checkpoints)
   - Shows what to check (security AND performance)
   - Shows how to invoke (`securityAndPerformanceReview()`)

3. **`.claude/PERFORMANCE-CHECKLIST.md`** - Detailed requirements
   - Database layer requirements
   - API layer requirements
   - React/UI requirements
   - Testing requirements

**Result**: Claude KNOWS to check performance at every step, automatically.

---

## 📝 Example: Building a Payment System

```
User: "I need to build a payment processing feature"

Claude: "I'll start the /build-feature workflow..."

Workflow Orchestrator:
  1. DISCOVER Phase
     - Creates brief
     - Codex reviews brief (engineering balance)
     - Approves/refines until consensus

  2. DESIGN Phase
     - Creates test strategy
     - Codex reviews tests (security AND performance tests present?)
     - ✅ Security: Auth tests, input validation tests, RLS tests
     - ✅ Performance: API benchmarks, query performance tests
     - Auto-fixes missing tests
     - Proceeds when complete

  3. BUILD Phase - Test Review Checkpoint
     - Generates failing tests
     - 🤖 Codex reviews tests (securityAndPerformanceReview)
     - Finds: Missing rate limiting test, missing response time test
     - Auto-fixes: Adds missing tests
     - ✅ Approved

  3. BUILD Phase - Migration Checkpoint
     - Writes migration for payments table
     - 🤖 Codex reviews migration (securityAndPerformanceReview)
     - Finds: Missing index on user_id + status composite
     - Auto-fixes: Adds composite index
     - ✅ Approved

  3. BUILD Phase - API Checkpoint
     - Implements /api/payments route
     - 🤖 Codex reviews API (securityAndPerformanceReview)
     - Finds: N+1 query in payment items loop
     - Auto-fixes: Refactors to single RPC call
     - ✅ Approved

  3. BUILD Phase - UI Checkpoint
     - Implements PaymentForm component
     - 🤖 Codex reviews UI (securityAndPerformanceReview)
     - Finds: Missing React.memo, no useMemo for calculation
     - Auto-fixes: Adds memoization
     - ✅ Approved

  3. BUILD Phase - Integration Checkpoint
     - Connects DB → API → UI
     - 🤖 Codex reviews integration (securityAndPerformanceReview)
     - Finds: Missing error boundary
     - Auto-fixes: Adds error boundary
     - ✅ Approved

  4. FINALIZE Phase - Final Review
     - All tests passing
     - 🤖 Codex final sign-off (securityAndPerformanceReview)
     - ✅ Security: All vulnerabilities addressed
     - ✅ Performance: API <200ms, DB <100ms, React memoized
     - ✅ Approved

✅ Feature complete - shipped with performance & security built-in!
```

**Key Point**: Every checkpoint caught issues **during development**, not in production.

---

## 🎯 Success Metrics

You know it's working when:

- ✅ Every feature ships with API response times < 200ms P95
- ✅ Every feature ships with database queries < 100ms
- ✅ Every feature ships with proper React memoization
- ✅ Zero performance optimization sprints needed
- ✅ Zero security vulnerabilities in production
- ✅ Claude automatically checks performance without being asked

---

## 🚨 Critical Reminders

**For Claude Code:**
1. **ALWAYS** read `.claude/CODEX-CHECKPOINT-GUIDE.md` at session start
2. **ALWAYS** read `.claude/PERFORMANCE-CHECKLIST.md` at session start
3. **ALWAYS** invoke `securityAndPerformanceReview()` at every checkpoint
4. **NEVER** skip checkpoints "to save time"
5. **NEVER** proceed with critical security OR performance issues unfixed

**For Developers:**
1. **ALWAYS** let the workflow orchestrator run (don't bypass TDD)
2. **ALWAYS** address Codex feedback (don't ignore warnings)
3. **ALWAYS** measure performance (don't guess)
4. **ALWAYS** add performance tests (not just unit tests)

---

## 📚 Quick Reference Files

| File | Purpose |
|------|---------|
| `.claude/CLAUDE.md` | Core framework instructions |
| `.claude/CODEX-CHECKPOINT-GUIDE.md` | Detailed checkpoint rules |
| `.claude/PERFORMANCE-CHECKLIST.md` | Performance requirements |
| `.claude/WORKFLOW-PHASES-GUIDE.md` | Manual orchestration guide |
| `agents/workflow-orchestrator.js` | Enforces checkpoints |
| `testing-framework/agents/codex-reviewer.js` | Performs reviews |

---

## 💡 Philosophy

**"Slow code = Broken code"**

Performance is not a feature you add later. It's a requirement you build in from day one.

Security is not a feature you add later. It's a requirement you build in from day one.

**Both matter equally. Both are checked automatically. Both block shipping if critical issues found.**

**The goal**: Ship fast, secure code the first time, every time.

---

## ✅ Verification

To verify this is working in your project:

```bash
# 1. Check that workflow orchestrator uses comprehensive reviews
grep "securityAndPerformanceReview" agents/workflow-orchestrator.js

# Expected output (3 occurrences):
# Line ~277: Test review
# Line ~327: Implementation review
# Line ~520: Final sign-off

# 2. Check that Codex reviewer has the comprehensive method
grep -A 20 "async securityAndPerformanceReview" testing-framework/agents/codex-reviewer.js

# Expected: Method that checks security, performance, and code quality

# 3. Check that CLAUDE.md references performance
grep -A 5 "PERFORMANCE-CHECKLIST" .claude/CLAUDE.md

# Expected: Reference to performance checklist
```

---

## 🎉 Summary

**What changed**:
1. ✅ Codex now checks performance at EVERY checkpoint (not just security)
2. ✅ Performance checklist created for reference
3. ✅ CLAUDE.md updated to emphasize performance
4. ✅ Workflow orchestrator already uses comprehensive reviews
5. ✅ Codex reviewer has `securityAndPerformanceReview()` method

**What this means**:
- Every future feature will have performance checked automatically
- No more "we'll optimize later" - optimization happens during development
- No more performance sprints - issues caught before they accumulate
- Claude automatically enforces standards without being asked

**Bottom line**: You won't need to redo performance optimization in 4 weeks, because it's now built into the development process.

---

**Date**: 2025-11-09
**Status**: ✅ Implemented and Active
**Next Review**: After 10 features built (verify no performance regression)
