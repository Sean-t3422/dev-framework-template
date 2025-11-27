# Feature Status

**Command**: `/status`

**Purpose**: Show current feature development status, phase, and next actions.

---

## What This Command Does

Run the state-manager to get current workflow state:

```bash
node lib/state-manager.js status
```

Then report to user in this format:

```
📊 WORKFLOW STATUS
═══════════════════════════════════════

[If no active feature:]
No active feature in progress.

To start a new feature:
  /start-feature "description of what you want to build"

[If active feature:]
Feature: [featureId]
Description: [description]
Phase: [DISCOVER | DESIGN | BUILD | FINALIZE]
Started: [timestamp]

Progress:
  ✅ DISCOVER - [completed/in_progress/pending]
  [status icon] DESIGN - [status]
  [status icon] BUILD - [status]
  [status icon] FINALIZE - [status]

Artifacts:
  Brief: [✅ Created | ⏳ Pending]
  Spec: [✅ Created | ⏳ Pending]

Pending Checkpoints: [list or "None"]

Next Actions:
  1. [action description]
  2. [action description]

═══════════════════════════════════════
```

---

## Related Commands

- `/start-feature` - Start a new feature
- `/advance-phase` - Move to next phase
- `/checkpoint` - Record a review checkpoint
- `/review-code` - Run code review
