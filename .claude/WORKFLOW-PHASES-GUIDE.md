# Workflow Phases Guide - Unified Orchestration with Task Tool

**ARCHITECTURE**: ONE unified orchestrator (`unified-orchestrator.js`) handles ALL feature workflows. It uses the Task tool to spawn sub-agents automatically - NO manual copy-paste coordination required.

---

## The Complete Workflow

```
PRE-DISCOVERY → DISCOVER → DESIGN → BUILD → FINALIZE
      ↓            ↓          ↓        ↓         ↓
   Explore       Brief      Spec   Blueprints  Cleanup
   Libraries       ↓          ↓        ↓
   Epic Check   Codex      Codex    Codex Pre-Validation
                Review     Review   (BEFORE implementation)
```

**Key Architecture**:
- **Opus/Claude**: Main orchestrator - controls workflow, spawns agents
- **Task Tool**: Spawns sub-agents with isolated ~200k token context
- **Codex**: Quality gate - validates at each phase AND pre-validates blueprints
- **Hierarchical Todos**: Brief todos → Spec todos → Blueprint todos

---

## Orchestrator Files Reference

| File | Purpose | How to Use |
|------|---------|------------|
| `agents/unified-orchestrator.js` | THE orchestrator | Requires agentInvoker callback |
| `agents/master-orchestrator.js` | DAG/Blueprint planner | `node agents/master-orchestrator.js spec.md` |
| `lib/claude-orchestrator.js` | State management | Internal helper |
| `testing-framework/agents/codex-reviewer.js` | Codex CLI | `node codex-reviewer.js --security` |

**Archived (no longer used):**
- `archive/orchestrators-old/workflow-orchestrator.js`
- `archive/orchestrators-old/tdd-orchestration-hub.js`
- `archive/orchestrators-old/enhanced-orchestration.js`

---

## Phase 0: PRE-DISCOVERY (Exploration & Epic Detection)

**Purpose**: Before asking discovery questions, understand what already exists and if this is too big for one brief.

### Step 0.1: Explore Codebase (MANDATORY)

Ask: "Do we already have this in our code?"

