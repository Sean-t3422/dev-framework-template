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
- `/orchestrate` - **SWITCH TO ORCHESTRATOR MODE** (delegate, don't do)
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
1. **Phase 1 DISCOVER**: Ask discovery questions FIRST, then create brief, get Codex approval
2. **Phase 2 DESIGN**: Create test strategy, get Codex approval
3. **Phase 3 BUILD**: Check complexity → Orchestration OR TDD
4. **Phase 4 FINALIZE**: Cleanup and done

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

---

**DO NOT skip the discovery questions!** The user needs to answer questions about what they want BEFORE you create any brief.

---

## Intent Recognition Rules

When user says any of these, **USE THE SLASHCOMMAND TOOL IMMEDIATELY**:

### Building Intent → INVOKE /build-feature using SlashCommand tool
- "I need to build..."
- "I want to create..."
- "Let's implement..."
- "Help me add..."
- "I need to try and build this feature"

**CRITICAL: USE THE SLASHCOMMAND TOOL - DO NOT BUILD DIRECTLY!**

### Fix Intent → Fast-path execution
- "Fix this..."
- "There's a bug..."
- "Update this..."
- "Change this..."

**Execute immediately without TDD for simple fixes**

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

## Available Commands

You have access to ALL these slash commands:
- `/build-feature` - Full TDD workflow
- `/orchestrate` - **SWITCH TO ORCHESTRATOR MODE** (delegate, don't do)
- `/fast-mode on/off` - Toggle quick development
- `/check-project` - Load project context
- `/status` - Show current workflow status
- Plus 20+ more in `.claude/commands/`

## Complexity Detection

Check complexity with:
```bash
node utils/complexity-detector.js "description"
```

Simple tasks (UI tweaks, typos) should bypass TDD automatically.

## Quick Reference

| User Says | You Do |
|-----------|--------|
| "I need to build X" | USE SlashCommand("/build-feature") |
| "Fix this bug" | Execute fix directly if simple (fast-path) |
| "I want to implement Y" | USE SlashCommand("/build-feature") |
| "Update the Z" | Direct change with fast path (no workflow) |
| "Be the orchestrator" | USE SlashCommand("/orchestrate") |
| "You are the orchestrator" | USE SlashCommand("/orchestrate") |
| "Let's do it" (after planning) | USE SlashCommand("/orchestrate") |
| "Create blueprints for X" | USE SlashCommand("/orchestrate") |

**CRITICAL: Use the SlashCommand TOOL, don't just start working!**

**ORCHESTRATOR MODE**: When triggered, you become a conductor - you delegate ALL work to sub-agents via Task tool. You NEVER write code directly.

## Framework Philosophy

This is the **Dev Framework** - designed to:
- Enforce TDD for complex features (protects beginners)
- Skip TDD for simple tasks (respects experienced devs)
- Be PROACTIVE (no command memorization)
- Use parallel execution (faster workflow)
- Enable orchestration mode (delegate to sub-agents)

## 🤖 Codex Checkpoint Reviews (MANDATORY)

**CRITICAL**: For moderate/complex/critical features, you MUST invoke Codex reviews at specific checkpoints during implementation.

**🔒 SECURITY + ⚡ PERFORMANCE = EQUALLY CRITICAL**

Every Codex review MUST check BOTH automatically.

**Read `.claude/CODEX-CHECKPOINT-GUIDE.md` NOW** to learn:
- ✅ When to invoke codex-reviewer (6 checkpoints)
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

## Remember

**The user chose this framework to MOVE FAST. Help them move fast by being PROACTIVE!**

Now read `.claude/PROACTIVE-WORKFLOW.md` for detailed patterns.
