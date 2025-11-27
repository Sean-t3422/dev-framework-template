# Start Feature

**Command**: `/start-feature [description]`

**Purpose**: Initialize a new feature with state tracking.

---

## What This Command Does

1. Run the claude-orchestrator to start tracking:

```bash
node lib/claude-orchestrator.js start "[description from user]"
```

2. Report the result to user:

```
🚀 FEATURE STARTED
═══════════════════════════════════════

Feature ID: [featureId]
Description: [description]
Phase: DISCOVER

Next Steps:
1. Ask discovery questions to understand requirements
2. Create brief with brief-writer agent
3. Get brief reviewed with /review-code
4. Record checkpoint with /checkpoint brief_review

═══════════════════════════════════════
```

3. Begin the DISCOVER phase by asking discovery questions:

Ask the user 15-20 questions about:
- Core functionality needed
- User roles involved
- Data entities required
- Business rules and constraints
- Security requirements
- UI/UX expectations
- Integration points
- Edge cases to handle

---

## Example Usage

User: `/start-feature Add student enrollment management`

Claude:
1. Runs `node lib/claude-orchestrator.js start "Add student enrollment management"`
2. Reports feature started
3. Asks discovery questions about enrollment workflow

---

## If Feature Already Active

If there's already an active feature, report:

```
⚠️ ACTIVE FEATURE EXISTS
═══════════════════════════════════════

Current feature: [featureId]
Phase: [phase]

Options:
1. Continue with current feature: /status
2. Abandon current feature: /abandon-feature
3. Complete current feature first

═══════════════════════════════════════
```

---

## Related Commands

- `/status` - Check current status
- `/abandon-feature` - Abandon current feature
- `/checkpoint` - Record review checkpoints
