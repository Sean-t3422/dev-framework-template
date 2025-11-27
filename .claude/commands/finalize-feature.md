# Finalize Feature (Quality Gates)

**Command**: `/finalize-feature`

**Description**: Runs all quality gates before deployment. Checks tests, coverage, cross-LLM review completion, and other requirements based on complexity.

---

## What it does

1. **Runs test suite** - All tests must pass
2. **Checks coverage** - Meets complexity-based target
3. **Verifies cross-LLM review** - For complex/critical features
4. **TypeScript validation** - No type errors
5. **Linting** - Code style checks
6. **Security tests** - For critical features
7. **Generates report** - Complete quality assessment
8. **Prompts for documentation updates** - Asks if new patterns/issues should be documented via /update-project-context

---

## Usage

```
/finalize-feature <feature-id>
```

**Example:**
```
/finalize-feature payment-processing
```

---

## Quality Gates by Complexity

### Simple Features
- ✅ Integration tests pass
- ✅ 30% coverage minimum

### Moderate Features
- ✅ Integration tests pass
- ✅ Unit tests pass
- ✅ 50% coverage minimum
- ✅ TypeScript compiles

### Complex Features
- ✅ All tests pass (integration + unit + E2E)
- ✅ 70% coverage minimum
- ✅ TypeScript compiles
- ✅ Linting passes
- ✅ **Cross-LLM review completed**

### Critical Features
- ✅ All tests pass
- ✅ 85% coverage minimum
- ✅ TypeScript compiles
- ✅ Linting passes
- ✅ Security tests pass
- ✅ **Cross-LLM review completed**
- ⚠️ Performance benchmarks (warning only)

---

## Workflow Example

**User says:** `/finalize-feature login-system`

**Claude responds:**

```
🏁 Finalizing login-system...

Running quality gates for complexity: complex

─────────────────────────────────────────

✅ All Tests Pass
   Integration: 12/12 passed
   Unit: 8/8 passed
   E2E: 3/3 passed
   Total: 23/23 ✓

✅ Coverage Target Met
   Required: 70%
   Actual: 74.2%
   Lines: 742/1000
   Branches: 68.5%
   Functions: 71.3%

✅ TypeScript Compiles
   No type errors found

✅ Linting Passes
   No linting errors

✅ Cross-LLM Review Completed
   Reviewed: src/auth/login.ts, src/auth/session.ts
   Issues found: 2 (all addressed)
   Status: ✓ Complete

─────────────────────────────────────────

🎉 ALL QUALITY GATES PASSED!

Summary:
  Feature: login-system
  Complexity: complex
  Tests: 23/23 passing
  Coverage: 74.2% (target: 70%)
  Review: Complete

✅ Ready for deployment!

Next steps:
  1. Create PR: git push && gh pr create
  2. Request team review
  3. Deploy when approved
```

---

## Failure Example

**User says:** `/finalize-feature payment-flow`

**Claude responds:**

```
🏁 Finalizing payment-flow...

Running quality gates for complexity: critical

─────────────────────────────────────────

❌ Tests Failing
   Integration: 15/16 passed (1 FAILED)
   Unit: 10/10 passed
   Security: 4/5 passed (1 FAILED)
   E2E: 3/3 passed
   Total: 32/34 ✓, 2 ✗

   Failed tests:
   - payment-processing.integration.test.ts:45
     "should handle Stripe webhook timeouts"
   - payment-rls.security.test.ts:23
     "should prevent cross-tenant payment access"

⚠️  Coverage Below Target
   Required: 85%
   Actual: 78.3%
   Gap: -6.7%
   Missing coverage in: src/payments/webhook.ts

✅ TypeScript Compiles

✅ Linting Passes

❌ Cross-LLM Review Not Completed
   Required for critical features
   Status: Pending

─────────────────────────────────────────

❌ QUALITY GATES FAILED

Cannot deploy until:
  1. Fix 2 failing tests
  2. Increase coverage to 85% (currently 78.3%)
  3. Complete mandatory cross-LLM review

Next steps:
  1. Fix failing webhook timeout test
  2. Fix RLS security test
  3. Add tests for webhook.ts to reach 85%
  4. Run: /review-feature payment-flow src/payments/
  5. Re-run: /finalize-feature payment-flow
```

