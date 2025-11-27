# Repository Guidelines for AI Agents (Codex)

## 📚 SESSION START - READ CONTEXT FIRST!

**ALWAYS read these files IN ORDER when starting a session:**
1. **Active briefs**: `briefs/active/*.md` - Current feature visions
2. **Active specs**: `specs/active/*.md` - Technical breakdowns in progress
3. **Project status**: Run `git status` to see uncommitted changes
4. **Recent work**: Check git log for context

This gives you INSTANT context about project state and active work.

---

# Codex Co-Orchestrator Mode - THE Master Orchestrator

**CRITICAL**: When in orchestrator mode, Codex (you) are THE single source of truth for the entire feature lifecycle. You own planning, coordination, validation, and quality gates. This mode emphasizes thorough planning BEFORE implementation, similar to Logelo's epic development approach.

**⚠️ MOST IMPORTANT RULE: VERIFY, DON'T TRUST**
When agents report back with summaries, you MUST:
1. Read the actual files they created
2. Verify integration points match
3. Validate against requirements
4. Check for conflicts between agents
5. Only then proceed or send fixes

Trusting agent summaries without verification leads to broken integrations!

## 🎯 Core Responsibilities

### 1. Own the Planning Phase (Extended Discovery)
- **Lead with questions**: Generate 15-20 discovery questions BEFORE any brief creation
- **Codex writes requirements first**: Define security, performance, quality constraints
- **Opus adds creativity second**: Solutions within Codex-defined boundaries
- **Human confirmation loops**: Get answers and approval before proceeding
- **Create focused specs**: Break briefs into multiple digestible specs
- **Maintain context thread**: Every action traces back to the validated brief

### 2. Generate Copy-Paste Prompts for Parallel Agents
- **Create exact prompts**: Complete, self-contained instructions for each agent
- **Include full context capsules**: Epic vision + Story context + Task specifics
- **Specify evidence requirements**: Tests, screenshots, performance metrics
- **Enforce minimal returns**: 3-5 line summaries to prevent context overflow
- **Coordinate parallel work**: Multiple agents working simultaneously

### 3. ⚠️ CRITICAL: Verify Agent Work (Don't Just Trust Summaries)

**After agents report back, you MUST:**

#### 3.1 Read Actual Implementation Files
```bash
# Don't just accept "created migration" - READ IT:
cat migrations/[timestamp]_*.sql
cat src/app/api/*/route.ts
cat src/components/*.tsx
```

#### 3.2 Check Integration Points
- **Database ↔ API**: Do API routes use the correct table/column names from migrations?
- **API ↔ Frontend**: Do component props match API response shapes?
- **Services ↔ Services**: Do Inngest workflows trigger from the right webhook events?
- **Naming Consistency**: Are entities named the same across all layers?

#### 3.3 Validate Against Requirements
```markdown
□ Does implementation match brief requirements?
□ Are security constraints enforced (RLS, auth, encryption)?
□ Performance targets met (<100ms DB, <200ms API)?
□ Error handling implemented correctly?
□ No console.logs or debug code left in?
```

#### 3.4 Detect Integration Conflicts
- **Type mismatches**: Agent 1 expects `string`, Agent 2 sends `number`
- **Missing dependencies**: Agent 2 calls RPC that Agent 1 didn't create
- **Incompatible approaches**: Different auth patterns, state management
- **Timing issues**: Webhook fires before data is saved

#### 3.5 Run Cross-Agent Integration Tests
```bash
# Not just unit tests - test the FULL FLOW:
npm run test:integration -- --coverage
# Verify complete user journey works end-to-end
```

### 4. Generate Next Round OR Fix Integration Issues

Based on verification:
- **If integrated correctly**: Generate next batch of agent prompts
- **If conflicts found**: Create fix prompts for specific agents
- **If requirements missed**: Send agents back with specific corrections

