# Dev Framework Testing System

**Complete testing workflow combining automated test generation with cross-LLM review.**

## Overview

The Dev Framework Testing System automates the testing workflow by:
1. **Analyzing complexity** of features from briefs/blueprints
2. **Generating failing tests** before implementation (TDD)
3. **Integrating cross-LLM review** for critical code
4. **Enforcing quality gates** before deployment

This is **your own IP**, combining the best practices from multiple approaches.

---

## Quick Start

### 1. Analyze Feature Complexity

```bash
node testing-framework/cli.js analyze briefs/login-feature.json
```

**Output:**
```
Complexity Analysis:
  Level: moderate (Moderate Feature)
  Confidence: 85%
  Test Strategy: Integration + unit tests for business logic

Test Types Required:
  - integration
  - unit

Coverage Targets:
  Lines: 50%
  Branches: 40%
```

### 2. Generate Tests (TDD)

```bash
node testing-framework/cli.js generate briefs/login-feature.json
```

**Output:**
```
Generated 2 test files:
  ✓ integration: login-feature.integration.test.ts
  ✓ unit: login-feature.unit.test.ts

Next Steps:
  1. Review all generated tests
  2. Implement features incrementally
  3. Make integration tests pass first
  4. Add unit tests for logic
```

### 3. Initialize Complete Workflow

```bash
node testing-framework/cli.js init briefs/payment-flow.json
```

This runs:
- Complexity analysis
- Test generation
- Initial test run (expecting failures)
- Sets up cross-LLM review if required

---

## Complexity Levels

| Level | Name | Test Types | Coverage | Cross-LLM Review |
|-------|------|------------|----------|------------------|
| **trivial** | Trivial Change | None | N/A | No |
| **simple** | Simple Feature | Integration | 30% | No |
| **moderate** | Moderate Feature | Integration + Unit | 50% | No |
| **complex** | Complex Feature | Integration + Unit + E2E | 70% | **Yes** |
| **critical** | Critical Feature | All + Security | 85% | **Yes** |

---

## Integration with Cross-LLM Review

For **complex** and **critical** features, cross-LLM review is **mandatory**.

### Run Cross-LLM Review

```bash
# After implementing the feature
node testing-framework/cli.js review feature-123 \
  src/auth/login.ts \
  src/auth/password-validation.ts
```

This uses your existing `scripts/cross-llm-test.sh` to send code to Codex for review.

### Run A/B Test

```bash
# Compare multiple LLMs for critical decisions
node testing-framework/cli.js abtest \
  "Create RLS policy for multi-tenant" \
  claude,gpt,gemini
```

This uses your existing `scripts/ab-test-llms.sh` for comparison.

---

## Quality Gates

Quality gates are automatically enforced based on complexity:

### Simple Features
- ✅ Integration tests pass
- ✅ Minimum 30% coverage

### Moderate Features
- ✅ Integration tests pass
- ✅ Unit tests pass
- ✅ Minimum 50% coverage
- ✅ TypeScript compiles

### Complex Features
- ✅ All tests pass
- ✅ 70% coverage
- ✅ TypeScript compiles
- ✅ Linting passes
- ✅ **Cross-LLM review completed**

### Critical Features
- ✅ All tests pass
- ✅ 85% coverage
- ✅ TypeScript compiles
- ✅ Linting passes
- ✅ Security tests pass
- ✅ **Cross-LLM review completed**
- ⚠️ Performance benchmarks (warning only)

---

## Workflow Example

### Complete TDD Workflow

```bash
# 1. Create feature brief
cat > briefs/user-signup.json << EOF
{
  "id": "signup-feature",
  "title": "User Signup with Email Verification",
  "description": "Allow users to sign up with email and password, send verification email",
  "requirements": [
    "Users can signup with email and password",
    "Password must be at least 8 characters",
    "Verification email sent after signup",
    "Users cannot login until verified"
  ]
}
EOF

# 2. Initialize testing workflow
node testing-framework/cli.js init briefs/user-signup.json

# Output shows:
# - Complexity: moderate
# - Generated 2 test files
# - 8 tests created (all failing - this is correct for TDD)

# 3. Implement the feature
# (Write code to make tests pass)

# 4. Run tests
npm test

# 5. If complexity is complex/critical, run cross-LLM review
node testing-framework/cli.js review signup-feature \
  src/auth/signup.ts \
  src/auth/verification.ts

# 6. Finalize and check quality gates
node testing-framework/cli.js finalize signup-feature

# Output shows:
# - All tests passed
# - Coverage target met
# - Quality gates passed
# - Ready for deployment
```

