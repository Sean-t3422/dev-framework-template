# Record Checkpoint

**Command**: `/checkpoint [name] [approved|failed]`

**Purpose**: Record a Codex/code review checkpoint result.

---

## What This Command Does

1. Record the checkpoint:

```bash
node lib/claude-orchestrator.js checkpoint [name] [true|false]
```

2. Report to user and show remaining checkpoints.

---

## Available Checkpoints

### DISCOVER Phase
- `brief_review` - Brief reviewed and approved

### DESIGN Phase
- `spec_review` - Spec reviewed and approved
- `test_strategy_review` - Test strategy approved

### BUILD Phase
- `migration_review` - Database migrations reviewed
- `api_review` - API routes reviewed
- `ui_review` - UI components reviewed
- `integration_review` - Integration tests pass

### FINALIZE Phase
- `final_review` - Final security + performance review

---

## Usage Examples

```
/checkpoint brief_review approved
/checkpoint api_review approved
/checkpoint final_review failed
```

---

## Output Format

### Approved

```
✅ CHECKPOINT RECORDED
═══════════════════════════════════════

Checkpoint: [name]
Status: APPROVED

Remaining checkpoints for [phase]:
  [list or "None - ready to advance"]

═══════════════════════════════════════
```

### Failed

```
⚠️ CHECKPOINT FAILED
═══════════════════════════════════════

Checkpoint: [name]
Status: FAILED

The review found issues. Please:
1. Address the feedback
2. Re-run /review-code
3. Record checkpoint again when approved

═══════════════════════════════════════
```

---

## Related Commands

- `/review-code` - Run code review first
- `/status` - Check all checkpoints
- `/advance-phase` - Move to next phase