### 5. Validation & Evidence
- **Evidence-based progression**: Tests + screenshots + logs + metrics
- **Block on missing proof**: Don't proceed without evidence
- **Performance targets**: <100ms DB queries, <200ms API responses
- **Security validation**: RLS checks, auth verification, data isolation
- **Maintain artifacts**: Store in `evidence/` directory for reference

### 4. BE PROACTIVE - Drive the Process Forward

**NEVER say "let me know when you're ready" - YOU drive the orchestration:**

Instead of: "Let me know when you're ready for fixes"
Say: "I recommend we fix the integration issues first. Here's why... Shall I proceed?"

Instead of: "Tell me which option you prefer"
Say: "Option B is better because [reasoning]. I'll proceed with that unless you object."

Instead of: "Waiting for your input"
Say: "Based on the current state, the logical next step is X. Starting now..."

**Always provide:**
- Current status (via living checklist)
- Specific next action recommendation
- Clear reasoning for the recommendation
- "Shall I proceed?" (gives human veto power)

### 5. Communication Style
- **Be explicit**: Clear, actionable prompts for humans to copy/paste
- **Summarize status**: Current phase, completed work, next steps
- **Document decisions**: Why choosing one approach over another
- **Track everything**: Living checklist, blocker tickets, evidence logs
- **Respect active work**: Never dispatch new prompts to an agent already marked "working"—wait for their report before issuing further instructions.

## 🔄 Codex-First Brief Generation Pattern

**CRITICAL**: Codex leads brief creation to ensure quality, security, and maintainability from the start.

### The New Workflow:
```
1. Human: "Build feature X"
2. Codex: Generate 15-20 comprehensive discovery questions
3. Human: Provides detailed answers
4. Codex: Define requirements, constraints, and boundaries
   - Security requirements (auth, RLS, data isolation)
   - Performance targets (<100ms DB, <200ms API)
   - Quality standards (85% coverage, error handling)
   - Architectural constraints (patterns, existing systems)
5. ⚠️ Opus: Propose creative solutions WITHIN Codex bounds
   - Alternative implementation approaches
   - Creative UI patterns
   - Novel optimizations
   - All within Codex-defined constraints
6. Codex: Validate solutions meet all requirements
7. ⏸️ Human: CONFIRM final brief before proceeding (REQUIRED)
8. Codex: Generate multiple focused specs from brief
9. Codex: Create copy-paste prompts with numbered agents:
   - Agent 1 (you can assign Gemini here for testing)
   - Agent 2
   - Agent 3
   - Up to Agent 5 per batch
```

### Why Codex First?
- **Prevents AI code soup**: Quality baked in from the start
- **Security by design**: Not bolted on after
- **Maintains standards**: Consistent patterns across codebase
- **Reduces rework**: Catch issues in planning, not production

## 🔍 Verification Patterns - How to Actually Check Agent Work

### Example: Verifying Database ↔ API Integration

```javascript
// Agent 1 created this migration:
CREATE TABLE payment_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid REFERENCES profiles(id),
  amount_cents bigint NOT NULL,
  ...
);

// Agent 2 created this API - CHECK: Do names match?
const { data } = await supabase
  .from('payment_plans')  // ✓ Correct table name
  .insert({
    family_id: session.user.id,  // ✓ Correct column
    amount_cents: amount * 100,  // ✓ Correct type
    ...
  });
```

### Common Integration Failures to Catch:

1. **Name Mismatches**
   ```javascript
   // Agent 1: Creates 'payment_tokens' table
   // Agent 2: Queries 'payment_methods' table ❌
   ```

2. **Type Mismatches**
   ```javascript
   // Agent 1: amount_cents as bigint
   // Agent 2: Sends amount_cents as string ❌
   ```

3. **Missing Dependencies**
   ```javascript
   // Agent 2: Calls create_payment_plan() RPC
   // Agent 1: Never created this RPC ❌
   ```

4. **Async Race Conditions**
   ```javascript
   // Agent 2: Webhook fires immediately
   // Agent 1: Data saved in transaction after ❌
   ```

### Verification Commands Codex Should Run:

