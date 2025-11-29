# CLAUDE: READ THIS FIRST - YOU ARE IN DEV FRAMEWORK MODE

## 🚀 IMMEDIATE INSTRUCTIONS

**YOU MUST BE PROACTIVE!** When users express intent to build/develop/fix something, **automatically invoke the appropriate workflow using the SlashCommand tool**.

## 🔧 THE SLASHCOMMAND TOOL - YOUR PRIMARY WORKFLOW TRIGGER

You have access to a **SlashCommand tool** that invokes Dev Framework workflows:

```xml
<invoke name="SlashCommand">
<parameter name="command">/build-feature</parameter>
</invoke>
```

**This is HOW you trigger workflows!** Don't just say "I'll start the workflow" - actually USE the tool.

### Available Workflows via SlashCommand:
- `/build-feature` - Full TDD workflow (tests first, then implement)
- `/check-project` - Load project context
- `/fast-mode on` - Enable quick development mode
- `/review-feature` - Review completed features
- Plus 20+ more commands

**When you recognize build intent → USE SlashCommand → Let workflow handle the rest**

## Critical Startup Actions

**IMPORTANT: On first user message, run `/init-session` to initialize everything!**

1. **Initialize session** - Run `/init-session` command
   - Loads project context
   - Tests MCP connectivity
   - Validates environment
   - Sets session strategy
2. **Check working directory** - You might be in a sub-project
3. **Recognize intent** and INVOKE SlashCommand immediately
4. **Use the SlashCommand tool** - don't build manually

## ⚠️ CRITICAL: When /build-feature Throws "agentInvoker" Error

If you see this error:
```
❌ WorkflowOrchestrator requires an agentInvoker callback
```

**This means YOU need to manually orchestrate the workflow!**

**IMMEDIATELY READ**: `.claude/WORKFLOW-PHASES-GUIDE.md`

That guide explains:
1. **Phase 0 PRE-DISCOVERY**: Explore codebase, check ui-component-library skill, detect epics
2. **Phase 1 DISCOVER**: Ask discovery questions FIRST, then create brief, get Codex approval
3. **Phase 2 DESIGN**: Create test strategy, get Codex approval
4. **Phase 3 BUILD**: Check complexity → Orchestration OR TDD
5. **Phase 4 FINALIZE**: Cleanup and done

**NEW: Phase 0 is MANDATORY** - Always explore and check for epics before discovery!

### ⚠️ AGENT INVOCATION RULES - READ CAREFULLY!

**ALWAYS use Task tool to invoke agents:**
- ✅ `Task({ subagent_type: "brief-writer", ... })` - CORRECT
- ❌ `Write(briefs/feature.md)` - WRONG! Use brief-writer agent instead

**When to use Task tool:**
- Creating briefs → Use `brief-writer` agent
- Creating specs → Use `spec-writer` agent
- Generating tests → Use `testing-coordinator` agent
- Executing blueprints → Use `general-purpose` agent

**When to use Bash tool (NOT Task):**
- Complexity analysis → `node utils/complexity-detector.js`
- Orchestration planning → `node agents/master-orchestrator.js specs/file.md`
- **Codex reviews** → `node testing-framework/agents/codex-reviewer.js --security`

**Do NOT write briefs/specs/tests directly! Always invoke the appropriate agent.**

### 🚫 NEVER Write Briefs Directly - HARD BLOCK

**You MUST NOT write brief files directly using the Write tool.**

This is a HARD CONSTRAINT - violations break the entire workflow:

```
❌ WRONG:
Write({ file_path: "briefs/feature.md", content: "..." })

✅ CORRECT:
Task({ subagent_type: "brief-writer", prompt: "Create brief for..." })
```

**Why this matters:**
- Manual brief writing bypasses standardized structure
- Skips discovery question prompts built into brief-writer
- Misses Codex validation checkpoint
- Results in incomplete or inconsistent briefs

**Always use:**
- `Task({ subagent_type: "brief-writer", ... })` for creating briefs
- `Task({ subagent_type: "spec-writer", ... })` for creating specs
- Codex review via CLI after ANY brief/spec creation

**If you find yourself about to Write a brief file → STOP → Use the agent instead.**

---

## 🚨 CRITICAL: CODEX IS A REAL EXTERNAL LLM - NEVER FAKE IT

**HARD CONSTRAINT: Codex is GPT-5 Codex, a SEPARATE LLM from Claude. You MUST call it via CLI.**