---

## Feature JSON Format

```json
{
  "id": "unique-feature-id",
  "title": "Feature Name",
  "description": "Detailed description of what this feature does",
  "requirements": [
    "First requirement or acceptance criterion",
    "Second requirement",
    "Third requirement"
  ],
  "technicalDetails": {
    "stack": "Next.js + Supabase",
    "components": ["ComponentName"],
    "apis": ["/api/endpoint"]
  }
}
```

---

## Programmatic Usage

```javascript
const { DevFrameworkTestingSystem } = require('./testing-framework');

const system = new DevFrameworkTestingSystem({
  autoGenerate: true,
  runTests: true,
  enforceCrossLLMReview: true,
  enforceGates: true,
});

// Initialize feature
const feature = {
  id: 'payment-flow',
  title: 'Payment Processing Flow',
  description: 'Implement Stripe payment processing',
  requirements: [
    'Users can enter payment info',
    'Payment is processed securely',
    'Receipt is generated'
  ]
};

const result = await system.initializeFeature(feature);

console.log(`Complexity: ${result.analysis.level}`);
console.log(`Tests generated: ${result.testsGenerated}`);
console.log(`Cross-LLM review required: ${result.requiresCrossLLMReview}`);

// After implementation, run cross-LLM review
await system.runCrossLLMReview('payment-flow', [
  'src/payments/process.ts',
  'src/payments/stripe-integration.ts'
]);

// Finalize
const finalResult = await system.finalizeFeature('payment-flow');
console.log(finalResult.report);
```

---

## Test Templates

The system includes templates for:

### Component Tests (React + Next.js)
- Rendering tests
- User interaction tests
- Requirement-based tests

### API Tests (Next.js API Routes + Supabase)
- Request/response validation
- RLS policy enforcement
- Error handling

### Hook Tests (React Hooks)
- Initialization tests
- State management tests
- Side effect tests

### E2E Tests (Playwright)
- User workflow tests
- Authentication flow
- Multi-step processes

### Security Tests
- RLS isolation tests
- Authentication requirements
- Role-based permission tests

---

## Integration with Existing Workflow

### Current Workflow
```
Brief → Blueprint → Implementation → Manual Testing → Deploy
```

### New Workflow
```
Brief → Complexity Analysis → Test Generation (TDD) →
Implementation → Cross-LLM Review (if complex/critical) →
Quality Gates → Deploy
```

### Benefits
- ✅ Tests are written BEFORE implementation (TDD)
- ✅ Complexity-appropriate testing (not over/under-testing)
- ✅ Automated cross-LLM review for critical code
- ✅ Quality gates prevent deployment of untested code
- ✅ Faster feedback loop
- ✅ Higher code quality

---

## Configuration

Create `.dev-framework/testing-config.json`:

```json
{
  "autoGenerate": true,
  "runTests": true,
  "enforceCrossLLMReview": true,
  "enforceGates": true,
  "complexityLevels": {
    "trivial": { "coverage": null },
    "simple": { "coverage": 30 },
    "moderate": { "coverage": 50 },
    "complex": { "coverage": 70 },
    "critical": { "coverage": 85 }
  },
  "crossLLMReview": {
    "requiredFor": ["complex", "critical"],
    "models": ["claude", "gpt", "gemini", "codex"]
  }
}
```

---

## Troubleshooting

### Tests not generating
- Check feature JSON format
- Ensure `id`, `title`, and `description` are present
- Run `node cli.js analyze` first to see complexity

### Cross-LLM review failing
- Ensure `scripts/cross-llm-test.sh` is executable
- Check that `gh copilot` is installed and authenticated
- Verify file paths are correct

### Quality gates failing
- Run tests manually: `npm test`
- Check coverage: `npm test -- --coverage`
- Run TypeScript: `npx tsc --noEmit`
- Run linter: `npm run lint`

---

## Differences from SAAW/Logelo

This is **your own system** with key differences:

| Feature | SAAW/Logelo | Dev Framework |
|---------|-------------|---------------|
| Naming | SAAW Board, Story | Feature, Brief/Blueprint |
| Complexity Levels | xs/s/m/l/xl | trivial/simple/moderate/complex/critical |
| Cross-LLM Review | Not included | **Fully integrated** |
| A/B Testing | Not included | **Built-in** |
| Templates | Generic | **Next.js + Supabase specific** |
| Quality Gates | Basic | **Enhanced with cross-LLM** |

---

## License

MIT - This is your own IP.