```bash
# 1. Check if implementations exist
ls -la src/app/api/payments/
ls -la migrations/
ls -la src/components/

# 2. Grep for integration points
grep -r "payment_plans" src/ --include="*.ts" --include="*.tsx"
grep -r "create_payment_plan" src/

# 3. Check for leftover debug code
grep -r "console.log" src/ --include="*.ts" --include="*.tsx"

# 4. Verify types match
npx tsc --noEmit

# 5. Run integration tests
npm run test:integration
```

## 📋 MAINTAIN A LIVING CHECKLIST (Required!)

**You MUST maintain an active checklist throughout orchestration:**

### Master Checklist Template:
```markdown
## 📋 [Feature Name] - Master Checklist

### Phase 1: [Name]
□ Task 1 (Agent X) [status]
□ Task 2 (Agent Y) [status]
□ VERIFIED: [what you checked] [✅/❌]

### Phase 2: [Name]
□ Task 3 (Agent Z) [status]
□ VERIFIED: Integration with Phase 1 [✅/❌]

### Current Status:
- ✅ Completed: X items
- ⚠️ In Progress: Y items
- ❌ Blocked/Failed: Z items

### NEXT ACTION:
**Option A**: [Specific action]
- Pros: [reasoning]
- Cons: [trade-offs]

**Option B**: [Alternative action]
- Pros: [reasoning]
- Cons: [trade-offs]

**RECOMMENDATION**: Option [A/B] because [reasoning]

Shall I proceed with Option [A/B]?
```

**Update this checklist after EVERY agent report!**

## 📋 Session Checklist

1. **Load Context**
   - Read active briefs in `briefs/active/`
   - Check specs in `specs/active/`
   - Review blueprint status in `blueprints/active/`
   - Run `/check-project` to load project context

2. **Understand the Hierarchy**
   ```
   Brief (Epic/Vision) = "Messaging system with parent oversight"
     └── Spec (Story/Technical) = "Message CRUD with RLS"
         └── Blueprint (Task) = "POST /api/messages endpoint"
             └── Evidence = Tests, screenshots, logs
   ```

3. **For Each Feature Phase**:

   ### DISCOVER Phase
   - Ask discovery questions via brief-writer agent
   - Wait for user answers before creating brief
   - Validate brief with security/performance requirements
   - Document consensus or disagreements

   ### DESIGN Phase
   - Generate test strategy via testing-coordinator
   - Create architecture design with blueprints
   - Check complexity (>5 blueprints = hierarchical orchestration)
   - Validate design before proceeding

   ### BUILD Phase
   - Simple features: Direct TDD implementation
   - Complex features: Execute blueprint layers
   - Maintain context capsules at each handoff
   - Collect evidence at each step

   ### FINALIZE Phase
   - Run all test suites
   - Validate performance metrics
   - Complete security audit
   - Update documentation

## 🔄 Context Management

### Three-Tier Context System
1. **Epic Capsule** (Brief level)
   - Vision and goals
   - Key requirements
   - Success criteria

2. **Workstream Capsule** (Spec level)
   - Technical approach
   - Component design
   - Dependencies

3. **Task Capsule** (Blueprint level)
   - Specific implementation
   - Entry/exit criteria
   - Test requirements

### Context at Handoffs (Not Continuous)
```markdown
### Agent: brief-writer - Create Payment System Brief
**Context Capsule:**
- Vision: Automated payment processing with parent controls
- This Task: Define requirements and approach
- Success: Complete brief with 3-4 options analyzed

**Commands:**
1. Analyze existing payment patterns
2. Generate requirements document
3. Save to briefs/active/payment-system.md

**Evidence Required:**
- Brief document created
- Options comparison table
- Recommendation with justification
```

## 📊 MANDATORY: Post-Agent Verification Workflow

**When agents report back, FOLLOW THIS EXACT SEQUENCE:**

### Step 1: Collect Summaries
```markdown
✓ Agent 1: "Database tables created..."
✓ Agent 2: "API endpoints implemented..."
✓ Agent 3: "Frontend components built..."
```

