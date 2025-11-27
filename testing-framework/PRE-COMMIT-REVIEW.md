# Pre-Commit Review System

## Overview

The Pre-Commit Review System reviews code **BEFORE** it's written to disk, catching issues early through cross-LLM critique and iterative refinement.

## The Problem It Solves

**Traditional Flow (Build → Review):**
```
1. Write code to files
2. Review finds bugs
3. Manually fix bugs
4. Re-review
5. Repeat...
```
❌ Expensive rework
❌ Issues caught too late
❌ Breaks TDD flow

**New Flow (Review → Build):**
```
1. Generate code (in memory)
2. Multiple LLMs review draft
3. Auto-refine based on feedback
4. Write approved code to disk
5. Tests already passing
```
✅ Issues caught before commit
✅ Automated refinement loop
✅ Higher quality on first write

## How It Works

### 1. Draft Generation
Claude (or any primary LLM) generates code based on requirements, but **doesn't write to disk yet**.

### 2. Multi-Reviewer Critique
The draft is sent to multiple LLM reviewers (Codex, Gemini, etc.) who check for:
- **Bugs & Edge Cases**: Null checks, race conditions, off-by-one errors
- **Security**: SQL injection, XSS, auth bypass, input validation
- **Performance**: N+1 queries, memory leaks, inefficient algorithms
- **Maintainability**: Naming, structure, future-dev-friendliness
- **Test Coverage**: Does it match test requirements?

### 3. Iterative Refinement
If reviewers find issues:
- Aggregate all feedback
- Claude refines the code
- Re-review the refined version
- Repeat up to N times (default: 3 iterations)

### 4. Approval Gate
Code is only written to disk if:
- **All reviewers approve**, OR
- **Majority approve** (if `requireConsensus: false`)

If not approved after max iterations:
- Present issues to developer
- Recommend manual review
- Don't automatically commit

## Usage

### Basic Usage

```javascript
const PreCommitReviewer = require('./pre-commit-reviewer');

const reviewer = new PreCommitReviewer({
  maxIterations: 3,
  requireConsensus: false,
  reviewers: ['codex', 'gemini'],
  autoRefine: true,
});

// Review a code draft before writing
const result = await reviewer.reviewDraft({
  code: `
    function processPayment(amount, userId) {
      const user = await db.users.find(userId);
      user.balance -= amount;
      await db.users.save(user);
      return { success: true };
    }
  `,
  filepath: 'src/payments/process.ts',
  purpose: 'Process payment and update user balance',
}, {
  requirements: 'Must handle race conditions, validate amount, check balance',
});

if (result.success) {
  // Code approved - safe to write
  await fs.writeFile(result.filepath, result.code);
  console.log('✅ Code written after approval');
} else {
  // Not approved - manual review needed
  console.log('⚠️ Issues found:', result.issues);
  console.log('Recommendation:', result.recommendation);
}
```

### Integration with Test Orchestrator

```javascript
const TestOrchestrator = require('./test-orchestrator');

const orchestrator = new TestOrchestrator({
  preCommitReview: true, // Enable pre-commit review
});

// During implementation phase
const draft = {
  code: generatedCode,
  filepath: 'src/auth/middleware.ts',
  purpose: 'Verify AAL2 for protected routes',
};

const reviewResult = await orchestrator.reviewDraftBeforeCommit(draft, {
  requirements: featureData.analysis.profile.requirements,
});

if (reviewResult.success) {
  // Write to disk and continue
  await writeCodeToFile(reviewResult.code, draft.filepath);
} else {
  // Present issues to developer
  presentIssuesForManualFix(reviewResult);
}
```

## Configuration Options

### `maxIterations` (default: 3)
Maximum number of refinement iterations before giving up.

```javascript
maxIterations: 5  // Try harder for critical features
maxIterations: 1  // Quick review only, no refinement
```

### `requireConsensus` (default: false)
Whether ALL reviewers must approve, or just a majority.

```javascript
requireConsensus: true   // All must approve (stricter)
requireConsensus: false  // Majority wins (faster)
```

