---
name: codex-collaboration
description: Automatically invoke GPT-5 Codex for security, regression, and engineering balance reviews. Use during code implementation, architecture decisions, and before deployment.
tools:
  - Read
  - Bash
  - Task
---

# Codex Collaboration Skill

## When This Skill Activates

Automatically applies during:
- Implementation of moderate/complex/critical features
- Architecture and design decisions
- Security-sensitive code (auth, payments, data access)
- Before merging features
- When user explicitly asks for code review

## What is Codex?

**GPT-5 Codex** is an expert code reviewer that provides:
- 🔒 Security vulnerability detection
- ⚠️ Regression risk assessment
- ⚖️ Engineering balance evaluation
- 🏗️ Code structure and maintainability feedback

## Automatic Checkpoints

Codex reviews happen automatically at these checkpoints during `/build-feature`:

### Checkpoint 1: After Spec Created
**What**: Review requirements and design
**Focus**:
- Technical feasibility
- Missing edge cases
- Over/under-engineering

```
🤖 Codex Checkpoint: Spec Review
   Reviewing: specs/feature-name.md
   Focus: Feasibility, edge cases, balance
```

### Checkpoint 2: After Tests Generated
**What**: Review test coverage and quality
**Focus**:
- Test completeness
- Edge cases covered
- Appropriate mocking

```
🤖 Codex Checkpoint: Test Review
   Reviewing: tests/**/*.test.ts
   Focus: Coverage, edge cases, test quality
```

### Checkpoint 3: After Database Migrations
**What**: Review schema changes and RLS policies
**Focus**:
- SQL injection prevention
- RLS policy gaps
- Performance issues (missing indexes)
- Data integrity constraints

```
🤖 Codex Checkpoint: Database Security
   Reviewing: supabase/migrations/*.sql
   Focus: RLS, injection, performance
```

### Checkpoint 4: After API Routes
**What**: Review server-side code
**Focus**:
- Authentication/authorization
- Input validation
- Error handling
- Breaking changes

```
🤖 Codex Checkpoint: API Security
   Reviewing: src/app/api/**/*.ts
   Focus: Auth, validation, error handling
```

### Checkpoint 5: After UI Components
**What**: Review client code and components
**Focus**:
- XSS prevention
- Client-side validation
- Accessibility
- Code structure

```
🤖 Codex Checkpoint: Component Review
   Reviewing: src/components/**/*.tsx
   Focus: XSS, validation, structure
```

### Checkpoint 6: Final Pre-Deployment
**What**: Comprehensive review of entire feature
**Focus**:
- Overall security posture
- Regression risks
- Maintainability
- Documentation

```
🤖 Codex Checkpoint: Final Review
   Reviewing: All feature files
   Focus: Security, regression, maintainability
```

## Review Types

### Security Review
**When**: Database changes, authentication, sensitive data
**Command**:
```bash
node testing-framework/agents/codex-reviewer.js security <files>
```

**Checks for**:
- SQL injection vectors
- XSS vulnerabilities
- CSRF protection
- RLS policy gaps
- Insecure data handling
- Authentication bypasses
- Authorization flaws

**Example Output**:
```
🔒 Security Review: Payment Processing

CRITICAL ISSUES (0):
  None found ✅

HIGH PRIORITY (1):
  ⚠️ Missing webhook signature verification
     File: src/app/api/webhooks/stripe/route.ts:15
     Fix: Verify stripe-signature header before processing

MEDIUM PRIORITY (2):
  ⚠️ Add idempotency key for payment creation
     File: src/lib/payments/create.ts:42
     Fix: Store and check idempotency_key to prevent duplicate charges

  ⚠️ RLS policy missing for payment_items table
     File: supabase/migrations/20250106_payments.sql
     Fix: Add policy to prevent users from viewing other's payments

APPROVED: ✅ (after addressing HIGH priority issues)
```

### Regression Review
**When**: Modifying existing features, refactoring
**Command**:
```bash
node testing-framework/agents/codex-reviewer.js regression <files>
```

**Checks for**:
- Breaking API changes
- Changed function signatures
- Removed features
- Modified behavior
- Side effects on other features

**Example Output**:
```
⚠️ Regression Review: Class Management Update

BREAKING CHANGES (1):
  ❌ Changed function signature
     File: src/lib/classes/create.ts
     Before: createClass(name, teacherId)
     After: createClass(classData)
     Impact: HIGH - Used in 12 places
     Fix: Create wrapper function for backward compatibility

POTENTIAL ISSUES (2):
  ⚠️ New required field: assistant_teacher_id
     Impact: MEDIUM - Existing forms will fail validation
     Fix: Make field optional or provide migration path

  ⚠️ Changed default capacity from 30 to 20
     Impact: LOW - May affect existing expectations
     Fix: Document in changelog

APPROVED: ❌ (address breaking changes first)
```

### Engineering Balance Review
**When**: Architecture decisions, design phase
**Command**:
```bash
node testing-framework/agents/codex-reviewer.js balance <spec>
```

**Checks for**:
- Over-engineering (too complex for requirements)
- Under-engineering (missing critical features)
- Appropriate abstractions
- Maintainability concerns
- Technical debt

