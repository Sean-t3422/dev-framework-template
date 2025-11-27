# Build Feature - Unified Orchestration with Task Tool

**Command**: `/build-feature`

**Description**: Initiates the unified orchestration workflow. Uses Task tool to spawn sub-agents automatically - NO manual copy-paste coordination required. Codex validates at every phase.

---

## Architecture

```
Claude (Orchestrator)
    │
    ├─→ Task(brief-writer) ──→ Creates brief
    │       ↓
    ├─→ Task(codex-reviewer) ─→ Validates brief
    │       ↓
    ├─→ Task(spec-writer) ───→ Creates spec
    │       ↓
    ├─→ Task(codex-reviewer) ─→ Validates spec
    │       ↓
    └─→ FOR EACH blueprint:
            ├─→ Task(codex-reviewer) ─→ PRE-validates blueprint
            ├─→ Task(general-purpose) → Executes blueprint
            └─→ Task(codex-reviewer) ─→ Verifies implementation
```

**Key points:**
- **ONE orchestrator**: Claude/Opus controls the flow
- **Task tool**: Spawns agents with isolated ~200k token context
- **Codex**: Quality gate at every phase (including PRE-implementation)
- **Hierarchical todos**: Brief → Spec → Blueprint levels

---

## What it does

### Phase 1: DISCOVER (Brief Creation)

1. **Generate 15-20 discovery questions** - Comprehensive understanding
2. **WAIT for user answers** - No proceeding without information
3. **Create brief via Task(brief-writer)** - Agent handles formatting
4. **Validate via Task(codex-reviewer)** - Security, requirements, feasibility
5. **Loop until approved** - Max 3 iterations

### Phase 2: DESIGN (Spec Creation)

6. **Create spec via Task(spec-writer)** - Database, API, UI design
7. **Validate via Task(codex-reviewer)** - Architecture, security, performance
8. **Analyze complexity** - Determine orchestration approach
9. **Generate execution plan** - Blueprints with dependency layers

### Phase 3: BUILD (Automated Agent Dispatch)

10. **FOR EACH blueprint in dependency order:**
    - **PRE-validate via Task(codex-reviewer)** - Check BEFORE implementing
    - **Execute via Task(general-purpose)** - Agent implements
    - **Verify via Task(codex-reviewer)** - Confirm quality
11. **Batch execution** - Max 5 parallel agents per batch
12. **Layer-by-layer** - Complete dependencies before dependents
13. **Save checkpoints** - Recovery points after each layer

### Phase 4: FINALIZE (Quality Gates)

14. **Run all test suites** - Unit, integration, E2E
15. **Performance validation** - <100ms DB, <200ms API
16. **Security audit** - RLS, auth, data isolation
17. **Documentation update** - Mark feature complete

---

## Usage

### Option 1: Fresh start

```
/build-feature
```

Then answer discovery questions.

### Option 2: With existing brief

```
/build-feature briefs/active/user-login.md
```

### Option 3: With feature description

```
/build-feature "Add payment processing with Square"
```

---

## Workflow Example

**User says:** `/build-feature "Add class waitlist feature"`

**Claude responds:**

```
Starting /build-feature workflow for: Add class waitlist feature

=== PHASE 1: DISCOVER ===

Before I create a brief, I need to understand your requirements.
Please answer these discovery questions:

**Users & Permissions:**
1. Who can join a waitlist? (Parents only? Students directly?)
2. Who can view waitlist positions? (Admin only? Teachers? Parents?)
3. Who can offer spots to waitlisted families?

**Security & Data:**
4. Should waitlist data be isolated by co-op?
5. Any expiration for waitlist offers?
6. Notification requirements (email, SMS, in-app)?

**Scope:**
7. What happens when a spot opens? (Auto-offer? Manual?)
8. Can families be on multiple waitlists?
9. Integration with existing registration system?

**Success Criteria:**
10. How do we know this feature is working correctly?
11. Required test coverage?

Please answer these questions, then I'll create the brief.
```

**User answers questions**