### `reviewers` (default: ['codex', 'gemini'])
Which LLMs to use as reviewers.

```javascript
reviewers: ['codex']                    // Single reviewer
reviewers: ['codex', 'gemini', 'gpt']  // Three reviewers
```

### `autoRefine` (default: true)
Whether to automatically refine based on feedback or just report issues.

```javascript
autoRefine: true   // Automatically refine
autoRefine: false  // Just report issues, no refinement
```

## Review Output Format

```javascript
{
  success: true,              // Whether code was approved
  code: "...",                // Final refined code
  iterations: 2,              // How many refinement rounds
  issues: [],                 // Unresolved issues (if any)
  reviews: [                  // Individual review results
    {
      reviewer: 'codex',
      approved: true,
      confidence: 85,
      issues: [],
      suggestions: ['Add JSDoc comments'],
      reasoning: 'Code is solid...'
    }
  ],
  recommendation: {
    action: 'WRITE_TO_DISK',  // or 'MANUAL_REVIEW', 'REFINE_MORE'
    message: '...',
    confidence: 'HIGH'
  }
}
```

## Examples

### Example 1: Security Issue Caught

**Draft (Iteration 1):**
```javascript
function login(email, password) {
  const user = db.query(`SELECT * FROM users WHERE email = '${email}'`);
  if (user.password === password) {
    return createSession(user);
  }
}
```

**Codex Review:**
```
APPROVED: NO
CONFIDENCE: 95%

ISSUES:
- SQL injection vulnerability in email parameter
- Password comparison is not using hash comparison
- No rate limiting on failed attempts

SUGGESTIONS:
- Use parameterized queries
- Use bcrypt.compare() for password verification
- Add rate limiting middleware

REASONING:
Critical security issues must be fixed before deployment.
```

**Refined (Iteration 2):**
```javascript
async function login(email, password) {
  const user = await db.users.findOne({ email });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return createSession(user);
}
```

**Codex Review:**
```
APPROVED: YES
CONFIDENCE: 90%

ISSUES:
- None

SUGGESTIONS:
- Consider adding rate limiting at middleware level
- Add logging for failed attempts

REASONING:
Security issues resolved. Code is safe for production.
```

✅ **Written to disk after approval**

### Example 2: Performance Issue Caught

**Draft:**
```javascript
async function getUsersWithPosts() {
  const users = await db.users.findAll();
  for (const user of users) {
    user.posts = await db.posts.findByUserId(user.id);
  }
  return users;
}
```

**Gemini Review:**
```
APPROVED: NO
CONFIDENCE: 88%

ISSUES:
- N+1 query problem - will make separate DB call for each user
- No pagination - will load all users into memory

SUGGESTIONS:
- Use JOIN or include to load posts in single query
- Add pagination parameters
- Consider using a data loader pattern

REASONING:
Will cause performance issues at scale.
```

**Refined:**
```javascript
async function getUsersWithPosts({ page = 1, limit = 50 }) {
  return db.users.findAll({
    limit,
    offset: (page - 1) * limit,
    include: [{ model: db.posts }]
  });
}
```

✅ **Approved and written**

## When to Use Pre-Commit Review

### ✅ Use for:
- **Complex features** (complexity level: complex, critical)
- **Security-sensitive code** (auth, payments, data access)
- **Performance-critical paths** (high-traffic endpoints)
- **Public APIs** (contract stability important)
- **Shared utilities** (used across codebase)

### ❌ Skip for:
- **Trivial changes** (CSS tweaks, text updates)
- **Prototypes** (speed over quality)
- **Experimental code** (exploring possibilities)
- **Already tested code** (migrating existing code)

## Best Practices

