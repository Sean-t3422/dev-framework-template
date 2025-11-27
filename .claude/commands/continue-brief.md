# Continue from Brief - Resume Orchestration

**Command**: `/continue-brief [brief-path]`

**Description**: Hand off an existing brief to the unified orchestrator. Skips Phase 1 (DISCOVER) and starts directly at Phase 2 (DESIGN). Use this when you've brainstormed with Codex/Claude separately and have a brief ready.

---

## Usage

### Option 1: With brief file path

```
/continue-brief briefs/active/my-feature.md
```

### Option 2: Interactive (finds briefs)

```
/continue-brief
```

This will list available briefs in `briefs/active/` for you to choose from.

### Option 3: With spec (skip to BUILD)

```
/continue-brief briefs/active/my-feature.md --start-phase BUILD --spec specs/active/my-feature.md
```

---

## What happens

1. **Validates brief** - Codex checks if brief is ready for orchestration
2. **Marks Phase 1 complete** - Discovery questions already answered
3. **Starts Phase 2 (DESIGN)** - Creates spec from your brief
4. **Continues through BUILD** - Generates blueprints, executes them
5. **Finishes with FINALIZE** - Tests, validation, cleanup

---

## Workflow for brainstorming → handoff

### Step 1: Brainstorm with Claude/Codex (separate session)

```
You: "I want to build a class waitlist feature"
Claude: "Let's think through this... [discusses options, tradeoffs]"
Claude: "Here's a comprehensive brief for this feature..."
[Writes brief to briefs/active/class-waitlist.md]
```

### Step 2: Hand off to orchestrator

```
/continue-brief briefs/active/class-waitlist.md
```

### What the orchestrator does

```
=== UNIFIED ORCHESTRATOR - Resuming from Brief ===
Session: session-1234567890-abc123
Start Phase: DESIGN
Brief: # Class Waitlist Feature...

Phase 1 (DISCOVER) - Using existing brief ✅

=== PHASE 2: DESIGN ===
  → Creating technical specification...
  [Task: spec-writer] Creating spec from brief
  → Codex reviewing design...
  [Task: codex-reviewer] Reviewing spec
  ✅ Design approved by Codex

=== Complexity Analysis ===
  Blueprints: 6
  Layers: 3
  Estimated time: 42 minutes

=== PHASE 3: BUILD ===
  Layer 1/3: [bp-01, bp-02]
    [Task: codex-reviewer] PRE-validating blueprint...
    [Task: general-purpose] Executing blueprint...
    ...

=== PHASE 4: FINALIZE ===
  ✅ All tests passing
  ✅ Feature complete!
```

---

## Brief requirements for handoff

For a brief to be ready for orchestration, it should include:

1. **Clear requirements** - What the user needs
2. **Scope boundaries** - What's in/out
3. **Security considerations** - Auth, RLS, data isolation
4. **Success criteria** - How we know it's done
5. **Technical approach** - Implementation path (optional but helpful)

### Example brief structure

```markdown
# Feature: Class Waitlist

## The Ask
Allow families to join waitlists for full classes and receive offers when spots open.

## Requirements
- Parents can join waitlist for any full class
- Admins can view waitlist positions per class
- Auto-offer spots when enrollment drops below capacity
- 48-hour expiration on offers
- Notifications via email and in-app

## Security
- RLS: Parents only see their own waitlist entries
- RLS: Admins see all waitlist entries for their co-op
- No cross-co-op data access

## Out of Scope
- Priority ordering (future)
- Sibling priority (future)

## Success Criteria
- [ ] Parents can join/leave waitlists
- [ ] Admins can view/manage waitlists
- [ ] Offers auto-generated when spots open
- [ ] Offer expiration enforced
- [ ] All tests passing
```

---

## Validation before handoff

If you want to check if a brief is ready:

```
/validate-brief briefs/active/my-feature.md
```

This runs Codex validation without starting the full orchestration.

---

## Options

| Option | Description |
|--------|-------------|
| `--start-phase DESIGN` | Start at DESIGN phase (default) |
| `--start-phase BUILD` | Start at BUILD phase (requires --spec) |
| `--spec <path>` | Use existing spec (for --start-phase BUILD) |
| `--validate-only` | Just validate, don't start orchestration |

---

## Error handling

### "Brief needs more detail"

Codex validation found gaps. Review the feedback and add:
- Missing requirements
- Security considerations
- Success criteria

### "Could not read brief file"

Check the file path. Brief should be in:
- `briefs/active/` for active features
- `briefs/backlog/` for future features

### "startPhase is BUILD but no existingSpec provided"

If starting at BUILD phase, you must also provide the spec:
```
/continue-brief brief.md --start-phase BUILD --spec spec.md
```

---

## Integration with workflow

```
┌─────────────────────────────────────────────────────┐
│  Brainstorming Session (separate)                   │
│                                                     │
│  You + Claude/Codex discuss feature                 │
│  → Claude writes brief                              │
│  → Saved to briefs/active/feature.md               │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  /continue-brief briefs/active/feature.md          │
│                                                     │
│  Orchestrator takes over:                           │
│  → Validates brief (Codex)                         │
│  → Creates spec (spec-writer agent)                │
│  → Reviews spec (Codex)                            │
│  → Generates blueprints (master-orchestrator)      │
│  → Executes blueprints (general-purpose agents)    │
│  → Verifies each (Codex)                           │
│  → Finalizes feature                               │
└─────────────────────────────────────────────────────┘
```

---

**Last Updated**: 2025-11-26
**Status**: Integrated with unified orchestrator
