# Build Feature - Unified Orchestration with Codex

**Command**: `/build-feature`

**Description**: Initiates the unified orchestration workflow with Codex as the master orchestrator.

---

## What it does

### Phase 1: DISCOVER (Extended Planning)
1. Generates 15-20 discovery questions
2. Waits for human answers
3. Codex defines requirements
4. Creates and reviews brief

### Phase 2: DESIGN (Architecture & Testing)
1. Creates focused specs
2. Reviews with Codex
3. Generates test strategy
4. Analyzes complexity

### Phase 3: BUILD (Implementation)
1. For simple: Traditional TDD
2. For complex: Hierarchical orchestration with parallel agents
3. Continuous Codex checkpoints

### Phase 4: FINALIZE (Quality Gates)
1. Run all test suites
2. Validate performance
3. Security audit
4. Documentation complete

---

## Usage

```
/build-feature
```

Or with existing brief:

```
/build-feature briefs/user-login.json
```

---

## Complexity Levels

| Level | Tests | Coverage | Checkpoint Reviews |
|-------|-------|----------|--------------------|
| **trivial** | None | N/A | No |
| **simple** | Integration | 30% | No |
| **moderate** | Integration + Unit | 50% | Yes (2) |
| **complex** | Integration + Unit + E2E | 70% | Yes (6) |
| **critical** | All + Security | 85% | Yes (6) |

---

## When to use

✅ **Use when:**
- Starting a new feature
- Want TDD workflow
- Building anything beyond trivial changes

❌ **Don't use when:**
- Making trivial cosmetic changes
- Updating copy/text
- Simple config changes
