# Dev Framework - Quick Start

> **Read this first. It's 100 lines. The other docs are optional.**

---

## What This Framework Does

1. **Enforces TDD** - Tests before code for complex features
2. **Tracks state** - Knows where you left off between sessions
3. **Reviews code** - Security + performance checks at checkpoints
4. **Prevents spaghetti** - Consistent patterns across features

---

## The 4 Phases

Every feature goes through 4 phases. You cannot skip phases.

```
DISCOVER → DESIGN → BUILD → FINALIZE
```

| Phase | What Happens | Output |
|-------|--------------|--------|
| DISCOVER | Define what to build | Brief (requirements) |
| DESIGN | Plan how to build it | Spec (architecture + tests) |
| BUILD | Write tests, then code | Working feature |
| FINALIZE | Review and cleanup | Deployed feature |

---

## Starting a Feature

### Use /build-feature (Recommended)
```
/build-feature
```
This triggers the full workflow with all checkpoints.

### Or use /start-feature for manual control
```
/start-feature "Add student enrollment feature"
```

---

## Check Current Status

```
/status
```

Shows:
- Current phase
- What's completed
- What's needed next
- Pending checkpoints

---

## The Workflow

### Phase 1: DISCOVER
1. Claude asks discovery questions (15-20 questions)
2. You answer them
3. Claude creates a brief
4. Codex reviews the brief
5. You approve or refine

### Phase 2: DESIGN
1. Claude creates technical spec
2. Claude creates test strategy
3. Codex reviews for over/under-engineering
4. You approve architecture

### Phase 3: BUILD
1. Claude writes failing tests (RED)
2. Claude implements to pass tests (GREEN)
3. Codex reviews at checkpoints:
   - After migrations
   - After API routes
   - After UI components
4. Claude refactors if needed (REFACTOR)

### Phase 4: FINALIZE
1. Final security + performance review
2. Documentation updated
3. Feature marked complete

---

## Key Files

| File | Purpose |
|------|---------|
| `.claude/PROJECT_CONTEXT.md` | Your project's conventions (copy template) |
| `.dev-framework/state/active-feature.json` | Current feature state |
| `lib/claude-orchestrator.js` | Phase tracking |
| `lib/code-reviewer.js` | Code reviews (Codex or fallback) |

---

## For Your Project

1. **Copy the template:**
   ```bash
   cp .claude/templates/PROJECT_CONTEXT.md YOUR_PROJECT/.claude/PROJECT_CONTEXT.md
   ```

2. **Fill in your conventions:**
   - Table naming
   - Role hierarchy
   - API patterns
   - Common mistakes

3. **Start building:**
   ```
   /build-feature
   ```

---

## Simple vs Complex Features

The framework auto-detects complexity:

| Complexity | What Happens |
|------------|--------------|
| **Trivial** (typo fix) | Direct fix, no workflow |
| **Simple** (single file) | Light workflow, integration tests only |
| **Moderate** (multi-file) | Full workflow, unit + integration tests |
| **Complex** (new workflow) | Full workflow + E2E tests |
| **Critical** (auth/payment) | Full workflow + security tests |

---

## Code Review Checkpoints

Codex (or fallback) reviews at:

1. **Brief** - Is this well-defined?
2. **Spec** - Is architecture appropriate?
3. **Migrations** - RLS correct? Indexes present?
4. **API routes** - Auth checked? Errors handled?
5. **UI components** - Accessible? Performant?
6. **Final** - Ready for production?

---

## When Things Go Wrong

### "No active feature"
```
/start-feature "description"
```

### "Codex CLI not found"
The fallback static analysis runs automatically. For better reviews, install Codex CLI.

### "Cannot advance phase"
Check what's missing:
```
/status
```

### Lost context between sessions
State is persisted. Just run:
```
/status
```

---

## Performance Targets

Every feature must meet:

| Metric | Target |
|--------|--------|
| API response | < 200ms P95 |
| DB query | < 100ms |
| No N+1 queries | Verified by review |
| RLS policies | On every table |

---

## That's It

The framework handles the rest. Start with `/build-feature` and follow the prompts.

For deeper docs:
- `WORKFLOW-PHASES-GUIDE.md` - Detailed phase info
- `CODEX-CHECKPOINT-GUIDE.md` - Checkpoint details
- `FUNCTION_SIGNATURE_STANDARDS.md` - Code conventions