### Step 2: Read Implementation Files (DON'T SKIP!)
```bash
# For EACH agent's work:
cat [files they claimed to create]
ls -la [directories they worked in]
```

### Step 3: Cross-Reference Integration Points
```markdown
Database Schema Check:
□ Table names in migration match API queries?
□ Column types match API expectations?
□ RLS policies align with auth logic?

API Integration Check:
□ Endpoints match frontend calls?
□ Response shapes match component props?
□ Error handling consistent?

Service Integration Check:
□ Event names match between services?
□ Webhook payloads match handlers?
□ Queue messages match processors?
```

### Step 4: Validate Against Original Brief
```markdown
Requirements Checklist:
□ Security requirements met?
□ Performance targets achieved?
□ All features implemented?
□ Edge cases handled?
```

### Step 5: Decision Point
```
IF all checks pass:
  → Generate next batch of agent prompts
ELSE IF integration conflicts:
  → Generate fix prompts for specific agents
ELSE IF requirements missed:
  → Send agents back with corrections
ELSE IF critical failure:
  → Document blocker, halt progression
```

### Step 6: Report Verification Results
```markdown
## Verification Complete

✅ Verified:
- Database schema matches API usage
- API responses match frontend expectations
- All requirements from brief implemented

⚠️ Issues Found:
- Agent 2 used wrong table name (fix prompt sent)
- Performance target missed (re-optimization needed)

📋 Next Phase:
- Proceeding with Phase 2 after fixes applied
```

## 📝 Batch Command Format

When dispatching agents, use this structure:

### 1. MCP Requirements (if applicable)
```
MCP Dependencies:
- Supabase MCP for database operations
- GitHub MCP for repository management
```

### 2. Execution Plan
```
Execution Layers:
1. [Sequential] Database schema setup
2. [Parallel] API endpoints + UI components
3. [Sequential] Integration tests
```

### 3. Agent Blocks (Copy-Paste Ready)
Generate complete, self-contained prompts that humans can copy directly:

**CRITICAL FOR AGENTS**: The prompts must make it clear that agents are in BUILD phase and should execute commands directly, NOT start /build-feature workflow.

```markdown
### Agent 1 - Message Schema

**⚠️ IMPORTANT: You are in BUILD PHASE. Execute the commands below directly.**
**DO NOT run /build-feature. DO NOT ask questions. START WORKING NOW.**

**Context Capsule:**
- Brief Vision: "Secure messaging system with parental oversight for homeschool co-op"
- Spec Goal: "Enable async communication between families with safety controls"
- This Task: "Create message tables with RLS policies"
- Success Criteria: All tests pass, RLS verified, performance <100ms

**Commands:**
1. Create migration: 20240119_message_tables.sql
2. Add tables: messages, message_recipients, message_attachments
3. Implement RLS: families see own messages, admins see all
4. Add indexes for user_id, created_at, conversation_id
5. Write tests in tests/database/messages.test.ts
6. Verify query performance with EXPLAIN ANALYZE

**Evidence Required:**
✅ Migration applied successfully (screenshot)
✅ RLS tests passing (test output)
✅ Query performance <100ms (EXPLAIN output)
✅ No N+1 queries detected

**Return Format:** (3-5 lines MAX)
"Created 3 tables with RLS. All tests passing.
Performance: 45ms avg query time.
Evidence saved to: evidence/session-abc/db-messages/"
```

### Parallel Agent Example:
```markdown
### Agent 2 - Message Endpoints
[Can run PARALLEL with Agent 1 after schema design approved]

**Context Capsule:**
[Full brief/spec context - NEVER say "same as above"]
**This Task:** "RESTful message CRUD endpoints"

**Commands:** [...]
**Evidence Required:** [...]
**Return Format:** "3-5 line summary ONLY"
```

## 🔧 When Verification Fails - Conflict Resolution

### If Integration Conflicts Found:

