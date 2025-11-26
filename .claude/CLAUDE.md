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
- Code reviews → `node testing-framework/agents/codex-reviewer.js --security`

**Do NOT write briefs/specs/tests directly! Always invoke the appropriate agent.**

**DO NOT skip the discovery questions!** The user needs to answer questions about what they want BEFORE you create any brief.

---

## Intent Recognition Rules

When user says any of these, **USE THE SLASHCOMMAND TOOL IMMEDIATELY**:

### Building Intent → INVOKE /build-feature using SlashCommand tool
- "I need to build..."
- "I want to create..."
- "Let's implement..."
- "Help me add..."

**CRITICAL: USE THE SLASHCOMMAND TOOL - DO NOT BUILD DIRECTLY!**

### Fix Intent → Fast-path execution
- "Fix this..."
- "There's a bug..."
- "Update this..."
- "Change this..."

**Execute immediately without TDD for simple fixes**

## Available Commands

You have access to ALL these slash commands:
- `/build-feature` - Full TDD workflow
- `/fast-mode on/off` - Toggle quick development
- `/check-project` - Load project context
- `/codex-orchestrator` - Switch Codex into orchestration/agent-director mode
- Plus 20+ more in `.claude/commands/`

## Complexity Detection

Check complexity with:
```bash
node utils/complexity-detector.js "description"
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

**CRITICAL: Use the SlashCommand TOOL, don't just start working!**

## Framework Philosophy

This is the **Dev Framework** - designed to:
- Enforce TDD for complex features (protects beginners)
- Skip TDD for simple tasks (respects experienced devs)
- Be PROACTIVE like Logelo (no command memorization)
- Use parallel execution (faster workflow)

## 🤖 Codex Checkpoint Reviews (MANDATORY)

**CRITICAL**: For moderate/complex/critical features, you MUST invoke Codex reviews at specific checkpoints during implementation.

**🔒 SECURITY + ⚡ PERFORMANCE = EQUALLY CRITICAL**

Every Codex review MUST check BOTH automatically.

**Read `.claude/CODEX-CHECKPOINT-GUIDE.md` NOW** to learn:
- ✅ When to invoke codex-reviewer (6 checkpoints)
- ✅ What Codex reviews at each stage (security AND performance)
- ✅ Actions to take based on feedback

**Checkpoints are NOT optional.** They catch:
- 🚨 **Security vulnerabilities** (RLS, XSS, CSRF, SQL injection)
- ⚡ **Performance bottlenecks** (N+1 queries, missing indexes, slow APIs)
- 🐛 **Code quality issues** (maintainability, structure)
- ⚠️ **Regression risks** (breaking existing features)
- 💡 **Engineering balance** (over/under-engineering)

**Remember: Slow code = Broken code. We optimize during development, not after launch.**

## Remember

**The user chose this framework to MOVE FAST. Help them move fast by being PROACTIVE!**

Now read `.claude/PROACTIVE-WORKFLOW.md` for detailed patterns.
