# Enhanced Orchestration System

## Overview

The Enhanced Orchestration System addresses critical gaps in the feature development workflow by adding:

1. **Spec Review Before Tests** - Validates specs with cross-LLM review before generating tests
2. **Orchestrator Validation** - Reviews all hook advice for conflicts and pattern violations
3. **Feedback Loops** - Allows hooks to revise their advice based on orchestrator feedback
4. **Blueprint Matching** - Reuses proven patterns from successful features
5. **Enhanced Context** - Passes project patterns, completed features, and known issues to hooks

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Enhanced Orchestration                   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Spec Review (if spec exists)                            │
│     ├─ Codex reviews technical aspects                      │
│     └─ Gemini reviews UX/user flows                         │
│                           ↓                                  │
│  2. Blueprint Matching                                       │
│     ├─ Find similar features                                │
│     └─ Reuse patterns and components                        │
│                           ↓                                  │
│  3. Hook System Execution (Sequential)                       │
│     ├─ Brief Analysis (Opus)                                │
│     ├─ UI Requirements (Gemini Flash)                       │
│     ├─ Test Strategy (GPT-5)                                │
│     ├─ Security Review (Opus)                               │
│     ├─ Performance Check (GPT-5)                            │
│     └─ Regression Risk (Codex)                              │
│                           ↓                                  │
│  4. Orchestrator Validation                                  │
│     ├─ Detect conflicts between advisors                    │
│     ├─ Check pattern compliance                             │
│     ├─ Validate requirements coverage                       │
│     └─ Request revisions if needed (up to 3 iterations)     │
│                           ↓                                  │
│  5. Implementation Plan Generation                           │
│     ├─ Unified sequence of steps                            │
│     ├─ Test strategy and coverage                           │
│     ├─ Reusable components from blueprint                   │
│     └─ Quality gates and next steps                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. OrchestratorValidator (`orchestrator-validator.js`)

The brain that validates all hook advice:

```javascript
const validator = new OrchestratorValidator({
  maxRevisionIterations: 3,
  enforcePatterns: true
});

// Validates advice and returns approval or revision requests
const validation = await validator.validateHookAdvice(hookAdvice, projectContext);
```

**Responsibilities:**
- Detect conflicts between different advisors
- Check compliance with project patterns
- Validate all requirements are addressed
- Generate specific revision requests
- Create implementation plan when approved

### 2. BlueprintMatcher (`blueprint-matcher.js`)

Matches features to existing blueprints:

```javascript
const matcher = new BlueprintMatcher({
  blueprintDir: 'blueprints/',
  similarityThreshold: 0.7
});

// Find best matching blueprint
const blueprint = await matcher.findMatchingBlueprint(brief, context);
```

**Features:**
- Scores blueprints based on type, keywords, and requirements
- Extracts reusable patterns and components
- Enforces blueprint patterns in implementation
- Generates new blueprints from successful features

### 3. Enhanced Hook System (`hook-system.js`)

Upgraded with orchestrator integration:

```javascript
const hooks = new HookSystem({
  enforceOrchestration: true,
  maxFeedbackIterations: 3
});

// Now includes validation and revision loops
const result = await hooks.executeSequentialHooks(brief, projectContext);
```

**Improvements:**
- Loads enhanced project context (patterns, completed features, issues)
- Integrates orchestrator validation after hooks complete
- Supports revision requests with specific feedback
- Human-in-the-loop for unresolved conflicts

### 4. Spec Reviewer (`spec-reviewer.js`)

Reviews specs before test generation:

```javascript
const reviewer = new SpecReviewer({
  reviewers: ['codex', 'gemini'],
  autoRefine: true
});

// Reviews and refines spec
const review = await reviewer.reviewSpec(specDraft, context);
```

**Process:**
- Codex reviews technical feasibility
- Gemini reviews UX and user flows
- Auto-refines based on feedback
- Blocks bad specs before wasting time on tests

### 5. EnhancedOrchestration (`enhanced-orchestration.js`)

Ties everything together:

```javascript
const orchestration = new EnhancedOrchestration({
  enableSpecReview: true,
  enableOrchestration: true,
  enableBlueprints: true
});

// Execute complete workflow
const result = await orchestration.executeFeatureWorkflow(feature);
```

## Workflow Example

### Input: Payment Processing Feature

```javascript
const feature = {
  title: 'Payment Processing',
  type: 'payment',
  complexity: 'critical',
  brief: {
    requirements: [
      'Stripe integration',
      'Webhook handling',
      'Refund support',
      'RLS policies'
    ]
  },
  specPath: 'specs/payment-processing.md'
};
```

### Phase 1: Spec Review

```
🔍 Reviewing spec with Codex and Gemini...

Codex Review:
  ✅ Stripe integration approach solid
  ⚠️  Add webhook signature verification
  ⚠️  Consider idempotency keys

Gemini Review:
  ✅ User flows well documented
  ⚠️  Missing error recovery scenarios

Spec refined and approved after 2 iterations
```

### Phase 2: Blueprint Matching

```
📘 Found matching blueprint: payment-processing (85% match)
  Patterns: API routes, webhooks, RLS policies
  Components: PaymentForm, PaymentStatus, RefundModal
```

### Phase 3: Hook Execution