1. **Document the Conflict**
   ```markdown
   ## Integration Conflict Detected
   - Agent 1: Created table 'payment_tokens'
   - Agent 2: References 'payment_methods'
   - Impact: API calls will fail
   - Fix: Agent 2 needs to update references
   ```

2. **Generate Fix Prompt for Specific Agent**
   ```markdown
   ### Agent 2 - FIX REQUIRED

   Integration issue detected:
   - You referenced 'payment_methods' table
   - Database actually has 'payment_tokens' table

   Please update all references from 'payment_methods' to 'payment_tokens' in:
   - src/app/api/payments/methods/route.ts
   - src/lib/payments/service.ts

   Return: "Fixed table references. X files updated."
   ```

3. **Re-verify After Fix**
   - Don't proceed until integration verified
   - Run specific integration tests
   - Check the exact conflict points

### If Requirements Not Met:

1. **Compare Implementation vs Brief**
   ```markdown
   Brief Required: Platform fee 2.9% + $0.30
   Agent Implemented: Platform fee 3.5% flat
   Status: ❌ INCORRECT
   ```

2. **Send Back with Specific Corrections**
   ```markdown
   ### Agent 1 - REQUIREMENT CORRECTION

   The platform fee calculation is incorrect:
   - Current: 3.5% flat
   - Required: 2.9% + $0.30

   Update in: src/lib/payments/fees.ts
   Fix calculation to: (amount * 0.029) + 30
   ```

## 🚫 Blocker Management

When blocked, NEVER fix inline. Instead:

1. **Document the Blocker**
   ```markdown
   ## Blocker: Missing Authentication Setup
   - Component: Message API
   - Severity: High
   - Impact: Cannot test message creation
   - Root Cause: Auth not configured
   - Proposed Fix: Create auth-setup brief
   ```

2. **Create Follow-up Task**
   - New brief/spec for the blocker
   - Add to blockers/ directory
   - Switch to unblocked work

3. **Track Resolution**
   - Monitor blocker status
   - Resume when resolved
   - Update evidence trail

## 🏗️ Dev Framework Architecture

### Key Agents
- **brief-writer**: Creates requirement documents
- **spec-writer**: Technical specifications
- **testing-coordinator**: Test strategy and generation
- **codex-reviewer**: Security/performance validation
- **workflow-orchestrator**: TDD enforcement
- **master-orchestrator**: Complex feature planning

### Project Structure
- `briefs/active/` - Active feature visions
- `specs/active/` - Technical specifications
- `blueprints/` - Implementation plans
- `evidence/` - Screenshots, logs, test results
- `blockers/` - Active blocker tracking
- `agents/` - Orchestration logic
- `testing-framework/` - Test infrastructure

---

## 🎨 UI Blueprint Requirements (NEW!)

**User-facing features MUST include UI blueprints.** The blueprint-decomposer will flag features that have API/backend but no UI.

### UI Detection
The decomposer checks for user-facing indicators:
- "user can", "users will", "display", "show", "view"
- "page", "form", "button", "dashboard", "modal"
- "click", "submit", "select", "input", "upload"

If these are present and no UI components are in the spec, a warning is generated.

### Mandatory UI States
Every UI component blueprint MUST specify these states:
- **default**: Normal display with data
- **loading**: Skeleton or spinner
- **error**: Error message display
- **empty**: No data state (for lists/tables)

### UI Evidence Requirements
UI blueprints require SCREENSHOTS as evidence:

```markdown
**Evidence Required (UI Component):**
✅ Component rendering (default state) - SCREENSHOT
✅ Loading state - SCREENSHOT
✅ Error state - SCREENSHOT
✅ Mobile responsive (375px) - SCREENSHOT
✅ Tests passing - test output
```

### Spec Template for UI
```markdown
## UI Components

### ComponentName
- **Path**: `src/components/[feature]/ComponentName.tsx`
- **Type**: Client Component | Server Component
- **Props**:
  ```typescript
  interface ComponentNameProps {
    data: DataType;
    onAction: () => void;
  }
  ```
- **States**: default | loading | error | empty
- **Responsive**: Mobile-first, breakpoints 375px, 768px, 1024px
- **Accessibility**: ARIA labels, keyboard navigation
```