### 1. Configure for Complexity
```javascript
// For critical features
const reviewer = new PreCommitReviewer({
  maxIterations: 5,
  requireConsensus: true,
  reviewers: ['codex', 'gemini', 'gpt'],
});

// For moderate features
const reviewer = new PreCommitReviewer({
  maxIterations: 3,
  requireConsensus: false,
  reviewers: ['codex', 'gemini'],
});

// For simple features
const reviewer = new PreCommitReviewer({
  maxIterations: 1,
  requireConsensus: false,
  reviewers: ['codex'],
});
```

### 2. Provide Good Context
```javascript
const result = await reviewer.reviewDraft({
  code: draft,
  filepath: 'src/auth/verify-2fa.ts',
  purpose: 'Verify TOTP and upgrade session AAL to aal2',
}, {
  requirements: `
    - Must verify TOTP factor using Supabase mfa.verify()
    - Must upgrade session AAL from aal1 to aal2
    - Must handle invalid codes gracefully
    - Must prevent brute force attacks
    - Must work with refreshSession()
  `,
  constraints: 'Using Supabase Auth, Next.js middleware',
  tests: 'Must pass integration/mfa-aal-upgrade.test.ts',
});
```

### 3. Act on Recommendations
```javascript
if (result.recommendation.action === 'WRITE_TO_DISK') {
  // Approved - write immediately
  await writeFile(result.filepath, result.code);

} else if (result.recommendation.action === 'MANUAL_REVIEW') {
  // Present to developer
  console.log('⚠️ Manual review required');
  console.log('Issues:', result.issues);
  // Developer decides whether to commit or refine further

} else if (result.recommendation.action === 'REFINE_MORE') {
  // Increase max iterations or adjust reviewers
  const stricterReview = await reviewWithMoreIterations(draft);
}
```

## Statistics & History

Track review effectiveness:

```javascript
const stats = reviewer.getStats();

console.log(`Total reviews: ${stats.totalReviews}`);
console.log(`Approval rate: ${stats.approvalRate}%`);
console.log(`Avg iterations: ${stats.averageIterations}`);

// Get history for specific file
const fileHistory = reviewer.getHistory('src/payments/process.ts');
console.log(`This file has been reviewed ${fileHistory.length} times`);
```

## Integration with CI/CD

In your GitHub workflow:

```yaml
- name: Pre-Commit Review
  run: |
    node testing-framework/cli.js pre-review \
      --draft-dir .drafts \
      --require-approval \
      --reviewers codex,gemini
```

This ensures no code gets committed without multi-LLM approval.

## Comparison: Pre-Commit vs Post-Commit Review

| Aspect | Pre-Commit (New) | Post-Commit (Traditional) |
|--------|------------------|---------------------------|
| **Timing** | Before writing to disk | After writing to disk |
| **Cost** | Lower (catches early) | Higher (rework needed) |
| **Automation** | Fully automated refinement | Manual fixes required |
| **Quality** | Higher first-time quality | Lower first draft quality |
| **Speed** | Slightly slower upfront | Faster initial write, slower overall |
| **Best For** | Complex/critical code | Simple changes, prototypes |

## Architecture Decision

**Why this is better for complex features:**

1. **Prevents Technical Debt**: Issues caught before they're committed
2. **Reduces Context Switching**: No need to come back and fix later
3. **Leverages Multiple Perspectives**: Different LLMs catch different issues
4. **Maintains TDD Flow**: Tests written first, code refined until passing
5. **Scales Better**: Automated refinement vs manual fix cycles

**The Rule:**
- **Trivial/Simple**: Skip pre-commit review (overkill)
- **Moderate**: Single reviewer, 1-2 iterations
- **Complex**: Multiple reviewers, 3 iterations
- **Critical**: All reviewers must approve, 5 iterations

## Future Enhancements

- [ ] Support for architecture-level reviews (before any code gen)
- [ ] Learning from past reviews to improve prompts
- [ ] Integration with formal verification tools
- [ ] Comparative analysis (generate 3 solutions, pick best)
- [ ] Cost tracking (token usage per review)

---

**Bottom Line**: For complex features, catching issues BEFORE writing to disk saves time, improves quality, and reduces technical debt. The slight upfront cost pays dividends in reduced rework and higher confidence.