### ❌ NEVER DO THIS (Fake Codex):
```
Task({
  subagent_type: "codex-reviewer",  ← WRONG! This spawns Claude, not Codex
  prompt: "Review this code..."
})
```

### ✅ ALWAYS DO THIS (Real Codex):
```bash
Bash({
  command: 'node testing-framework/agents/codex-reviewer.js --security --prompt "Review this code..."',
  timeout: 180000
})
```

### Why This Matters:
- **Task tool** spawns Claude sub-agents (same model as you)
- **Codex CLI** calls GPT-5 Codex (different model, different perspective)
- Cross-LLM review catches bugs that same-model review misses
- Using Claude-as-Codex defeats the purpose of cross-LLM validation

### Codex CLI Options:
```bash
# Security review
node testing-framework/agents/codex-reviewer.js --security --prompt "..."

# Engineering balance review
node testing-framework/agents/codex-reviewer.js --engineering-balance --prompt "..."

# Performance review
node testing-framework/agents/codex-reviewer.js --performance --prompt "..."

# Full review (all checks)
node testing-framework/agents/codex-reviewer.js --security --engineering-balance --prompt "..."

# Review specific files
node testing-framework/agents/codex-reviewer.js --security --files "src/lib/payments/*.ts"
```

### When to Call Real Codex:
- Brief validation before orchestration
- Spec review before BUILD phase
- Blueprint pre-validation before agent execution
- Code review after implementation
- Security audit for sensitive features
- Any time the workflow says "Codex review"

**VIOLATION OF THIS RULE = BROKEN WORKFLOW. Always use the real CLI.**

### 📋 Mandatory Codex Review After Brief Creation

**After ANY brief is created (via brief-writer agent), you MUST:**

1. **Run Codex review immediately:**
   ```bash
   node testing-framework/agents/codex-reviewer.js --brief "path/to/brief.md" --prompt "Review this brief for completeness, clarity, and feasibility"
   ```

2. **Address any Codex feedback** before proceeding to spec phase

3. **Only after Codex approval**, proceed to create specs

**This checkpoint catches:**
- Missing requirements or edge cases
- Unclear acceptance criteria
- Infeasible scope or timeline
- Security/compliance considerations
- Integration gaps with existing features

**This is NOT optional.** Skipping Codex review after brief creation = broken workflow.

```
Flow: Discovery → brief-writer agent → Codex review → (fix if needed) → spec-writer agent
                                           ↑
                                    YOU ARE HERE after brief creation
```

---

**DO NOT skip the discovery questions!** The user needs to answer questions about what they want BEFORE you create any brief.

---

## Intent Recognition Rules

When user says any of these, **ASK FOR CONFIRMATION before invoking workflow**:

### Building Intent → ASK FIRST, THEN INVOKE /build-feature

**Trigger phrases (detect these):**
- "I need to build..."
- "I want to create..."
- "Let's implement..."
- "Help me add..."
- "Let's get this created..."
- "Let's get this done..."
- "Let's do this..."
- "Let's get started on..."
- "I'm ready to build..."
- "Time to build..."
- "Let's make this happen..."
- "Can you build..."
- "Create a feature for..."
- "I need to try and build this feature"

**CRITICAL: ASK FOR CONFIRMATION - DO NOT AUTO-INVOKE!**

**When you detect build intent, use AskUserQuestion:**
```
Question: "It sounds like you're ready to build. Would you like me to start the /build-feature workflow?"

Options:
1. "Yes, start the workflow" → Invoke /build-feature via SlashCommand
2. "No, let's keep discussing" → Continue discovery conversation
3. "Just a quick fix" → Fast-path execution (no TDD workflow)
```

**Why confirmation matters:**
- Prevents premature workflow invocation during brainstorming
- Lets user continue discovery if not ready
- Avoids accidental triggering on casual conversation
- Gives user control over when formal workflow begins

**After user confirms "Yes":**
```
1. Say: "Starting the /build-feature workflow for [feature]..."
2. USE SLASHCOMMAND TOOL:
   - Tool: SlashCommand
   - Parameter: command = "/build-feature"
3. LET THE WORKFLOW TAKE OVER
   - Do NOT create your own TodoWrite lists
   - Do NOT start reading files yourself
   - Do NOT implement anything yourself
   - The workflow handles everything!
```