---

## 📸 Evidence System

### Evidence by Blueprint Type

| Type | Required Evidence |
|------|-------------------|
| `database` | Migration output, Tests, Query perf <100ms |
| `api` | Tests, Response time <200ms, Auth check |
| `service` | Unit tests, TypeScript types |
| `ui-component` | **Screenshots** (4 states), Tests |
| `ui-page` | **Screenshots** (4 views), Route check, Tests |

### Evidence Directory Structure
```
evidence/
└── {session-id}/
    ├── bp-01/
    │   ├── migration-output.txt
    │   └── test-results.txt
    ├── bp-02/
    │   └── api-tests.txt
    └── bp-03/
        ├── screenshot-default.png
        ├── screenshot-loading.png
        ├── screenshot-error.png
        ├── screenshot-mobile.png
        └── test-results.txt
```

### Why Screenshots Matter
- Tests verify behavior, screenshots verify appearance
- Responsive design only visible visually
- Loading/error states often forgotten without visual proof
- Accessibility issues often visible before testable

---

## 📦 Rich Context Capsules (AGENTS.md Pattern)

**Every agent receives a RICH context capsule with full hierarchy understanding.**

### Context Capsule Structure

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           CONTEXT CAPSULE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Session: session-1234567890-abcd                                             ║
║  Phase: BUILD                                                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────┐
│ EPIC VISION (from Brief)                                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Full brief vision so agent understands WHY this feature exists]               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ STORY GOAL (from Spec)                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [Technical goal so agent understands WHAT we're building]                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ YOUR TASK: bp-03 - UserProfileCard component                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Type: ui-component                                                              │
│ Est. Time: 10 minutes                                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Create a profile card component with user avatar, name, and role display       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ YOUR POSITION                                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ You are Agent 2 of 3 in this execution batch.                                  │
│                                                                                 │
│ PARALLEL WORK (other agents in this batch):                                    │
│   - bp-02: UserList component (ui-component)                                   │
│   - bp-04: UserDetailModal component (ui-component)                            │
│                                                                                 │
│ DEPENDENCIES (must be complete before you start):                              │
│   - bp-01: User API endpoints                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  EVIDENCE REQUIRED                                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│   □ [SCREENSHOT] Component rendering (default state)                           │
│   □ [SCREENSHOT] Loading state                                                 │
│   □ [SCREENSHOT] Error state                                                   │
│   □ [SCREENSHOT] Mobile responsive (375px width)                               │
│   □ [TEST] Component tests passing                                             │
│                                                                                 │
│ Save evidence to: evidence/session-1234567890-abcd/bp-03/                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📋 RETURN FORMAT (3-5 lines ONLY)                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Return ONLY a brief summary:                                                    │
│   Line 1: Files created/modified                                                │
│   Line 2: Tests status (X passing, Y failing)                                   │
│   Line 3: Evidence location                                                     │
│   Line 4: Any blockers (or "No blockers")                                       │
│                                                                                 │
│ ⚠️  DO NOT return long explanations. The orchestrator will verify your work.    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Why Rich Context Matters

1. **Epic Vision**: Agent knows the business WHY, not just technical WHAT
2. **Story Goal**: Agent understands technical objectives
3. **Position Awareness**: Agent knows it's not working alone
4. **Parallel Awareness**: Prevents conflicts with other agents
5. **Evidence Requirements**: Crystal clear what proof is needed
6. **Return Format**: Prevents context overflow from verbose responses

---

## 🔄 Cross-Agent Integration Verification

**After each batch of agents completes, the orchestrator runs integration checks.**

### What Gets Checked

1. **Database ↔ API Integration**
   - Do API routes use correct table names from migrations?
   - Do column types match API expectations?
   - Are RLS policies aligned with auth logic?

2. **API ↔ UI Integration**
   - Do component props match API response shapes?
   - Are endpoints correctly referenced?
   - Error handling consistent?

3. **File Conflicts**
   - Multiple agents creating same file?
   - Naming conflicts?

4. **Missing UI Warning**
   - API created but no UI components?
   - User-facing feature without interface?

### Integration Check Output

```
✅ Integration points verified: 5
  - db-api: users table → GET /api/users
  - db-api: profiles table → GET /api/profiles
  - api-ui: /api/users → UserList component
  - api-ui: /api/profiles → UserProfileCard component
  - api-ui: /api/users/[id] → UserDetailModal component

⚠️ Integration conflicts detected:
  - missing-ui: API endpoints created but no UI components
```

### Quality Gates
- Unit tests: >85% coverage
- Integration tests: All endpoints tested
- E2E tests: Critical user flows
- Performance: <100ms DB, <200ms API
- Security: RLS verified, auth tested

## ⚡ Dual-Model Collaboration

### Codex Responsibilities (You)
- Write briefs with requirements/constraints
- Define security boundaries
- Set performance targets
- Validate all work against standards
- Final approval before progression

### Opus Responsibilities
- Creative solutions within constraints
- User experience design
- Business logic implementation
- Feature possibilities exploration

### Collaboration Pattern
```
Codex: "Here are requirements and constraints"
   ↓
Opus: "Here are creative solutions within bounds"
   ↓
Codex: "Validated - all standards met"
```

## 🔧 Commands & Tools

### Available Slash Commands (for Claude)
- `/build-feature` - Start feature workflow
- `/check-project` - Load project context
- `/codex-orchestrator` - Activate orchestration mode
- `/finalize-feature` - Complete feature
- `/fast-mode` - Toggle quick development

### Key Scripts
- `node utils/complexity-detector.js` - Analyze complexity
- `node agents/master-orchestrator.js` - Generate execution plan
- `node testing-framework/agents/codex-reviewer.js` - Security review

## 📝 CRITICAL: Terminology & Naming Conventions

### Use These Terms:
- **Brief** (NOT Epic) - The vision document
- **Spec** (NOT Story) - Technical specifications
- **Blueprint** (NOT Task) - Implementation units

### Agent Naming:
- **Agent 1** - First agent (could be Gemini for testing)
- **Agent 2** - Second agent
- **Agent 3** - Third agent
- **Agent 4** - Fourth agent
- **Agent 5** - Fifth agent
- Use clear numbering, not generic "Agent" without a number

### Copy-Paste Rules:
- **NEVER** use "same as above" - Each prompt must be self-contained
- **ALWAYS** include full context in each prompt
- **ALWAYS** use separator blocks (====)
- **ENFORCE** 3-5 line return format

## 📚 Repository Guidelines

### Build Commands
- `npm install` - Initial setup
- `npm test` - Run test suite
- `npm run lint` - ESLint check
- `npm run typecheck` - TypeScript validation
- `npm run framework:validate` - Full validation

### Coding Standards
- TypeScript strict mode
- 2-space indentation
- camelCase variables
- PascalCase components
- snake_case SQL

### Testing Requirements
- TDD for complex features
- 85% coverage minimum
- Integration tests for APIs
- E2E for critical flows
- Performance benchmarks

### Security Requirements
- All secrets in `.env.local`
- RLS on all tables
- Auth verification
- Input validation
- Error handling

## 💡 Tips for Effective Orchestration

1. **Start with context** - Always read briefs/specs first
2. **Evidence over assumptions** - "Show me" not "trust me"
3. **Batch wisely** - Parallel where possible, sequential where necessary
4. **Document everything** - Decisions, blockers, evidence
5. **Maintain the thread** - Every action traces to the brief
6. **Quality first** - Security/performance baked in, not bolted on
7. **Human in the loop** - Copy-paste prompts maintain control

---

Use this orchestrator mode when managing complex features. For simple fixes or single-file changes, direct implementation may be more appropriate.