**Example Output**:
```
⚖️ Engineering Balance Review: Email Notification System

BALANCE ASSESSMENT: Well-Balanced ✅

STRENGTHS:
  ✅ Appropriate use of queue for async processing
  ✅ Template system is flexible without over-abstraction
  ✅ Error handling and retries properly scoped

CONCERNS:
  💡 Consider: Current rate limiting might be too simple
     Current: Fixed 100 emails/hour
     Suggest: Per-user limits or tiered approach
     Impact: LOW - Can add later if needed

  💡 Consider: Email provider abstraction
     Current: Tightly coupled to Resend
     Suggest: Thin adapter layer for future flexibility
     Impact: MEDIUM - Worth 30 min investment

RECOMMENDATION: Proceed with implementation
  Optional: Add provider abstraction (30 min)
  Later: Enhance rate limiting if needed
```

## How Codex Integration Works

### Automatic Mode (During `/build-feature`)
```
You: /build-feature specs/payment-processing.md

Claude:
  📋 Spec review...
  🤖 Invoking Codex for spec review...
  [Codex reviews, provides feedback]
  [Claude updates spec based on feedback]
  ✅ Spec approved

  📝 Generating tests...
  🤖 Invoking Codex for test review...
  [Codex reviews test coverage]
  ✅ Tests approved

  🔨 Implementing...
  [After migrations]
  🤖 Codex checkpoint: Database security
  [Reviews RLS policies]
  ✅ Database approved

  [After API routes]
  🤖 Codex checkpoint: API security
  [Reviews auth and validation]
  ⚠️ Found 2 issues - auto-fixing...
  ✅ API approved (after fixes)
```

### Manual Mode (Standalone Review)
```
You: Can you review this payment route for security issues?

Claude: I'll invoke Codex for a security review...
  [Uses Task tool → codex-reviewer agent]
  [Displays Codex findings]

  Codex found 3 security issues:
  1. Missing webhook signature verification (HIGH)
  2. No idempotency key (MEDIUM)
  3. Consider rate limiting (LOW)

  Would you like me to fix these automatically?
```

## Auto-Fix vs Manual Review

### Auto-Fix (Default for Non-Critical Issues)
```
🤖 Codex found 2 issues in API route
⚡ Auto-fixing...

Fix 1: Added input validation
  File: src/app/api/classes/route.ts
  Lines: 15-20 added

Fix 2: Added error handling
  File: src/app/api/classes/route.ts
  Lines: 45-50 modified

✅ Fixes applied - running tests...
✅ All tests pass
```

### Manual Review (Critical Issues)
```
🤖 Codex found CRITICAL security issue
🚫 Auto-fix disabled - requires human review

CRITICAL: SQL Injection vulnerability
  File: src/lib/query-builder.ts:42
  Issue: User input directly concatenated into query
  Risk: Database compromise, data theft

  Current code:
    const query = `SELECT * FROM users WHERE name = '${userName}'`

  Recommended fix:
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('name', userName)  // Parameterized query

⚠️ This MUST be fixed before deployment.
Would you like me to apply the fix?
```

## Integration with Workflow Orchestrator

The workflow orchestrator enforces Codex collaboration:

```javascript
// From workflow-orchestrator.js

// Phase 1: DISCOVER
const codexReview = await codexReviewer.engineeringBalanceReview(brief);
if (!isCodexApproved(codexReview)) {
  // Auto-fix or escalate to human
}

// Phase 3: BUILD - Security checkpoint
const securityReview = await codexReviewer.securityReview(implementation);
if (!isCodexApproved(securityReview)) {
  // Block progression until fixed
}
```

**You cannot skip Codex checkpoints** - they are hard-coded gates.

## When to Invoke Codex Manually

Outside the `/build-feature` workflow, manually invoke Codex when:

### 1. Reviewing Existing Code
```
You: Review this authentication middleware for security issues
Claude: [Invokes codex-reviewer with security focus]
```

### 2. Debugging Production Issues
```
You: This RLS policy is blocking legitimate users
Claude: [Invokes codex-reviewer to analyze policy]
```

### 3. Refactoring Decisions
```
You: Should I refactor this into separate services?
Claude: [Invokes codex-reviewer for engineering balance]
```

### 4. Pre-Merge Review
```
You: Review my PR before I merge
Claude: [Full Codex review with security + regression focus]
```

## Codex Response Interpretation

### Approval Indicators
- ✅ "Approved"
- ✅ "Looks good"
- ✅ "No issues found"
- ✅ "Can proceed"
- ✅ "Acceptable"
- ✅ "Well-balanced"

### Rejection Indicators
- ❌ "Over-engineered"
- ❌ "Under-engineered"
- ❌ "Security risk"
- ❌ "Breaking change"
- ❌ "Needs improvement"
- ⚠️ "Consider"
- ⚠️ "Suggest"

### Directional Disagreement (Needs Human)
- 🚫 "Wrong approach"
- 🚫 "Fundamental issue"
- 🚫 "Architectural problem"
- 🚫 "Rethink"
- 🚫 "Start over"

## Best Practices

### ✅ DO:
- Trust Codex feedback on security
- Auto-fix non-critical issues
- Escalate critical issues to human review
- Run Codex at each checkpoint
- Document decisions when overriding Codex

### ❌ DON'T:
- Skip Codex checkpoints
- Ignore security warnings
- Deploy without final Codex review
- Override critical issues without justification

## Limitations

Codex is powerful but not perfect:

- **False Positives**: May flag non-issues (use judgment)
- **Context Limits**: May miss cross-file dependencies
- **Opinion**: Engineering balance is subjective
- **Coverage**: Can't catch everything (still need human review)

**Use Codex as a safety net, not a replacement for thinking.**

## Resources

- Framework: `docs/workflows/claude/CODEX_AGENT_GUIDELINES.md`
- Checkpoints: `.claude/CODEX-CHECKPOINT-GUIDE.md`
- Testing: `testing-framework/agents/codex-reviewer.js`