```
=== Creating Brief ===

Spawning brief-writer agent...
[Task: brief-writer] Creating brief for class waitlist feature
[Task: brief-writer] Brief saved to: briefs/active/class-waitlist.md

=== Codex Review ===

Spawning codex-reviewer agent...
[Task: codex-reviewer] Reviewing brief for class-waitlist

Codex Response:
✅ APPROVED
- Security requirements well-defined
- Scope boundaries clear
- Integration points documented

=== PHASE 2: DESIGN ===

Spawning spec-writer agent...
[Task: spec-writer] Creating spec from brief
[Task: spec-writer] Spec saved to: specs/active/class-waitlist.md

Spawning codex-reviewer agent...
[Task: codex-reviewer] Reviewing spec

Codex Response:
✅ APPROVED with suggestions:
- Add index on (class_id, position)
- Consider rate limiting for join endpoint

=== Complexity Analysis ===

Running: node agents/master-orchestrator.js specs/active/class-waitlist.md

Result:
- Blueprints: 6
- Layers: 3
- Estimated time: 42 minutes
- Complexity: MODERATE → Using hierarchical orchestration

=== PHASE 3: BUILD ===

Layer 1/3: [bp-01, bp-02] (Foundation)

  bp-01: Waitlist migration
    [Task: codex-reviewer] PRE-validating blueprint...
    [Codex] ✅ APPROVED - Schema looks correct
    [Task: general-purpose] Executing blueprint...
    [Agent] ✅ Created migration file
    [Task: codex-reviewer] Verifying implementation...
    [Codex] ✅ APPROVED - RLS policies correct

  bp-02: Waitlist RPC functions
    [Task: codex-reviewer] PRE-validating blueprint...
    [Codex] ✅ APPROVED
    [Task: general-purpose] Executing blueprint...
    [Agent] ✅ Created 3 RPC functions
    [Task: codex-reviewer] Verifying implementation...
    [Codex] ✅ APPROVED

Layer 2/3: [bp-03, bp-04] (API Layer)
  ...

Layer 3/3: [bp-05, bp-06] (UI Layer)
  ...

=== PHASE 4: FINALIZE ===

Running test suite...
✅ 12/12 tests passing
✅ Performance: 45ms avg query time
✅ Security: RLS verified

Feature complete!
```

---

## Hierarchical Todo Tracking

The orchestrator tracks todos at THREE levels:

```
Brief Todos:
├── Ask discovery questions ✅
├── Wait for user answers ✅
├── Create brief via agent ✅
├── Get Codex approval ✅

Spec Todos:
├── Create spec via agent ✅
├── Get Codex approval ✅
├── Analyze complexity ✅
├── Generate execution plan ✅

Blueprint Todos (per blueprint):
├── bp-01: Waitlist migration
│   ├── Pre-validate with Codex ✅
│   ├── Execute via agent ✅
│   └── Verify with Codex ✅
├── bp-02: RPC functions
│   ├── Pre-validate with Codex 🔄
│   ├── Execute via agent
│   └── Verify with Codex
└── ... (continues until ALL complete)
```

**CRITICAL**: Workflow continues until ALL levels are complete!

---

## Complexity Levels

| Level | Orchestration | Codex Reviews | Coverage |
|-------|---------------|---------------|----------|
| **trivial** | None | None | N/A |
| **simple** | TDD only | Final only | 30% |
| **moderate** | Hierarchical | Brief, Spec, Blueprints | 50% |
| **complex** | Hierarchical + batching | All + Pre-validation | 70% |
| **critical** | Full orchestration | All + Security audit | 85% |

---

## When to use

**Use `/build-feature` when:**
- Starting any new feature
- Need TDD workflow
- Want quality gates and Codex validation
- Building anything beyond trivial changes

**Don't use when:**
- Making trivial cosmetic changes
- Updating copy/text only
- Simple config changes

---

## Integration with other commands

```bash
# Start the feature workflow
/build-feature "description"

# Check project context
/check-project

# Enable fast mode for quick iterations
/fast-mode on

# Review completed feature
/review-feature feature-id

# Finalize and check gates
/finalize-feature feature-id
```

---

## Error Handling

### "agentInvoker callback required"

**Meaning**: The unified-orchestrator.js was called programmatically without the callback.

**Solution**: Follow WORKFLOW-PHASES-GUIDE.md manually using Task tool.

### Codex REJECTED

**Meaning**: Quality gate failed.

**Solution**: Review Codex feedback, fix issues, retry (max 3 iterations).

### Context overflow

**Meaning**: Too many parallel agents returned too much data.

**Solution**: Already handled by batching (max 5) and minimal returns (3-5 lines).

---

## Success indicators

You'll know it's working when:
- ✅ Discovery questions asked BEFORE any coding
- ✅ Brief created via agent (not written directly)
- ✅ Codex approves each phase before moving forward
- ✅ Blueprints PRE-validated before implementation
- ✅ Tests pass after implementation
- ✅ Feature marked complete with all todos done

---

**Last Updated**: 2025-11-26
**Status**: Single unified orchestrator with Task tool dispatch
