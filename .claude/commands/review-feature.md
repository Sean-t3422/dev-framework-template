# Review Feature (Cross-LLM Review)

**Command**: `/review-feature`

**Description**: Runs cross-LLM competitive review on implemented code. Claude wrote it, Codex reviews it to catch bugs and blind spots.

---

## What it does

1. **Sends code to Codex** - Uses `gh copilot` for independent review
2. **Identifies issues** - Race conditions, edge cases, security gaps
3. **Compares approaches** - Claude's solution vs Codex's suggestions
4. **Tracks review** - Stores results in `.dev-framework/reviews/`
5. **Updates feature status** - Marks cross-LLM review as completed

---

## Usage

### Review specific files

```
/review-feature payment-flow src/payments/process.ts src/payments/stripe.ts
```

### Review entire feature directory

```
/review-feature login-flow src/auth/
```

---

## When to use

### ✅ REQUIRED for:
- **Complex features** (70% coverage requirement)
- **Critical features** (85% coverage requirement)
- Authentication/authorization code
- Payment processing
- Security-sensitive operations
- Data migrations
- RLS policy implementations

### ⚠️ Optional but recommended for:
- Moderate features with complex logic
- API integrations
- Multi-step workflows

### ❌ Not needed for:
- Trivial changes (typos, labels)
- Simple features (single component updates)
- Straightforward CRUD operations

---

## Workflow Example

**User says:** `/review-feature login-flow src/auth/login.ts src/auth/rate-limiter.ts`

**Claude responds:**

```
🤖 Running Cross-LLM Review on login-flow...

Reviewing: src/auth/login.ts
Reviewing: src/auth/rate-limiter.ts

─────────────────────────────────────────

📋 Review Results:

src/auth/login.ts:
  ✅ No critical issues found
  💡 Suggestion: Consider adding rate limiting info to error messages

src/auth/rate-limiter.ts:
  ⚠️  ISSUE: Race condition in concurrent requests
     Line 45: Multiple requests can bypass rate limit simultaneously
     Recommendation: Use Redis atomic operations or database locks

  ⚠️  ISSUE: No cleanup of expired entries
     Line 72: Rate limit entries never expire from storage
     Recommendation: Add TTL or periodic cleanup job

─────────────────────────────────────────

Summary:
  Files reviewed: 2
  Critical issues: 2
  Suggestions: 1

✓ Review saved to: .dev-framework/reviews/login-flow/

Next steps:
  1. Fix race condition in rate-limiter.ts
  2. Add cleanup mechanism for expired entries
  3. Optionally: Add rate limit info to error messages
  4. Re-run /review-feature after fixes
```

---

## Behind the scenes

This command runs:
```bash
node testing-framework/cli.js review <feature-id> <files...>
```

Which uses your existing:
```bash
./scripts/cross-llm-test.sh
```

---

## Review storage

Results are saved in:
```
.dev-framework/
└── reviews/
    └── feature-id/
        ├── review-2025-10-11.json
        └── latest-review.json
```

This tracking ensures:
- Quality gates can verify review was completed
- Historical record of issues found
- Team can see review status

---

## Integration with workflow

### Complete TDD + Review workflow:

```bash
# 1. Initialize feature with tests
/build-feature briefs/payment-flow.json

# 2. Implement following TDD
npm test  # Make tests pass

# 3. Run cross-LLM review (if complex/critical)
/review-feature payment-flow src/payments/

# 4. Address issues found

# 5. Re-review if major changes
/review-feature payment-flow src/payments/

# 6. Finalize and check gates
/finalize-feature payment-flow
```

---

## What gets reviewed

Codex checks for:
- **Logic errors** - Off-by-one, null checks, edge cases
- **Security issues** - SQL injection, XSS, auth bypass
- **Race conditions** - Concurrent access problems
- **Performance issues** - N+1 queries, memory leaks
- **Missing validation** - Input sanitization gaps
- **Error handling** - Unhandled exceptions
- **Best practices** - Anti-patterns, code smells

---

## Example: No issues found

```
User: /review-feature csv-export src/utils/export.ts

Claude:
🤖 Running Cross-LLM Review...

src/utils/export.ts:
  ✅ No issues found
  ✅ Error handling is appropriate
  ✅ Input validation is present

Summary: Code looks good! ✓
```

---

## Example: Critical issues

```
User: /review-feature auth-system src/auth/

Claude:
🤖 Running Cross-LLM Review...

⚠️  CRITICAL ISSUES FOUND

src/auth/password.ts:
  🔴 CRITICAL: Passwords stored in plaintext
     Line 23: No hashing before storage
     IMMEDIATE ACTION REQUIRED

src/auth/session.ts:
  🔴 CRITICAL: Session tokens predictable
     Line 45: Using timestamp-based token generation
     Security vulnerability - use crypto.randomBytes()

❌ DO NOT DEPLOY until these issues are fixed!

Next: Fix critical issues and re-run review.
```

---

## A/B Testing (Advanced)

For critical architecture decisions, use A/B test:

```
/ab-test "Design RLS policy for multi-tenant isolation" claude,gpt,gemini
```

This compares approaches from multiple LLMs and generates a report showing:
- Different implementation strategies
- Security trade-offs
- Performance implications
- Maintainability comparison

---

## Prerequisites

- `gh copilot` installed and authenticated
- Feature has been initialized with `/build-feature`
- Implementation code exists to review

---

## Notes

- **Review is mandatory** for complex/critical features
- Quality gates will block deployment without completed review
- Re-run review after addressing major issues
- Review results are tracked and stored
- Multiple reviewers (Codex, GPT, Gemini) can be used via A/B test

---

## Troubleshooting

**"gh copilot command not found"**
```bash
# Install GitHub Copilot CLI
./scripts/service-verify.sh  # Check what's installed
```

**"No issues found but I know there's a bug"**
- Try A/B test with multiple LLMs
- Different LLMs have different blind spots
- Manual code review still valuable

**"Too many false positives"**
- Use judgment - not all suggestions are critical
- Focus on security and logic issues first
- Style suggestions are lower priority

---

## Success indicators

You'll know it's working when:
- ✅ Real bugs are caught before deployment
- ✅ Security issues are identified
- ✅ Edge cases are discovered
- ✅ You learn from different LLM perspectives