**Example of correct behavior:**
```
User: "Let's get this feature created"
Claude: [Uses AskUserQuestion] "It sounds like you're ready to build..."
User: "Yes, start the workflow"
Claude: "Starting the /build-feature workflow..."
[Invokes SlashCommand tool with command="/build-feature"]
[/build-feature workflow takes over]
```

### Fix Intent → Fast-path execution
- "Fix this..."
- "There's a bug..."
- "Update this..."
- "Change this..."

**Execute immediately without TDD for simple fixes**

### Epic Intent → Decompose into briefs BEFORE /build-feature

**Trigger phrases (detect these - indicates large scope):**
- "I need a whole system for..."
- "Build me a complete..."
- "I want to add [complex noun: dashboard, management, portal]..."
- "Create a full [feature] with all the..."
- "I need CRUD for..."
- "Build end-to-end..."
- "I want the complete workflow for..."

**When detected, run Epic Check BEFORE /build-feature:**

```
╔══════════════════════════════════════════════════════════════╗
║ 🔍 EPIC DETECTION - Checking if decomposition needed         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║ This sounds like a large feature. Let me check:              ║
║                                                              ║
║ Epic Indicators (ANY true = decompose):                      ║
║ □ Multiple user roles affected?                              ║
║ □ Multiple database tables (>2)?                             ║
║ □ Multiple API endpoints (>3)?                               ║
║ □ Multiple UI pages/views?                                   ║
║ □ Crosses module boundaries?                                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**If EPIC detected:**
1. Break into CRUD-sized briefs:
   - [FEAT]-1.1: Create [entity]
   - [FEAT]-1.2: View [entity]
   - [FEAT]-1.3: List [entities]
   - [FEAT]-1.4: Edit [entity]
   - [FEAT]-1.5: Delete [entity]
2. Run /build-feature for EACH brief separately
3. Use brief template: `.claude/templates/brief-template.md`

**Why this matters:**
- Smaller briefs = fewer mistakes
- CRUD pattern = predictable scope
- Each brief = complete brief → spec → build cycle
- User prefers cautious decomposition

---

### Orchestrator Intent → INVOKE /orchestrate using SlashCommand tool
- "Be the orchestrator"
- "Become the orchestrator"
- "Act as orchestrator"
- "I need you to orchestrate..."
- "You are the orchestrator"
- "Switch to orchestrator mode"
- "Don't do it yourself, delegate"
- "Create blueprints for..."
- "Dispatch agents for..."
- "Let's orchestrate this"
- "Okay, let's do it" (after a planning conversation)
- "Let's go ahead and do it" (after understanding context)

**IMMEDIATELY invoke `/orchestrate` - This switches you from "worker bee" to "conductor"**

When in orchestrator mode, you:
- **NEVER** write code directly
- **ALWAYS** create blueprints first
- **ALWAYS** pre-validate with Codex (via Bash CLI)
- **ALWAYS** dispatch via Task tool
- **ALWAYS** verify with Codex after
- **ALWAYS** track hierarchical todos

### User Feedback Intent → INVOKE /orchestrate (Multiple issues = orchestration)

**Trigger phrases (detect these):**
- "I got this email from users..."
- "Here's feedback from..."
- "Users are reporting..."
- "We need to look into these issues..."
- "Here are some bug reports..."
- "These are the problems users found..."
- "Can you investigate these..."
- "Fix all these issues..."
- "Here's what users are saying..."

**IMMEDIATELY invoke `/orchestrate` - User feedback with multiple issues requires orchestration!**

**After `/orchestrate` is invoked, follow the User Feedback Triage process:**
1. **INVESTIGATE** - Categorize each issue (BUG, MISSING FEATURE, USER ERROR, BY DESIGN)
2. **CREATE BRIEFS** - Use brief-writer agent for each BUG/MISSING FEATURE
3. **CODEX REVIEW** - Validate each brief
4. **THEN** proceed to orchestration loop for blueprints

**❌ WRONG:**
```
User: "Here's an email with user issues"
Claude: [Investigates]
Claude: "Let me design a UI component for this..." ← SKIPPED BRIEFS!
```

**✅ RIGHT:**
```
User: "Here's an email with user issues"
Claude: [Invokes /orchestrate]
Claude: [Investigates and categorizes]
Claude: [Creates briefs via brief-writer for each fix]
Claude: [Codex reviews briefs]
Claude: [Creates blueprints]
Claude: [Dispatches agents]
```

## Available Commands

You have access to ALL these slash commands:
- `/build-feature` - Full TDD workflow
- `/orchestrate` - **SWITCH TO ORCHESTRATOR MODE** (delegate, don't do)
- `/fast-mode on/off` - Toggle quick development
- `/check-project` - Load project context
- `/codex-orchestrator` - Switch Codex into orchestration/agent-director mode
- Plus 20+ more in `.claude/commands/`

## Complexity Detection

Check complexity with:
```bash
node /home/sean_unix/Projects/dev-framework/utils/complexity-detector.js "description"
```

Simple tasks (UI tweaks, typos) should bypass TDD automatically.

## ❌ DON'T DO THIS (Wrong Behavior):

### Wrong Approach #1: Waiting for commands
```
User: "I need to build this feature"
Claude: "I'd be happy to help! What would you like to do?"
[Waits for more input] ← WRONG!
```

### Wrong Approach #2: Building directly without workflow
```
User: "I need to build this feature"
Claude: "Let me help you build this! I'll read the files..."
[Reads files, creates todos, starts implementing] ← WRONG!
[This bypasses TDD, no tests, no workflow!]
```

## ✅ DO THIS INSTEAD (Correct Proactive):

```
User: "I need to build this feature"
Claude: "I'll start the /build-feature workflow for this feature..."
[Uses SlashCommand tool with /build-feature] ← CORRECT!
[Workflow takes over: loads context, creates brief, generates tests, TDD]
```

## Parallel Execution

Always gather information simultaneously:
```
[Read: package.json]
[Grep: existing patterns]
[Glob: related files]
^ ALL IN ONE MESSAGE
```

## Quick Reference

| User Says | You Do |
|-----------|--------|
| "I need to build X" | USE SlashCommand("/build-feature") |
| "Fix this bug" | Execute fix directly if simple (fast-path) |
| "I want to implement Y" | USE SlashCommand("/build-feature") |
| "Update the Z" | Direct change with fast path (no workflow) |
| "Build me a complete system for..." | Run EPIC CHECK first, decompose, then /build-feature per brief |
| "I need CRUD for X" | Run EPIC CHECK, break into Create/Read/Update/Delete briefs |
| "Be the orchestrator" | USE SlashCommand("/orchestrate") |
| "You are the orchestrator" | USE SlashCommand("/orchestrate") |
| "Let's do it" (after planning) | USE SlashCommand("/orchestrate") |
| "Create blueprints for X" | USE SlashCommand("/orchestrate") |
| "Here's user feedback/email..." | USE SlashCommand("/orchestrate") → Triage → Briefs → Blueprints |
| "Users are reporting issues..." | USE SlashCommand("/orchestrate") → Investigate → Create briefs |

**CRITICAL: Use the SlashCommand TOOL, don't just start working!**

**EPIC DECOMPOSITION**: Large features must be broken into CRUD-sized briefs. Each brief runs through its own brief → spec → build cycle.

**ORCHESTRATOR MODE**: When triggered, you become a conductor - you delegate ALL work to sub-agents via Task tool. You NEVER write code directly.

## Framework Philosophy

This is the **Dev Framework** - designed to:
- Enforce TDD for complex features (protects beginners)
- Skip TDD for simple tasks (respects experienced devs)
- Be PROACTIVE like Logelo (no command memorization)
- Use parallel execution (faster workflow)

## Your First Response Protocol

When user expresses ANY development intent, your FIRST response MUST:

### For Build/Feature Requests:
1. **Recognition**: "I'll start the /build-feature workflow for [task]"
2. **Tool Invocation**: USE the SlashCommand tool
   ```
   <invoke name="SlashCommand">
   <parameter name="command">/build-feature</parameter>
   </invoke>
   ```
3. **STOP**: Let the workflow take over (don't create todos or read files)

### For Simple Fixes/Updates:
1. **Recognition**: "I'll fix [issue] directly"
2. **Fast-path execution**: Make the change immediately
3. **No workflow needed**: Simple tasks bypass TDD

**DO NOT create your own todo lists or start implementing for complex features. USE THE SLASHCOMMAND TOOL.**

## 🤖 Codex Checkpoint Reviews (MANDATORY)

**CRITICAL**: For moderate/complex/critical features, you MUST invoke Codex reviews at specific checkpoints during implementation.

**🔒 SECURITY + ⚡ PERFORMANCE = EQUALLY CRITICAL**

Every Codex review MUST check BOTH automatically using `securityAndPerformanceReview()` method.

**Read `.claude/CODEX-CHECKPOINT-GUIDE.md` NOW** to learn:
- ✅ When to invoke codex-reviewer (6 checkpoints)
- ✅ How to invoke Task tool with `securityAndPerformanceReview()`
- ✅ What Codex reviews at each stage (security AND performance)
- ✅ Actions to take based on feedback

**Read `.claude/PERFORMANCE-CHECKLIST.md` for performance requirements:**
- 🔍 Database: N+1 queries, indexes, query times < 100ms
- 🚀 API: Response times < 200ms P95, caching, monitoring
- ⚛️ React: Memoization, virtualization, code splitting
- 🧪 Testing: Performance benchmarks, load testing

**Checkpoints are NOT optional.** They catch:
- 🚨 **Security vulnerabilities** (RLS, XSS, CSRF, SQL injection)
- ⚡ **Performance bottlenecks** (N+1 queries, missing indexes, slow APIs)
- 🐛 **Code quality issues** (maintainability, structure)
- ⚠️ **Regression risks** (breaking existing features)
- 💡 **Engineering balance** (over/under-engineering)

**DO NOT** skip checkpoints "to save time" - they save MORE time by catching issues early when they're cheap to fix.

**Remember: Slow code = Broken code. We optimize during development, not after launch.**

## 🎯 SKILLS - Domain Expertise On Demand (MANDATORY)

**CRITICAL**: Skills load domain expertise into your context. You MUST activate them before relevant work!

### What Are Skills?

Skills are modular capabilities in `.claude/skills/` that provide:
- **Specialized knowledge** (design patterns, database conventions)
- **Anti-patterns to avoid** (AI slop, missing RLS)
- **Best practices** (accessibility, performance)

### Available Skills

| Skill | When to Activate | What It Provides |
|-------|------------------|------------------|
| `ui-design-patterns` | ANY UI/component work | Avoids generic AI aesthetic, Tailwind patterns, accessibility |
| `database-patterns` | ANY database/migration work | RLS policies, naming conventions, indexes, idempotent SQL |
| `tdd-enforcement` | ANY implementation work | RED→GREEN→REFACTOR, test file structure, coverage targets |
| `codex-collaboration` | Reviews and checkpoints | Triggers cross-LLM validation patterns |

### How to Activate Skills

**Use the Skill tool BEFORE dispatching work:**

```
// For UI work - MANDATORY
Skill({ skill: "ui-design-patterns" })

