# Advance Phase

**Command**: `/advance-phase`

**Purpose**: Move to the next workflow phase after completing current phase requirements.

---

## What This Command Does

1. Check if transition is allowed:

```bash
node lib/claude-orchestrator.js status
```

2. If allowed, advance:

```bash
node lib/claude-orchestrator.js advance
```

3. Report result to user.

---

## Phase Transitions

```
DISCOVER → DESIGN → BUILD → FINALIZE
```

### DISCOVER → DESIGN
**Requirements:**
- Brief created (brief-writer agent)
- Brief reviewed (checkpoint: brief_review)

### DESIGN → BUILD
**Requirements:**
- Spec created (spec-writer agent)
- Test strategy defined
- Spec reviewed (checkpoint: spec_review)

### BUILD → FINALIZE
**Requirements:**
- Tests written and passing
- Implementation complete
- All build checkpoints passed

### FINALIZE → Complete
**Requirements:**
- Final review passed (checkpoint: final_review)

---

## Success Output

```
✅ PHASE ADVANCED
═══════════════════════════════════════

Previous: [phase]
Current: [new phase]

Next Steps:
[Phase-specific next actions]

═══════════════════════════════════════
```

---

## Blocked Output

```
⛔ CANNOT ADVANCE PHASE
═══════════════════════════════════════

Current Phase: [phase]
Target Phase: [next phase]

Blocking Issues:
- [Missing requirement 1]
- [Missing requirement 2]

Required Actions:
1. [What to do]
2. [What to do]

═══════════════════════════════════════
```

---

## Related Commands

- `/status` - Check current status
- `/checkpoint` - Record review checkpoints
- `/review-code` - Run code review