```
Task({
  subagent_type: "Explore",
  description: "Explore codebase for [feature]",
  prompt: `Search the codebase for existing implementations related to [feature].

           Look for:
           - Existing components that do similar things
           - Related database tables/migrations
           - API patterns we already use
           - Similar features we can extend

           Return a summary of:
           1. What we FOUND (can reuse/extend)
           2. What we NEED (doesn't exist yet)
           3. Integration points (where new code connects)`
})
```

**Why this matters:**
- Prevents reinventing existing components
- Informs discovery questions (skip questions about things that exist)
- Reduces brief scope by identifying reusable code

### Step 0.2: Check External Libraries (UI Component Skill)

Ask: "Does shadcn/ui or Radix have this?"

```
Skill({ skill: "ui-component-library" })
```

Then match feature needs against the component catalog:

```markdown
## Library Check Results

### Available from shadcn/ui:
- Dialog for modal
- Form for validation
- DataTable for lists

### Available from Radix:
- Primitives for custom composition

### Build Custom:
- [Only what MUST be custom]
```

**Why this matters:**
- Uses proven, accessible components
- Reduces development time
- Ensures consistency with existing UI

### Step 0.3: Epic Detection (Complexity Check)

Ask: "Is this too big for one brief?"

**Epic Indicators** (ANY true = decompose into briefs):

| Question | If YES → |
|----------|----------|
| Multiple user roles affected? | Epic → Multiple briefs |
| Multiple database tables (>2)? | Epic → Multiple briefs |
| Multiple API endpoints (>3)? | Epic → Multiple briefs |
| Multiple UI pages/views? | Epic → Multiple briefs |
| Crosses module boundaries? | Epic → Multiple briefs |

**If Epic detected:**

```
╔══════════════════════════════════════════════════════════════╗
║ 🚨 EPIC DETECTED - DECOMPOSITION REQUIRED                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║ This feature is too large for one brief.                     ║
║                                                              ║
║ Breaking into CRUD-sized briefs:                             ║
║                                                              ║
║   [FEAT]-1.1: Create [entity]                               ║
║   [FEAT]-1.2: View [entity]                                 ║
║   [FEAT]-1.3: List [entities]                               ║
║   [FEAT]-1.4: Edit [entity]                                 ║
║   [FEAT]-1.5: Delete [entity]                               ║
║   [FEAT]-1.6: Search/Filter [entities]                      ║
║                                                              ║
║ Each brief gets its own brief → spec → build cycle.          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Brief template location:** `.claude/templates/brief-template.md`

### Step 0.4: Document Pre-Discovery Findings

Before proceeding to Phase 1, document:

```markdown
## Pre-Discovery Summary

### Existing Assets Found
- Components: [list from Step 0.1]
- Patterns: [list from Step 0.1]
- External libs: [list from Step 0.2]

### Scope Decision
- [ ] Single Brief → Proceed to Phase 1: DISCOVER
- [ ] Epic → Create brief breakdown first

### Briefs (if Epic)
1. [FEAT]-X.1: [name] - [size]
2. [FEAT]-X.2: [name] - [size]
3. ...
```

---

## Phase 1: DISCOVER (Brief Creation)

### Step 1.1: Generate Discovery Questions

Ask 15-20 comprehensive questions covering:

```markdown
Users & Permissions:
- Who are the primary users?
- What roles/permissions are needed?

Security & Compliance:
- Authentication/authorization requirements?
- Data isolation needs (RLS)?
- Compliance (COPPA, FERPA)?

Scope & Boundaries:
- What's explicitly IN scope?
- What's explicitly OUT?
- Integration points?

Technical Approach:
- Real-time or async?
- Performance targets?

Success Criteria:
- How measure success?
- Required tests?
```

### Step 1.2: WAIT FOR USER ANSWERS

**Do NOT proceed until user answers questions.**

### Step 1.3: Create Brief via Agent

```
Task({
  subagent_type: "brief-writer",
  description: "Create brief for [feature]",
  prompt: `Create a comprehensive brief for [feature].

           User's answers:
           ${userAnswers}

           Save to: briefs/active/[feature-name].md`
})
```

### Step 1.4: Codex Reviews Brief

```
Task({
  subagent_type: "codex-reviewer",
  description: "Review brief for [feature]",
  prompt: `Review this requirements brief for:
           - Engineering balance
           - Security concerns
           - Missing requirements
           - Feasibility issues

           Brief:
           [brief content]

           Respond: APPROVED or REJECTED with issues`
})
```

- If APPROVED → Move to Phase 2
- If REJECTED → Refine brief and repeat (max 3 rounds)

---

## Phase 2: DESIGN (Spec Creation)

### Step 2.1: Create Spec via Agent

```
Task({
  subagent_type: "spec-writer",
  description: "Create spec for [feature]",
  prompt: `Create detailed technical specification.

           Brief:
           [brief content]

           Include:
           - Database schema design
           - API endpoints design
           - ## UI Components (REQUIRED for user-facing features!)
           - Component architecture
           - Test strategy

           Save to: specs/active/[feature-name].md`
})
```

### ⚠️ MANDATORY: UI Components Section

**User-facing features MUST include a `## UI Components` section in the spec:**

```markdown
## UI Components

### ComponentName
- **Path**: `src/components/[feature]/ComponentName.tsx`
- **Type**: Client Component
- **Props**:
  ```typescript
  interface ComponentNameProps {
    data: DataType;
    onAction: () => void;
  }
  ```
- **States**: default | loading | error | empty
- **Responsive**: Mobile-first, breakpoints at 375px, 768px, 1024px
- **Accessibility**: ARIA labels, keyboard navigation

### PageName Page (if new route)
- **Route**: `/[path]`
- **Layout**: (app)/layout.tsx
- **Data Fetching**: Server | Client
- **Loading UI**: Skeleton
```

**If this section is missing for user-facing features, the blueprint-decomposer will flag it!**

### Step 2.2: Codex Reviews Spec

```
Task({
  subagent_type: "codex-reviewer",
  description: "Review spec for [feature]",
  prompt: `Review this technical spec for:
           - Architecture soundness
           - Security considerations
           - Performance concerns
           - Test coverage adequacy

           Spec:
           [spec content]

           Respond: APPROVED or REJECTED with issues`
})
```

- If APPROVED → Move to Phase 3
- If REJECTED → Refine spec and repeat (max 3 rounds)

---

## Phase 3: BUILD (Automated Blueprint Execution)

### Step 3.1: Complexity Analysis

```bash
node agents/master-orchestrator.js specs/active/[feature].md
```

This returns:
- Blueprints (5-10 minute tasks each)
- Dependency graph (DAG)
- Execution layers
- Time estimates

### Step 3.2: Decision Point

```
IF (estimatedBlueprints > 5 OR tables > 2):
  → HIERARCHICAL ORCHESTRATION (automated agents)
ELSE:
  → SIMPLE TDD (direct implementation)
```

### Step 3.3A: SIMPLE - Traditional TDD

```
1. Generate tests (testing-coordinator agent)
2. Codex reviews tests
3. Run tests (should fail - red)
4. Implement code
5. Codex checkpoint review
6. Run tests (should pass - green)
```

### Step 3.3B: COMPLEX - Hierarchical Orchestration

**THE NEW APPROACH**: Automated agent dispatch via Task tool.

```
FOR EACH layer in dependency graph:
  FOR EACH blueprint in layer (batched, max 5 parallel):

    1. PRE-VALIDATE with Codex (BEFORE implementation):
       Task({
         subagent_type: "codex-reviewer",
         description: "Pre-validate blueprint: [name]",
         prompt: `Review this blueprint BEFORE implementation.
                  Check:
                  - Does it align with spec?
                  - Are there security concerns?
                  - Dependencies satisfied?
                  - Interfaces correct?

                  Blueprint:
                  ${JSON.stringify(blueprint)}

                  Respond: APPROVED or REJECTED with issues`
       })

    2. IF APPROVED, EXECUTE via general-purpose agent:
       Task({
         subagent_type: "general-purpose",
         description: "Execute: [blueprint.name]",
         prompt: `Execute this blueprint:

                  Blueprint: ${blueprint.name}
                  Type: ${blueprint.type}
                  Description: ${blueprint.description}

                  Specifications:
                  ${JSON.stringify(blueprint.specifications)}

                  Create/modify files as specified.

                  RETURN MINIMAL SUMMARY (3-5 lines):
                  - Files created/modified: [filenames]
                  - Status: Complete/Failed
                  - Issues: [if any]`
       })

    3. VERIFY via Codex:
       Task({
         subagent_type: "codex-reviewer",
         description: "Verify: [blueprint.name]",
         prompt: `Verify implementation of ${blueprint.name}.
                  Check: Security, Performance, Tests passing.
                  Respond: APPROVED or ISSUES FOUND`
       })

  Save checkpoint after each layer
```

### Hierarchical Todo Tracking

The orchestrator maintains todos at THREE levels:

```
Brief Todos (5 items):
├── Define requirements ✅
├── Identify users & permissions ✅
├── Document security needs ✅
├── Establish scope boundaries ✅
└── Get Codex approval ✅

Spec Todos (4 items):
├── Design database schema ✅
├── Design API endpoints ✅
├── Design UI components ✅  ← REQUIRED for user-facing features!
└── Get Codex approval ✅

Blueprint Todos (3 items per blueprint):
├── bp-01: User table migration
│   ├── Pre-validate with Codex 🔄
│   ├── Execute via agent
│   └── Verify with Codex
├── bp-02: User API routes
│   ├── Pre-validate with Codex
│   ├── Execute via agent
│   └── Verify with Codex
├── bp-03: UserProfile component  ← UI MUST be included!
│   ├── Pre-validate with Codex
│   ├── Execute via agent (with screenshot evidence)
│   └── Verify with Codex
└── ... (continues until ALL complete)
```

**CRITICAL**: Orchestrator continues until ALL todo levels are complete!

---

### 📸 Evidence Requirements by Blueprint Type

**Each blueprint type has specific evidence requirements:**

| Blueprint Type | Required Evidence |
|----------------|-------------------|
| `database` | Migration output, Tests passing, Query performance <100ms |
| `api` | Tests passing, Response time <200ms, Auth validation |
| `service` | Unit tests passing, TypeScript types correct |
| `ui-component` | **Screenshots** (default, loading, error, mobile), Tests passing |
| `ui-page` | **Screenshots** (with data, empty, mobile), Route accessible, Tests passing |

**UI blueprints REQUIRE screenshots because:**
- Visual verification catches issues tests miss
- Responsive design can only be verified visually
- Accessibility issues often visible before testable
- Loading/error states frequently forgotten without screenshots

**Evidence is saved to:** `evidence/{session-id}/{blueprint-id}/`

---

### 🎨 UI Blueprint Context Capsule

UI agents receive enhanced context including:

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           CONTEXT CAPSULE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣

EPIC VISION (from Brief):
[Full brief vision so agent understands the bigger picture]

STORY GOAL (from Spec):
[What this feature should accomplish]

YOUR TASK: bp-04 - UserProfileCard component
Type: ui-component
Est. Time: 10 minutes

YOUR POSITION:
You are Agent 2 of 3 in this execution batch.

PARALLEL WORK (other agents in this batch):
  - bp-03: UserList component (ui-component)
  - bp-05: UserDetailModal component (ui-component)

⚠️  EVIDENCE REQUIRED:
  □ [SCREENSHOT] Component rendering (default state)
  □ [SCREENSHOT] Loading state
  □ [SCREENSHOT] Error state
  □ [SCREENSHOT] Mobile responsive (375px width)
  □ [TEST] Component tests passing

Save evidence to: evidence/session-123/bp-04/

📋 RETURN FORMAT (3-5 lines ONLY)
Return ONLY a brief summary:
  Line 1: Files created/modified
  Line 2: Tests status (X passing, Y failing)
  Line 3: Evidence location
  Line 4: Any blockers (or "No blockers")
╚═══════════════════════════════════════════════════════════════════════════════╝
```

This ensures agents understand:
1. The big picture (Epic Vision)
2. Their specific task
3. What others are doing (parallel awareness)
4. Exactly what evidence to provide

---

## Phase 4: FINALIZE (Cleanup)

1. Run final test suite
2. Check for TODO comments
3. Update documentation
4. Mark feature complete

---

## Error Messages

### "agentInvoker callback required"

**Meaning**: The unified-orchestrator.js was called without providing the callback function that invokes agents.

**What to do**: When using the orchestrator programmatically:

```javascript
const orchestrator = new UnifiedOrchestrator();

// Provide the agentInvoker callback
await orchestrator.orchestrateFeature("feature description", async (params) => {
  // This is YOUR code that calls Task tool
  return await invokeTaskTool({
    subagent_type: params.subagent_type,
    description: params.description,
    prompt: params.prompt
  });
});
```

If you're in Claude Code, YOU are the orchestrator - follow this guide manually using Task tool.

### "Cannot find module"

**Meaning**: An agent file is missing.

**What to do**: Check agents exist in `/home/sean_unix/Projects/dev-framework/agents/`

---

## Quick Reference: Agent Types

| Agent | Purpose | How to Invoke |
|-------|---------|---------------|
| `brief-writer` | Creates requirements briefs | Task tool |
| `spec-writer` | Creates technical specs | Task tool |
| `testing-coordinator` | Generates test strategies | Task tool |
| `general-purpose` | Executes blueprints | Task tool |
| `tdd-enforcer` | Enforces TDD workflow | Task tool |

---

## 🚨 CODEX IS NOT AN AGENT - IT'S A SEPARATE LLM

**CRITICAL: Codex (GPT-5) must be called via Bash, NOT Task tool!**

### ❌ WRONG (Fake Codex - spawns Claude):
```
Task({
  subagent_type: "codex-reviewer",
  prompt: "Review this..."
})
```

### ✅ CORRECT (Real Codex - calls GPT-5):
```bash
Bash({
  command: 'node testing-framework/agents/codex-reviewer.js --security --prompt "Review this..."',
  timeout: 180000
})
```

### Codex Review Commands:
```bash
# Brief validation
node testing-framework/agents/codex-reviewer.js --engineering-balance --prompt "Validate brief: ..."

# Spec review
node testing-framework/agents/codex-reviewer.js --security --engineering-balance --prompt "Review spec: ..."

# Blueprint pre-validation
node testing-framework/agents/codex-reviewer.js --engineering-balance --prompt "Pre-validate blueprint: ..."

# Code security audit
node testing-framework/agents/codex-reviewer.js --security --files "src/lib/payments/*.ts"
```

**Why separate LLM matters:** Cross-model review catches different bugs than same-model review. Claude reviewing Claude's work misses blind spots that GPT-5 Codex catches.

---

## Why Pre-Validation Matters

**Old approach**: Build first, find problems later (expensive!)

```
Build → Find bugs → Refactor → Find more bugs → ...
(Each iteration costs tokens and time)
```

**New approach**: Validate BEFORE building (cheap!)

```
Pre-validate → Fix design → Build correctly
(Catch issues when they're just text, not code)
```

Codex validates blueprints BEFORE agents implement them because:
- 10x cheaper to fix a design than fix code
- Prevents "puzzle pieces don't fit" problems
- Ensures security boundaries before code exists
- Catches dependency issues early

---

## Context Management

### Problem: Context Overflow

With many parallel agents (e.g., 19 blueprints), each returning 40k+ tokens, the main session accumulates 760k+ tokens and collapses.

### Solution: Batching + Minimal Returns

1. **Batch execution**: Max 5 blueprints at a time
2. **Minimal summaries**: Agents return 3-5 lines, not full code
3. **Layer-by-layer**: Complete one layer before starting next
4. **Checkpoints**: Save state after each layer for recovery

---

## Resuming from Existing Brief

If you brainstorm with Claude/Codex separately and have a brief ready, you can hand it off to the orchestrator mid-workflow:

### Commands

```bash
# Validate brief is ready for handoff
/validate-brief briefs/active/my-feature.md

# Hand off to orchestrator (starts at DESIGN phase)
/continue-brief briefs/active/my-feature.md

# Start at BUILD phase (requires existing spec)
/continue-brief briefs/active/my-feature.md --start-phase BUILD --spec specs/active/my-feature.md
```

### Programmatic Usage

```javascript
const { UnifiedOrchestrator } = require('./agents/unified-orchestrator');
const orchestrator = new UnifiedOrchestrator();

// Option 1: Resume from brief (starts at DESIGN)
await orchestrator.resumeFromBrief(
  'briefs/active/my-feature.md',
  agentInvoker
);

// Option 2: Resume from brief with specific start phase
await orchestrator.resumeFromBrief(
  'briefs/active/my-feature.md',
  agentInvoker,
  { startPhase: 'BUILD', existingSpec: specObject }
);

// Option 3: Just validate without starting
const validation = await orchestrator.validateBrief(
  'briefs/active/my-feature.md',
  agentInvoker
);
console.log(validation.ready ? 'Ready!' : validation.review);
```

### Brief Requirements for Handoff

For a brief to be ready for orchestration:
- **Clear requirements** - What the user needs
- **Scope boundaries** - What's in/out
- **Security considerations** - Auth, RLS, data isolation
- **Success criteria** - How we know it's done

---

## Remember

✅ **ALWAYS** run Phase 0 first (Explore, Libraries, Epic Check)
✅ **ALWAYS** ask discovery questions BEFORE creating brief
✅ **ALWAYS** check ui-component-library skill before building UI
✅ **ALWAYS** decompose Epics into CRUD-sized briefs
✅ **ALWAYS** get Codex approval before moving to next phase
✅ **ALWAYS** pre-validate blueprints BEFORE implementation
✅ **NEVER** skip phases - they exist for quality
✅ **USE Task tool** to spawn agents - don't write directly
✅ **Batch agents** (max 5) to prevent context overflow
✅ **USE /continue-brief** to hand off existing briefs

---

**Last Updated**: 2025-11-28
**Status**: Single unified orchestrator with Phase 0 pre-discovery + automated agent dispatch
