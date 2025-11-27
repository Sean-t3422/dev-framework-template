# Simplified Architecture Reference

> **This file documents the new simplified architecture created to fix the framework.**
> **Add this to CLAUDE.md or reference it when the old patterns fail.**

---

## The Problem We Fixed

The old architecture had:
1. **Multiple orchestrators** that couldn't invoke agents (agentInvoker error)
2. **Silent approval** when Codex wasn't installed
3. **No state persistence** between sessions
4. **Missing documentation** (FUNCTION_SIGNATURE_STANDARDS.md, PROJECT_CONTEXT.md)

---

## The New Architecture

### Key Principle
**Claude Code IS the orchestrator.** JS files are helpers, not drivers.

### New Files Created
```
lib/
├── claude-orchestrator.js   # Phase tracking + state management
├── state-manager.js         # Persistent state across sessions
├── code-reviewer.js         # Codex + fallback (never silently approves)
└── codex-fallback.js        # Static analysis when Codex unavailable

.claude/
├── templates/
│   └── PROJECT_CONTEXT.md   # Template for project conventions
├── FUNCTION_SIGNATURE_STANDARDS.md  # Code conventions
└── SIMPLIFIED_ARCHITECTURE.md       # This file

QUICK_START.md               # 100-line getting started guide
```

---

## How to Use the New System

### 1. Check Current State
```
/status
```

### 2. Start a Feature
```
/start-feature "Feature description"
```
Or use `/build-feature` for the full guided workflow.

### 3. Follow the Phases
```
DISCOVER → DESIGN → BUILD → FINALIZE
```

Each phase has required actions and checkpoints.

### 4. Run Code Reviews
```
/review-code path/to/code.ts security-and-performance
```

### 5. Record Progress
```
# After completing a checkpoint
/checkpoint checkpoint_name approved

# Advance to next phase
/advance-phase
```

---

## When /build-feature Fails

If SlashCommand throws "agentInvoker" error:

1. **Don't panic** - this is expected
2. **Start manually**:
   ```
   /start-feature "Feature description"
   ```
3. **Follow phases manually** using Task tool for agents
4. **Track state** with `/status` command

---

## Code Review Fallback

The new `lib/code-reviewer.js`:
- Tries Codex CLI first
- Falls back to static analysis if unavailable
- **Never silently approves**
- Actually checks for:
  - SQL injection, XSS, CSRF
  - N+1 queries, missing indexes
  - Console statements, hardcoded secrets
  - Missing error handling

---

## Project Context

Before starting features, ensure project has context file:

```bash
# Check if exists
ls YOUR_PROJECT/.claude/PROJECT_CONTEXT.md

# If not, copy template
cp .claude/templates/PROJECT_CONTEXT.md YOUR_PROJECT/.claude/PROJECT_CONTEXT.md
```

Fill in:
- Table naming conventions
- Role hierarchy
- Entity relationships
- Common mistakes

---

## State Persistence

State is saved to `.dev-framework/state/`:
- `active-feature.json` - Current feature state
- `history/` - Completed features
- `{featureId}-brief.json` - Saved briefs
- `{featureId}-spec.json` - Saved specs

This means:
- Sessions can resume where they left off
- Context is preserved across crashes
- Progress is tracked

---

## The 4 Phases (Quick Reference)

### DISCOVER
- Ask discovery questions
- Create brief (brief-writer agent)
- Review brief
- Checkpoint: `brief_review`

### DESIGN
- Create spec (spec-writer agent)
- Create test strategy
- Review spec
- Checkpoint: `spec_review`

### BUILD
- Check complexity
- Write tests (TDD red)
- Implement (TDD green)
- Review at checkpoints
- Track with TDD compliance script

### FINALIZE
- Final review
- Checkpoint: `final_review`
- Complete feature

---

## Commands Summary

### Slash Commands (User-Facing)
```
# State management
/status                    # Check current state
/start-feature "desc"      # Start new feature
/advance-phase             # Move to next phase
/checkpoint name approved  # Record checkpoint

# Code review
/review-code path/to/file.ts security-and-performance

# Full workflow
/build-feature             # Guided TDD workflow
```

### Internal Scripts (Used by Claude)
```bash
# TDD compliance (internal)
node scripts/check-tdd-compliance.js --status
node scripts/check-tdd-compliance.js --test-run

# Complexity analysis (internal)
node utils/complexity-detector.js "feature description"
```