```
📌 Brief Analysis (Opus) - Complexity: critical
📌 UI Requirements (Gemini) - Payment form, status display
📌 Test Strategy (GPT-5) - 85% coverage, security tests
📌 Security Review (Opus) - PCI compliance, encryption
📌 Performance (GPT-5) - Webhook timeouts, retries
📌 Regression (Codex) - Check existing checkout flow
```

### Phase 4: Orchestrator Validation

```
🎯 Orchestrator Validation

Conflicts Detected:
  - UI wants inline validation, Security wants server-side only
  Resolution: Client-side format check, server-side validation

Pattern Violations:
  - Missing dynamic/runtime exports
  Fix: Add required exports to route handlers

Requesting revisions...
  → UI Requirements: Add server validation mention
  → Brief Analysis: Include export requirements

Validation approved after 1 revision
```

### Phase 5: Implementation Plan

```
📋 Implementation Plan Generated

Sequence:
  1. Database setup (payment tables, RLS)
  2. API routes (process, webhook, refund)
  3. UI components (form, status, history)
  4. Integration (connect UI to API)
  5. Testing (unit, integration, security)

Reusable from Blueprint:
  - PaymentForm component
  - Webhook handler pattern
  - RLS policy template

Quality Gates:
  - 85% test coverage required
  - Security tests mandatory
  - Cross-LLM review required
```

## Configuration

### Project Context Files

The system looks for these files to understand your project:

```
.claude/
├── PROJECT_CONTEXT.md      # Patterns and conventions
├── TROUBLESHOOTING.md      # Known issues
├── ARCHITECTURE_DECISIONS.md # ADRs
├── completed/              # Completed features
└── agents/                 # Agent definitions

blueprints/                 # Reusable patterns
├── auth-flow.md
├── payment-processing.md
└── generated/             # Auto-generated blueprints
```

### Environment Variables

```bash
# API Keys for LLM routing
ANTHROPIC_API_KEY=xxx      # Claude Opus/Sonnet
OPENAI_API_KEY=xxx         # GPT-5/Codex
GEMINI_API_KEY=xxx         # Gemini Flash
```

## Running the System

### Basic Usage

```javascript
const EnhancedOrchestration = require('./enhanced-orchestration');

const orchestration = new EnhancedOrchestration();
const result = await orchestration.executeFeatureWorkflow({
  title: 'User Profile',
  brief: { ... },
  specPath: 'specs/user-profile.md'
});
```

### Test the System

```bash
# Run the test demonstration
node test-enhanced-orchestration.js
```

## Benefits

### 1. **Prevents Bad Specs**
- Catches issues BEFORE test generation
- Saves hours of wasted implementation time
- Gets technical and UX review early

### 2. **Resolves Conflicts**
- No more contradictory advice
- Clear resolution when advisors disagree
- Consistent implementation approach

### 3. **Enforces Patterns**
- Required exports never forgotten
- Dark mode always included
- RLS policies never missed
- Package versions stay compatible

### 4. **Reuses Knowledge**
- Blueprints capture successful patterns
- Components get reused across features
- Institutional knowledge preserved

### 5. **Feedback Loops**
- Hooks learn from orchestrator feedback
- Up to 3 revision iterations
- Quality improves over time

## Metrics and Analytics

The system tracks:

```javascript
const stats = orchestration.getStatistics();

// {
//   totalFeatures: 42,
//   orchestratorApprovalRate: 78.5,
//   averageIterations: 1.3,
//   blueprintsMatched: 31,
//   topIssues: [
//     { type: 'ui-performance', count: 8 },
//     { type: 'missing-exports', count: 6 }
//   ]
// }
```

## Troubleshooting

### "Orchestrator keeps rejecting"
- Check `.claude/PROJECT_CONTEXT.md` for patterns
- Ensure hooks have full context
- Review common conflicts in metrics

### "No blueprints matching"
- Lower similarity threshold (default 0.7)
- Create blueprints from successful features
- Check blueprint keywords match brief

### "Spec review taking too long"
- Reduce max iterations (default 3)
- Simplify spec for clarity
- Check LLM API limits

### "Hooks not getting context"
- Verify `.claude/` directory exists
- Check file permissions
- Ensure PROJECT_CONTEXT.md is readable

## Future Enhancements

1. **Learning System**
   - Track successful patterns
   - Auto-generate blueprints
   - Improve routing based on outcomes

2. **Parallel Execution**
   - Run independent hooks concurrently
   - Batch LLM calls for efficiency
   - Reduce total execution time

3. **Confidence Scoring**
   - Rate advice quality
   - Weight trusted advisors higher
   - Skip low-confidence suggestions

4. **Auto-Implementation**
   - Generate code from approved plan
   - Apply blueprints automatically
   - Create initial test suite

## Summary

The Enhanced Orchestration System transforms feature development from chaotic to systematic:

- **Before**: Sloppy code, conflicts, missed patterns, wasted time
- **After**: Validated specs, consistent patterns, reused knowledge, quality code

The system ensures that every feature:
1. Starts with a reviewed spec
2. Matches existing patterns
3. Gets comprehensive advice
4. Resolves all conflicts
5. Follows project conventions
6. Reuses proven components
7. Meets quality standards

This is not just about catching errors - it's about building institutional knowledge, enforcing best practices, and ensuring every feature is implemented with the same high quality standards.