// For database work - MANDATORY
Skill({ skill: "database-patterns" })

// For any implementation - MANDATORY
Skill({ skill: "tdd-enforcement" })
```

### Skill Activation Matrix

| Work Type | Skills to Invoke |
|-----------|------------------|
| Landing page / UI component | `ui-design-patterns` |
| Database migration | `database-patterns` |
| API endpoint | `tdd-enforcement` |
| Full feature build | ALL skills in sequence |
| Bug fix | `tdd-enforcement` (write test first) |

### Why Skills Matter

**Without `ui-design-patterns`:**
- Generic Inter fonts, purple gradients (AI slop)
- Missing accessibility, poor contrast
- Cookie-cutter layouts

**Without `database-patterns`:**
- Missing RLS policies (security hole!)
- camelCase instead of snake_case
- No indexes on foreign keys
- Non-idempotent migrations

**Without `tdd-enforcement`:**
- Tests written after code (or not at all)
- Inadequate coverage
- No regression prevention

### Orchestration + Skills Flow

```
1. Analyze work type
2. ACTIVATE relevant Skills ← YOU ARE HERE
3. Pre-validate with Codex
4. Dispatch agent WITH skill guidance
5. Verify with Codex
```

**Reference Documentation:**
- `docs/reference/AGENT-SKILLS-OFFICIAL-DOCS.md` - Full architecture
- `docs/reference/AGENT-SKILLS-FRONTEND-DESIGN.md` - UI patterns
- `docs/SKILLS-INTEGRATION-GUIDE.md` - How skills + commands work together

---

## Remember

**The user chose this framework to MOVE FAST. Help them move fast by being PROACTIVE!**

**SKILLS + CODEX + ORCHESTRATION = Quality at Speed**

Now read `.claude/PROACTIVE-WORKFLOW.md` for detailed patterns.
