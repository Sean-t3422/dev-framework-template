# Build Feature - Unified Orchestration with Task Tool

**Command**: `/build-feature`

**Description**: Initiates the unified orchestration workflow. Uses Task tool to spawn sub-agents automatically - NO manual copy-paste coordination required. Codex validates at every phase.

---

## Architecture

```
Claude (Orchestrator)
    │
    ├─→ Task(Explore) ────────→ Search codebase for existing assets
    │       ↓
    ├─→ Skill(ui-component-library) → Check shadcn/ui, Radix for components
    │       ↓
    ├─→ [EPIC CHECK] ─────────→ Too big? Decompose into briefs
    │       ↓
    ├─→ Task(brief-writer) ──→ Creates brief
    │       ↓
    ├─→ Task(codex-reviewer) ─→ Validates brief
    │       ↓
    ├─→ Task(spec-writer) ───→ Creates spec
    │       ↓
    ├─→ Task(codex-reviewer) ─→ Validates spec
    │       ↓
    ├─→ [IF UI WORK] Task(design-uiguru-generator) ─→ Creates 3 design options
    │       ↓                                            ↓
    │   USER SELECTION REQUIRED ←──────────────────── Presents options
    │       ↓
    └─→ FOR EACH blueprint:
            ├─→ Task(codex-reviewer) ─→ PRE-validates blueprint
            ├─→ Task(general-purpose) → Executes blueprint (WITH selected design)
            └─→ Task(codex-reviewer) ─→ Verifies implementation
```

**Key points:**
- **ONE orchestrator**: Claude/Opus controls the flow
- **Pre-discovery**: Explore codebase + check libraries BEFORE brief
- **Epic detection**: Large features decompose into CRUD-sized stories
- **Task tool**: Spawns agents with isolated ~200k token context
- **Codex**: Quality gate at every phase (including PRE-implementation)
- **UI Guru**: Generates 3 distinct design options for user selection
- **Hierarchical todos**: Pre-Discovery → Brief → Spec → Design Selection → Blueprint levels

---

## What it does

### Phase 0: PRE-DISCOVERY (Exploration & Epic Detection)

**Before asking ANY discovery questions, explore what already exists!**

1. **Explore codebase via Task(Explore)** - Find existing assets
   ```
   Task({
     subagent_type: "Explore",
     description: "Explore codebase for [feature]",
     prompt: "Search for existing implementations, patterns, and integration points..."
   })
   ```

2. **Check UI component libraries via Skill** - Don't rebuild what exists
   ```
   Skill({ skill: "ui-component-library" })
   ```
   Match feature needs against shadcn/ui and Radix catalogs.

3. **Epic detection** - Is this too big for one brief?

   **Epic Indicators** (ANY true = decompose):
   | Question | If YES |
   |----------|--------|
   | Multiple user roles affected? | Epic |
   | Multiple database tables (>2)? | Epic |
   | Multiple API endpoints (>3)? | Epic |
   | Multiple UI pages/views? | Epic |
   | Crosses module boundaries? | Epic |

4. **If EPIC detected** - Decompose into CRUD-sized briefs:
   ```
   [FEAT]-1.1: Create [entity]
   [FEAT]-1.2: View [entity]
   [FEAT]-1.3: List [entities]
   [FEAT]-1.4: Edit [entity]
   [FEAT]-1.5: Delete [entity]
   ```
   Each brief gets its own brief → spec → build cycle.

5. **Document pre-discovery findings** - Pass to Phase 1

**Why this matters:**
- Prevents reinventing existing components
- Uses proven, accessible UI libraries
- Makes scope predictable with CRUD decomposition
- Informs discovery questions (skip questions about things that exist)

---

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

### Phase 2.5: UI DESIGN SELECTION (If UI Components Detected)

**CRITICAL: User MUST select a design before UI implementation begins!**

10. **Detect UI components in spec** - Check if feature has UI work
11. **If UI detected, invoke Task(design-uiguru-generator)** - Creates 3 distinct options:
    - **Editorial** - Playfair Display, warm cream, magazine aesthetic
    - **Technical** - JetBrains Mono, dark slate, IDE aesthetic
    - **Bold** - Bricolage Grotesque, gradients, animated
12. **Present HTML previews to user** - Generate viewable files
13. **WAIT for user selection** - Cannot proceed without choice
14. **Save design reference** - Pass to all UI blueprints

**Why this matters:**
- Prevents generic "AI slop" (Inter fonts, purple gradients)
- Ensures consistent design language across all UI components
- Gives user creative control over look and feel
- Results in distinctive, memorable interfaces

### Phase 3: BUILD (Automated Agent Dispatch)

**CRITICAL: Activate Skills BEFORE dispatching blueprints!**

```
For UI blueprints:    Skill({ skill: "ui-design-patterns" })
For DB blueprints:    Skill({ skill: "database-patterns" })
For all blueprints:   Skill({ skill: "tdd-enforcement" })
```