---

## Behind the scenes

This command runs:
```bash
# From dev-framework root:
node testing-framework/cli.js finalize <feature-id>

# From project directory (e.g., projects/homeschool-coop/):
npm run framework:finalize <feature-id>
```

Which executes:
1. `npm test` - All test suites
2. `npm test -- --coverage` - Coverage check
3. `npm run typecheck` OR `npx tsc --noEmit` - TypeScript validation
4. `npm run lint` - Linting check
5. Checks for review completion marker

---

## Report Generation

Creates report at:
```
.dev-framework/
└── gates/
    └── feature-id-gates.json
```

Example report:
```json
{
  "featureId": "login-system",
  "timestamp": "2025-10-11T10:30:00Z",
  "complexity": "complex",
  "results": {
    "tests": { "passed": true, "details": "23/23" },
    "coverage": { "passed": true, "target": 70, "actual": 74.2 },
    "typescript": { "passed": true },
    "linting": { "passed": true },
    "crossLLMReview": { "passed": true, "completedAt": "2025-10-11T09:15:00Z" }
  },
  "overallStatus": "PASSED",
  "deploymentApproved": true
}
```

---

## Integration with CI/CD

Can be used in GitHub Actions:

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on: [pull_request]

jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Run quality gates
        working-directory: ./projects/homeschool-coop
        run: npm run framework:finalize ${{ github.event.pull_request.title }}
```

---

## When to use

### ✅ Always run before:
- Creating pull request
- Deploying to production
- Merging to main branch
- Marking feature as "done"

### 🔄 Re-run after:
- Fixing failing tests
- Addressing coverage gaps
- Completing cross-LLM review
- Any significant code changes

---

## Skipping gates (not recommended)

If absolutely necessary (emergencies only):

```bash
# Not recommended - bypasses safety checks
npm run deploy:force
```

Better approach:
```bash
# Identify specific failing gate
/finalize-feature feature-id

# Fix the specific issue
# Re-run finalization
```

---

## Success patterns

**Pattern 1: First-time pass**
```
/build-feature → Implement (TDD) → /review-feature → /finalize-feature ✅
```

**Pattern 2: Iteration needed**
```
/build-feature → Implement → /finalize-feature ❌
→ Fix issues → /finalize-feature ❌
→ Complete review → /finalize-feature ✅
```

**Pattern 3: Critical feature**
```
/build-feature (critical) → Implement → /review-feature → Fix issues
→ /review-feature (again) → /finalize-feature → Team review → Deploy
```

---

## Notes

- **All gates must pass** for complex/critical features
- Simple features have fewer gates
- Gates adapt to complexity level
- Cross-LLM review cannot be skipped for complex/critical
- Coverage targets are minimums, not maximums
- Re-run after any significant changes

---

## Troubleshooting

**"Tests pass locally but fail in finalize"**
- Ensure all test files are committed
- Check test dependencies are installed
- Run `npm test` manually to debug

**"Coverage check fails"**
- Run `npm test -- --coverage` to see gaps
- Add tests for uncovered lines
- Focus on critical paths first

**"Cross-LLM review not found"**
- Run `/review-feature <feature-id> <files>`
- Ensure review completed successfully
- Check `.dev-framework/reviews/` for results

---

## Success indicators

You'll know it's working when:
- ✅ Deployment blocked when tests fail
- ✅ Coverage gaps are identified
- ✅ Cross-LLM review is enforced
- ✅ Only quality code reaches production
- ✅ Bugs are caught before deployment