10. **FOR EACH blueprint in dependency order:**
    - **ACTIVATE relevant Skills** - Load domain expertise into context
    - **PRE-validate via Task(codex-reviewer)** - Check BEFORE implementing
    - **Execute via Task(general-purpose)** - Agent implements WITH skill guidance
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

=== PHASE 0: PRE-DISCOVERY ===

Before asking questions, let me explore what exists...

[Task: Explore] Searching codebase for waitlist/queue implementations...

Exploration Results:
  Found: src/lib/registrations/ - existing registration system
  Found: src/components/classes/ - class management UI
  Found: notifications/ pattern - can reuse for waitlist alerts
  Not Found: No existing waitlist implementation

[Skill: ui-component-library] Checking component libraries...

Library Check Results:
  shadcn/ui: DataTable (for waitlist display), Badge (for position), Button
  Radix: No additional primitives needed
  Build Custom: WaitlistPositionIndicator (simple, no existing match)

[Epic Check] Analyzing complexity...
  Tables: 1 (waitlist_entries)
  Endpoints: 3 (join, leave, position)
  UI Pages: 1 (waitlist management)
  Roles: 2 (parent, admin)
  Result: ✅ SINGLE STORY - Proceed to discovery

=== PHASE 1: DISCOVER ===

Based on exploration, I'll skip questions about things that exist.
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

=== PHASE 2.5: UI DESIGN SELECTION ===

Detecting UI components in spec...
✅ UI components detected: WaitlistCard, JoinButton, PositionDisplay

Spawning design-uiguru-generator agent...
[Task: design-uiguru-generator] Generating 3 design options...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DESIGN SELECTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review the 3 design options:

Option 1: EDITORIAL 📰
  Typography: Playfair Display + Source Sans 3
  Colors: Warm cream (#FFFBF5) + Deep charcoal (#1A1A1A)
  Preview: ./ui-designs/editorial.html

Option 2: TECHNICAL 💻
  Typography: JetBrains Mono + Inter
  Colors: Dark slate (#0F172A) + Emerald (#10B981)
  Preview: ./ui-designs/technical.html

Option 3: BOLD 🎨
  Typography: Bricolage Grotesque + DM Sans
  Colors: Gradient backgrounds + Sharp accents
  Preview: ./ui-designs/bold.html

Please select (1, 2, or 3):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User: 2

✅ Design selected: Technical (JetBrains Mono, dark slate, IDE aesthetic)
All UI blueprints will use this design language.

=== PHASE 3: BUILD ===

Layer 1/3: [bp-01, bp-02] (Foundation - Database)

  [Skill: database-patterns] ← ACTIVATING database expertise
  [Skill: tdd-enforcement] ← ACTIVATING TDD enforcement

  bp-01: Waitlist migration
    [Task: codex-reviewer] PRE-validating blueprint...
    [Codex] ✅ APPROVED - Schema looks correct
    [Task: general-purpose] Executing WITH database-patterns skill...
    [Agent] ✅ Created migration file (snake_case, RLS, indexes applied)
    [Task: codex-reviewer] Verifying implementation...
    [Codex] ✅ APPROVED - RLS policies correct

  bp-02: Waitlist RPC functions
    [Task: codex-reviewer] PRE-validating blueprint...
    [Codex] ✅ APPROVED
    [Task: general-purpose] Executing WITH database-patterns skill...
    [Agent] ✅ Created 3 RPC functions
    [Task: codex-reviewer] Verifying implementation...
    [Codex] ✅ APPROVED

Layer 2/3: [bp-03, bp-04] (API Layer)
  [Skill: tdd-enforcement] ← Tests written FIRST
  ...

Layer 3/3: [bp-05, bp-06] (UI Layer)
  [Skill: ui-design-patterns] ← ACTIVATING UI expertise
  [Design: Technical] ← APPLYING selected design (JetBrains Mono, dark slate)
  [Agent] ✅ Components use JetBrains Mono, dark slate palette, IDE aesthetic
  [Agent] ✅ No AI slop - distinctive typography and color scheme applied
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
- ✅ Phase 0 runs FIRST (explore codebase, check libraries, epic check)
- ✅ Existing components identified before building new ones
- ✅ Large features decomposed into CRUD-sized stories
- ✅ Discovery questions skip what was found in exploration
- ✅ Brief created via agent (not written directly)
- ✅ Codex approves each phase before moving forward
- ✅ UI design options presented for features with UI components
- ✅ User selects design BEFORE UI implementation begins
- ✅ Selected design applied consistently across all UI components
- ✅ Blueprints PRE-validated before implementation
- ✅ Tests pass after implementation
- ✅ Feature marked complete with all todos done
- ✅ No "AI slop" - distinctive fonts, colors, and design language used

---

**Last Updated**: 2025-11-28
**Status**: Unified orchestrator with Phase 0 pre-discovery + Task tool dispatch + UI Design Selection
